namespace PlaySlot.Application.DTOs.Requests;

public record StaffRequestDto(
    Guid Id,
    string Status,
    Guid VenueId,
    string VenueName,
    DateOnly Date,
    TimeOnly StartTime,
    TimeOnly EndTime,
    int Hours,
    decimal TotalAmount,
    decimal? PrepaymentAmount,
    string ClientName,
    string ClientPhone,
    string? Comment,
    string Language,
    DateTime CreatedAt,
    DateTime ExpiresAt,
    DateTime? DecidedAt,
    string? DecidedByName,
    string? RejectReason,
    bool TelegramLinked);
