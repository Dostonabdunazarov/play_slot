namespace PlaySlot.Application.DTOs.Bookings;

public record CreateBookingRequest(
    Guid VenueId, string ClientName, string ClientPhone,
    DateOnly Date, TimeOnly StartTime, string? Notes);
