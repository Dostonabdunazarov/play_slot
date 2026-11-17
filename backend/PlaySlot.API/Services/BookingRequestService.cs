using System.Security.Cryptography;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using PlaySlot.Application.DTOs.Requests;
using PlaySlot.Application.Interfaces;
using PlaySlot.Domain.Entities;
using PlaySlot.Domain.Enums;
using PlaySlot.Infrastructure.Data;

namespace PlaySlot.API.Services;

public enum RequestError
{
    None,
    VenueNotFound,
    InvalidPhone,
    InvalidTime,
    OutsideHours,
    TooSoon,
    PhoneLimit,
    SlotTaken,
}

public enum DecisionResult { Ok, NotFound, NotPending, Expired }

public class BookingRequestService(AppDbContext db, INotificationService notifications)
{
    public static readonly TimeSpan Lifetime = TimeSpan.FromHours(1);
    public static readonly TimeSpan MinLead = TimeSpan.FromHours(1);
    public const int MaxPendingPerPhone = 2;
    public const int MaxHours = 3;

    public static readonly string[] SupportedLanguages = ["ru", "uz"];

    public static string? NormalizePhone(string raw)
    {
        var digits = new string(raw.Where(char.IsDigit).ToArray());
        if (digits.Length == 9) return "+998" + digits;
        if (digits.Length == 12 && digits.StartsWith("998")) return "+" + digits;
        return null;
    }

    public static string NewToken(int bytes) =>
        Convert.ToBase64String(RandomNumberGenerator.GetBytes(bytes))
            .TrimEnd('=').Replace('+', '-').Replace('/', '_');

    public static decimal? PrepaymentFor(Venue venue, decimal total)
    {
        if (venue.PrepaymentFixed is { } fixedAmount && fixedAmount > 0)
            return Math.Min(fixedAmount, total);
        if (venue.PrepaymentPercent is { } percent && percent > 0)
            return Math.Round(total * percent / 100m, 0, MidpointRounding.AwayFromZero);
        return null;
    }

    public async Task<(BookingRequest? Request, RequestError Error)> CreateAsync(
        CreateGuestRequest input, string? clientIp, CancellationToken ct = default)
    {
        var venue = await db.Venues.FirstOrDefaultAsync(v => v.Id == input.VenueId, ct);
        if (venue is null || !venue.IsActive) return (null, RequestError.VenueNotFound);

        var phone = NormalizePhone(input.ClientPhone);
        if (phone is null) return (null, RequestError.InvalidPhone);

        if (input.Hours is < 1 or > MaxHours
            || input.StartTime.Ticks % TimeSpan.TicksPerHour != 0
            || input.StartTime.Hour + input.Hours > 23)
            return (null, RequestError.InvalidTime);

        var start = input.StartTime;
        var end = start.AddHours(input.Hours);
        if (start < venue.OpenTime || end > venue.CloseTime)
            return (null, RequestError.OutsideHours);

        var startUtc = TashkentClock.ToUtc(input.Date, start);
        var nowUtc = DateTime.UtcNow;
        if (startUtc - nowUtc < MinLead) return (null, RequestError.TooSoon);

        var pendingForPhone = await db.BookingRequests.CountAsync(
            r => r.ClientPhone == phone && r.Status == BookingRequestStatus.Pending && r.ExpiresAt > nowUtc, ct);
        if (pendingForPhone >= MaxPendingPerPhone) return (null, RequestError.PhoneLimit);

        var conflict = await db.Bookings.AnyAsync(b =>
            b.VenueId == venue.Id &&
            b.Date == input.Date &&
            (b.Status == BookingStatus.Active || b.Status == BookingStatus.Pending) &&
            b.StartTime < end &&
            b.EndTime > start, ct);
        if (conflict) return (null, RequestError.SlotTaken);

        var language = input.Language is not null && SupportedLanguages.Contains(input.Language) ? input.Language : "ru";
        var expiresAt = nowUtc + Lifetime < startUtc ? nowUtc + Lifetime : startUtc;
        var name = input.ClientName.Trim();
        var comment = string.IsNullOrWhiteSpace(input.Comment) ? null : input.Comment.Trim();

        var request = new BookingRequest
        {
            VenueId = venue.Id,
            Venue = venue,
            Date = input.Date,
            StartTime = start,
            EndTime = end,
            HoursCount = input.Hours,
            TotalAmount = venue.PricePerHour * input.Hours,
            ClientName = name,
            ClientPhone = phone,
            Comment = comment,
            ExpiresAt = expiresAt,
            CreatedAt = nowUtc,
            PublicToken = NewToken(24),
            TelegramLinkToken = NewToken(16),
            Language = language,
            ClientIp = clientIp,
        };

        for (var i = 0; i < input.Hours; i++)
        {
            var slotStart = start.AddHours(i);
            request.Bookings.Add(new Booking
            {
                VenueId = venue.Id,
                ClientName = name,
                ClientPhone = phone,
                Date = input.Date,
                StartTime = slotStart,
                EndTime = slotStart.AddHours(1),
                TotalAmount = venue.PricePerHour,
                Notes = comment,
                Status = BookingStatus.Pending,
                CreatedAt = nowUtc,
            });
        }

        db.BookingRequests.Add(request);
        try
        {
            await db.SaveChangesAsync(ct);
        }
        catch (DbUpdateException ex) when (ex.InnerException is PostgresException { SqlState: PostgresErrorCodes.UniqueViolation })
        {
            return (null, RequestError.SlotTaken);
        }

        await notifications.NotifyRequestCreatedAsync(request, ct);
        return (request, RequestError.None);
    }

