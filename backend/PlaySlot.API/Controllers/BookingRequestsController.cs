using System.Net;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using PlaySlot.API.Services;
using PlaySlot.Application.DTOs.Requests;
using PlaySlot.Application.Interfaces;
using PlaySlot.Domain.Entities;
using PlaySlot.Domain.Enums;
using PlaySlot.Infrastructure.Data;

namespace PlaySlot.API.Controllers;

[ApiController]
[Route("api/booking-requests")]
[Authorize(Roles = "User,Admin")]
public class BookingRequestsController(
    AppDbContext db,
    BookingRequestService requests,
    INotificationService notifications) : ControllerBase
{
    [HttpPost]
    [AllowAnonymous]
    [EnableRateLimiting("guest-request")]
    public async Task<IActionResult> Create([FromBody] CreateGuestRequest input, CancellationToken ct)
    {
        if (!string.IsNullOrEmpty(input.Website))
            return Ok(new { token = BookingRequestService.NewToken(24) });

        var (request, error) = await requests.CreateAsync(input, ClientIp(), ct);
        return error switch
        {
            RequestError.None => Ok(ToGuestDto(request!)),
            RequestError.VenueNotFound => Problem(StatusCodes.Status404NotFound, "venue_not_found", "Venue not found or inactive"),
            RequestError.InvalidPhone => Problem(StatusCodes.Status400BadRequest, "invalid_phone", "Phone must be an Uzbek number"),
            RequestError.InvalidTime => Problem(StatusCodes.Status400BadRequest, "invalid_time", "Pick 1 to 3 whole hours within one day"),
            RequestError.OutsideHours => Problem(StatusCodes.Status400BadRequest, "outside_hours", "Outside venue operating hours"),
            RequestError.TooSoon => Problem(StatusCodes.Status400BadRequest, "too_soon", "This slot starts too soon to book online"),
            RequestError.PhoneLimit => Problem(StatusCodes.Status429TooManyRequests, "phone_limit", "Too many pending requests for this phone"),
            RequestError.SlotTaken => Problem(StatusCodes.Status409Conflict, "slot_taken", "Time slot is already taken"),
            _ => StatusCode(StatusCodes.Status500InternalServerError),
        };
    }

    [HttpGet("public/{token}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetPublic(string token, CancellationToken ct)
    {
        var request = await FindByTokenAsync(token, ct);
        return request is null ? NotFound() : Ok(ToGuestDto(request));
    }

    [HttpPost("public/statuses")]
    [AllowAnonymous]
    public async Task<IActionResult> GetPublicStatuses([FromBody] PublicStatusesRequest input, CancellationToken ct)
    {
        var tokens = (input.Tokens ?? []).Where(t => !string.IsNullOrWhiteSpace(t)).Distinct().Take(20).ToArray();
        if (tokens.Length == 0) return Ok(Array.Empty<GuestRequestDto>());

        var now = DateTime.UtcNow;
        var dueIds = await db.BookingRequests
            .Where(r => tokens.Contains(r.PublicToken) && r.Status == BookingRequestStatus.Pending && r.ExpiresAt <= now)
            .Select(r => r.Id)
            .ToListAsync(ct);
        foreach (var id in dueIds)
            await requests.ExpireAsync(id, ct);

        var list = await db.BookingRequests
            .AsNoTracking()
            .Include(r => r.Venue)
            .Where(r => tokens.Contains(r.PublicToken))
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync(ct);
        return Ok(list.Select(ToGuestDto));
    }

    [HttpPost("public/{token}/cancel")]
    [AllowAnonymous]
    public async Task<IActionResult> CancelByGuest(string token, CancellationToken ct)
    {
        var result = await requests.CancelByGuestAsync(token, ct);
        if (result != DecisionResult.Ok) return DecisionProblem(result);
        var request = await FindByTokenAsync(token, ct);
        return request is null ? NotFound() : Ok(ToGuestDto(request));
    }

    [HttpGet]
    public async Task<IActionResult> GetList([FromQuery] string? status, CancellationToken ct)
    {
        await requests.ExpireDueAsync(ct);

        var query = db.BookingRequests.AsNoTracking().Include(r => r.Venue).Include(r => r.DecidedBy).AsQueryable();
        if (string.Equals(status, "all", StringComparison.OrdinalIgnoreCase))
        {
            var recent = await query.OrderByDescending(r => r.CreatedAt).Take(100).ToListAsync(ct);
            return Ok(recent.Select(ToStaffDto));
        }

        var pending = await query
            .Where(r => r.Status == BookingRequestStatus.Pending)
            .OrderBy(r => r.ExpiresAt)
            .ToListAsync(ct);
        return Ok(pending.Select(ToStaffDto));
    }

    [HttpGet("pending-count")]
    public async Task<IActionResult> GetPendingCount(CancellationToken ct)
    {
        var now = DateTime.UtcNow;
        var count = await db.BookingRequests.CountAsync(
            r => r.Status == BookingRequestStatus.Pending && r.ExpiresAt > now, ct);
        return Ok(new { count });
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var request = await requests.LoadAsync(id, ct);
        if (request is null) return NotFound();
        if (request.Status == BookingRequestStatus.Pending && request.ExpiresAt <= DateTime.UtcNow)
        {
            await requests.ExpireAsync(id, ct);
            request = await requests.LoadAsync(id, ct);
        }
        return Ok(ToStaffDto(request!));
    }

    [HttpPost("{id:guid}/approve")]
    public async Task<IActionResult> Approve(Guid id, CancellationToken ct)
    {
        var result = await requests.ApproveAsync(id, CurrentUserId(), ct);
        if (result != DecisionResult.Ok) return DecisionProblem(result);
        return Ok(ToStaffDto((await requests.LoadAsync(id, ct))!));
    }

    [HttpPost("{id:guid}/reject")]
    public async Task<IActionResult> Reject(Guid id, [FromBody] RejectRequest input, CancellationToken ct)
    {
        var result = await requests.RejectAsync(id, CurrentUserId(), input.Reason, ct);
        if (result != DecisionResult.Ok) return DecisionProblem(result);
        return Ok(ToStaffDto((await requests.LoadAsync(id, ct))!));
    }

    private async Task<BookingRequest?> FindByTokenAsync(string token, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(token) || token.Length > 64) return null;
        var request = await db.BookingRequests.AsNoTracking().Include(r => r.Venue)
            .FirstOrDefaultAsync(r => r.PublicToken == token, ct);
        if (request is { Status: BookingRequestStatus.Pending } && request.ExpiresAt <= DateTime.UtcNow
            && await requests.ExpireAsync(request.Id, ct))
        {
            request = await db.BookingRequests.AsNoTracking().Include(r => r.Venue)
                .FirstOrDefaultAsync(r => r.PublicToken == token, ct);
        }
        return request;
    }

    private GuestRequestDto ToGuestDto(BookingRequest r)
    {
        var approved = r.Status == BookingRequestStatus.Approved;
        var showBot = r.TelegramChatId is null && r.TelegramLinkToken is not null
            && r.Status is BookingRequestStatus.Pending or BookingRequestStatus.Approved;
        return new GuestRequestDto(
            r.PublicToken,
            r.Status.ToString(),
            r.VenueId,
            r.Venue.Name,
            r.Venue.Address,
            r.Venue.Phone,
            r.Date,
            r.StartTime,
            r.EndTime,
            r.HoursCount,
            r.TotalAmount,
            r.ClientName,
            r.CreatedAt,
            r.ExpiresAt,
            r.DecidedAt,
            r.RejectReason,
            r.Language,
            r.TelegramChatId is not null,
            showBot ? notifications.GuestBotLink(r.TelegramLinkToken!) : null,
            approved && !string.IsNullOrWhiteSpace(r.Venue.PaymentDetails) ? r.Venue.PaymentDetails : null,
            approved ? BookingRequestService.PrepaymentFor(r.Venue, r.TotalAmount) : null);
    }

    private static StaffRequestDto ToStaffDto(BookingRequest r) =>
        new(
            r.Id,
            r.Status.ToString(),
            r.VenueId,
            r.Venue.Name,
            r.Date,
            r.StartTime,
            r.EndTime,
            r.HoursCount,
            r.TotalAmount,
            BookingRequestService.PrepaymentFor(r.Venue, r.TotalAmount),
            r.ClientName,
            r.ClientPhone,
            r.Comment,
            r.Language,
            r.CreatedAt,
            r.ExpiresAt,
            r.DecidedAt,
            r.DecidedBy?.FullName,
            r.RejectReason,
            r.TelegramChatId is not null);

    private IActionResult DecisionProblem(DecisionResult result) => result switch
    {
        DecisionResult.NotFound => NotFound(),
        DecisionResult.Expired => Problem(StatusCodes.Status409Conflict, "expired", "The request has expired"),
        _ => Problem(StatusCodes.Status409Conflict, "already_decided", "The request has already been processed"),
    };

    private ObjectResult Problem(int status, string code, string message) =>
        StatusCode(status, new { code, message });

    private Guid CurrentUserId() => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    private string? ClientIp()
    {
        var cf = Request.Headers["CF-Connecting-IP"].ToString();
        if (IPAddress.TryParse(cf, out var cfIp)) return cfIp.ToString();
        return HttpContext.Connection.RemoteIpAddress?.ToString();
    }
}
