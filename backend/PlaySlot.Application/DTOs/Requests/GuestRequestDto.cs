namespace PlaySlot.Application.DTOs.Requests;

public record GuestRequestDto(
    string Token,
    string Status,
    Guid VenueId,
    string VenueName,
    string VenueAddress,
    string VenuePhone,
    DateOnly Date,
    TimeOnly StartTime,
    TimeOnly EndTime,
    int Hours,
    decimal TotalAmount,
    string ClientName,
    DateTime CreatedAt,
    DateTime ExpiresAt,
    DateTime? DecidedAt,
    string? RejectReason,
    string Language,
    bool TelegramLinked,
    string? TelegramUrl,
    string? PaymentDetails,
    decimal? PrepaymentAmount);