    public async Task<DecisionResult> ApproveAsync(Guid id, Guid userId, CancellationToken ct = default)
    {
        var now = DateTime.UtcNow;
        await using var tx = await db.Database.BeginTransactionAsync(ct);
        var updated = await db.BookingRequests
            .Where(r => r.Id == id && r.Status == BookingRequestStatus.Pending && r.ExpiresAt > now)
            .ExecuteUpdateAsync(s => s
                .SetProperty(r => r.Status, BookingRequestStatus.Approved)
                .SetProperty(r => r.DecidedAt, now)
                .SetProperty(r => r.DecidedByUserId, userId), ct);
        if (updated == 0)
        {
            await tx.RollbackAsync(ct);
            return await ExplainFailureAsync(id, ct);
        }

        await db.Bookings
            .Where(b => b.BookingRequestId == id && b.Status == BookingStatus.Pending)
            .ExecuteUpdateAsync(s => s
                .SetProperty(b => b.Status, BookingStatus.Active)
                .SetProperty(b => b.UserId, userId), ct);
        await tx.CommitAsync(ct);

        await NotifyGuestAsync(id, ct);
        return DecisionResult.Ok;
    }

    public async Task<DecisionResult> RejectAsync(Guid id, Guid userId, string? reason, CancellationToken ct = default)
    {
        var now = DateTime.UtcNow;
        var cleanReason = string.IsNullOrWhiteSpace(reason) ? null : reason.Trim();
        await using var tx = await db.Database.BeginTransactionAsync(ct);
        var updated = await db.BookingRequests
            .Where(r => r.Id == id && r.Status == BookingRequestStatus.Pending)
            .ExecuteUpdateAsync(s => s
                .SetProperty(r => r.Status, BookingRequestStatus.Rejected)
                .SetProperty(r => r.DecidedAt, now)
                .SetProperty(r => r.DecidedByUserId, userId)
                .SetProperty(r => r.RejectReason, cleanReason), ct);
        if (updated == 0)
        {
            await tx.RollbackAsync(ct);
            return await ExplainFailureAsync(id, ct);
        }

        await ReleaseBookingsAsync(id, BookingStatus.Rejected, now, ct);
        await tx.CommitAsync(ct);

        await NotifyGuestAsync(id, ct);
        return DecisionResult.Ok;
    }

