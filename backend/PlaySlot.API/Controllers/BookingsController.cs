using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PlaySlot.Application.DTOs.Bookings;
using PlaySlot.Application.Interfaces;
using PlaySlot.Domain.Entities;
using PlaySlot.Domain.Enums;
using PlaySlot.Infrastructure.Data;

namespace PlaySlot.API.Controllers;

[ApiController]
[Route("api/bookings")]
[Authorize]
public class BookingsController(AppDbContext db, INotificationService notifications) : ControllerBase
{
    // The business operates in Uzbekistan (UTC+5). IANA id works on Linux/macOS
    // and modern Windows; fall back to a fixed +5 offset if the tz db is absent.
    private static readonly TimeZoneInfo Tz = ResolveTashkentTz();

    private static TimeZoneInfo ResolveTashkentTz()
    {
        foreach (var id in new[] { "Asia/Tashkent", "Uzbekistan Standard Time" })
        {
            try { return TimeZoneInfo.FindSystemTimeZoneById(id); }
            catch (TimeZoneNotFoundException) { }
            catch (InvalidTimeZoneException) { }
        }
        return TimeZoneInfo.CreateCustomTimeZone("UZT", TimeSpan.FromHours(5), "Uzbekistan Time", "UZT");
    }

    private static DateTime NowInTashkent() =>
        TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, Tz);

    private static BookingDto ToDto(Booking b) =>
        new(b.Id, b.VenueId, b.Venue.Name, b.UserId,
            b.User?.FullName ?? "",
            b.ClientName, b.ClientPhone,
            b.Date, b.StartTime, b.EndTime,
            b.TotalAmount, b.PrepaymentAmount,
            b.PaymentStatus.ToString(), b.Notes, b.Status.ToString(),
            b.CreatedAt);

    // Public: guests (not logged in) may view a venue's schedule to see which
    // slots are busy. Personal details are masked for anyone who isn't the admin
    // or the booking's owner (see below), so anonymous callers only see "busy".
    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetByVenueAndDate([FromQuery] Guid venueId, [FromQuery] DateOnly date)
    {
        var bookings = await db.Bookings
            .Include(b => b.Venue)
            .Include(b => b.User)
            .Where(b => b.VenueId == venueId && b.Date == date && b.Status == BookingStatus.Active)
            .OrderBy(b => b.StartTime)
            .ToListAsync();

        // Admins see full client details; regular users only need to know a slot is
        // taken — hide other clients' name/phone to avoid leaking personal data.
        var isAdmin = User.IsInRole("Admin");
        var currentUserId = Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var uid) ? uid : (Guid?)null;

        return Ok(bookings.Select(b =>
            isAdmin || b.UserId == currentUserId ? ToDto(b) : ToMaskedDto(b)));
    }

    // Slot is shown as busy but personal details are stripped.
    private static BookingDto ToMaskedDto(Booking b) =>
        new(b.Id, b.VenueId, b.Venue.Name, b.UserId,
            "",
            "Занято", "",
            b.Date, b.StartTime, b.EndTime,
            0, 0,
            b.PaymentStatus.ToString(), null, b.Status.ToString(),
            b.CreatedAt);

    [HttpGet("all")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetAll([FromQuery] Guid? venueId, [FromQuery] DateOnly? date)
    {
        var query = db.Bookings.Include(b => b.Venue).Include(b => b.User).AsQueryable();

        if (venueId.HasValue)
            query = query.Where(b => b.VenueId == venueId.Value);
        if (date.HasValue)
            query = query.Where(b => b.Date == date.Value);

        var bookings = await query.OrderByDescending(b => b.CreatedAt).ToListAsync();
        return Ok(bookings.Select(ToDto));
    }

    [HttpGet("my")]
    public async Task<IActionResult> GetMy()
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var bookings = await db.Bookings
            .Include(b => b.Venue)
            .Include(b => b.User)
            .Where(b => b.UserId == userId)
            .OrderByDescending(b => b.CreatedAt)
            .ToListAsync();
        return Ok(bookings.Select(ToDto));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateBookingRequest request)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var venue = await db.Venues.FindAsync(request.VenueId);
        if (venue is null || !venue.IsActive)
            return BadRequest(new { message = "Venue not found or inactive" });

        var endTime = request.StartTime.AddHours(1);

        // Reject slots that start in the past. The business runs in Uzbekistan
        // (UTC+5), so compare against "now" in that timezone, not UTC.
        var slotStart = request.Date.ToDateTime(request.StartTime);
        if (slotStart < NowInTashkent())
            return BadRequest(new { message = "Cannot book a time slot in the past" });

        var conflict = await db.Bookings.AnyAsync(b =>
            b.VenueId == request.VenueId &&
            b.Date == request.Date &&
            b.Status == BookingStatus.Active &&
            b.StartTime < endTime &&
            b.EndTime > request.StartTime);

        if (conflict)
            return Conflict(new { message = "Time slot is already booked" });

        if (request.StartTime < venue.OpenTime || endTime > venue.CloseTime)
            return BadRequest(new { message = "Booking is outside venue operating hours" });

        var booking = new Booking
        {
            VenueId = request.VenueId,
            UserId = userId,
            ClientName = request.ClientName,
            ClientPhone = request.ClientPhone,
            Date = request.Date,
            StartTime = request.StartTime,
            EndTime = endTime,
            TotalAmount = venue.PricePerHour,
            Notes = request.Notes
        };

        db.Bookings.Add(booking);
        await db.SaveChangesAsync();

        await db.Entry(booking).Reference(b => b.Venue).LoadAsync();
        await db.Entry(booking).Reference(b => b.User).LoadAsync();
        await notifications.NotifyBookingCreatedAsync(booking);
        return CreatedAtAction(nameof(GetAll), new { id = booking.Id }, ToDto(booking));
    }

    [HttpPatch("{id:guid}/payment")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdatePayment(Guid id, [FromBody] UpdatePaymentRequest request)
    {
        var booking = await db.Bookings.Include(b => b.Venue).Include(b => b.User).FirstOrDefaultAsync(b => b.Id == id);
        if (booking is null) return NotFound();

        if (!Enum.TryParse<PaymentStatus>(request.PaymentStatus, true, out var status))
            return BadRequest(new { message = "Invalid payment status. Use: Unpaid, Prepaid, FullyPaid" });

        booking.PaymentStatus = status;
        booking.PrepaymentAmount = request.PrepaymentAmount;
        await db.SaveChangesAsync();

        return Ok(ToDto(booking));
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Cancel(Guid id)
    {
        var booking = await db.Bookings.Include(b => b.Venue).Include(b => b.User).FirstOrDefaultAsync(b => b.Id == id);
        if (booking is null) return NotFound();
        if (booking.Status == BookingStatus.Cancelled)
            return BadRequest(new { message = "Booking is already cancelled" });

        booking.Status = BookingStatus.Cancelled;
        booking.CancelledAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        await notifications.NotifyBookingCancelledAsync(booking);
        return NoContent();
    }
}
