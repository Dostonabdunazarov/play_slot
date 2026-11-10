using System.ComponentModel.DataAnnotations;

namespace PlaySlot.Application.DTOs.Bookings;

public record CreateBookingRequest(
    Guid VenueId,
    [property: StringLength(100, MinimumLength = 1)] string ClientName,
    [property: StringLength(32, MinimumLength = 1)] string ClientPhone,
    DateOnly Date, TimeOnly StartTime,
    [property: MaxLength(1000)] string? Notes);
