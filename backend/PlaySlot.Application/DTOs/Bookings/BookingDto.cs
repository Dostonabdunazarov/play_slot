namespace PlaySlot.Application.DTOs.Bookings;

public record BookingDto(
    Guid Id, Guid VenueId, string VenueName, Guid UserId,
    string ClientName, string ClientPhone,
    DateOnly Date, TimeOnly StartTime, TimeOnly EndTime,
    decimal TotalAmount, decimal? PrepaymentAmount,
    string PaymentStatus, string? Notes, string Status,
    DateTime CreatedAt);