    public async Task<DecisionResult> CancelByGuestAsync(string token, CancellationToken ct = default)
    {
        var now = DateTime.UtcNow;
        var id = await db.BookingRequests
            .Where(r => r.PublicToken == token)
            .Select(r => (Guid?)r.Id)
            .FirstOrDefaultAsync(ct);
        if (id is null) return DecisionResult.NotFound;

        await using var tx = await db.Database.BeginTransactionAsync(ct);
        var updated = await db.BookingRequests
            .Where(r => r.Id == id && r.Status == BookingRequestStatus.Pending && r.ExpiresAt > now)
            .ExecuteUpdateAsync(s => s
                .SetProperty(r => r.Status, BookingRequestStatus.CancelledByGuest)
                .SetProperty(r => r.DecidedAt, now), ct);
        if (updated == 0)
        {
            await tx.RollbackAsync(ct);
            return await ExplainFailureAsync(id.Value, ct);
        }

        await ReleaseBookingsAsync(id.Value, BookingStatus.Cancelled, now, ct);
        await tx.CommitAsync(ct);

        var request = await LoadAsync(id.Value, ct);
        if (request is not null)
            await notifications.NotifyRequestCancelledByGuestAsync(request, ct);
        return DecisionResult.Ok;
    }

    public async Task<bool> ExpireAsync(Guid id, CancellationToken ct = default)
    {
        var now = DateTime.UtcNow;
        await using var tx = await db.Database.BeginTransactionAsync(ct);
        var updated = await db.BookingRequests
            .Where(r => r.Id == id && r.Status == BookingRequestStatus.Pending && r.ExpiresAt <= now)
            .ExecuteUpdateAsync(s => s
                .SetProperty(r => r.Status, BookingRequestStatus.Expired)
                .SetProperty(r => r.DecidedAt, now), ct);
        if (updated == 0)
        {
            await tx.RollbackAsync(ct);
            return false;
        }

        await ReleaseBookingsAsync(id, BookingStatus.Expired, now, ct);
        await tx.CommitAsync(ct);

        await NotifyGuestAsync(id, ct);
        return true;
    }

    public async Task<int> ExpireDueAsync(CancellationToken ct = default)
    {
        var now = DateTime.UtcNow;
        var due = await db.BookingRequests
            .Where(r => r.Status == BookingRequestStatus.Pending && r.ExpiresAt <= now)
            .Select(r => r.Id)
            .ToListAsync(ct);

        var count = 0;
        foreach (var id in due)
            if (await ExpireAsync(id, ct)) count++;
        return count;
    }

    public Task<BookingRequest?> LoadAsync(Guid id, CancellationToken ct = default) =>
        db.BookingRequests
            .AsNoTracking()
            .Include(r => r.Venue)
            .Include(r => r.DecidedBy)
            .FirstOrDefaultAsync(r => r.Id == id, ct);

    private Task<int> ReleaseBookingsAsync(Guid requestId, BookingStatus status, DateTime now, CancellationToken ct) =>
        db.Bookings
            .Where(b => b.BookingRequestId == requestId && b.Status == BookingStatus.Pending)
            .ExecuteUpdateAsync(s => s
                .SetProperty(b => b.Status, status)
                .SetProperty(b => b.CancelledAt, now), ct);

    private async Task<DecisionResult> ExplainFailureAsync(Guid id, CancellationToken ct)
    {
        var request = await db.BookingRequests.AsNoTracking().FirstOrDefaultAsync(r => r.Id == id, ct);
        if (request is null) return DecisionResult.NotFound;
        if (request.Status == BookingRequestStatus.Pending && request.ExpiresAt <= DateTime.UtcNow)
        {
            await ExpireAsync(id, ct);
            return DecisionResult.Expired;
        }
        return request.Status == BookingRequestStatus.Expired ? DecisionResult.Expired : DecisionResult.NotPending;
    }

    private async Task NotifyGuestAsync(Guid id, CancellationToken ct)
    {
        var request = await LoadAsync(id, ct);
        if (request?.TelegramChatId is not null)
            await notifications.NotifyGuestStatusAsync(request, ct);
    }
}
