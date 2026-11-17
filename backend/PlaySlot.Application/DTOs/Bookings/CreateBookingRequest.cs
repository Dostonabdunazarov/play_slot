using System.ComponentModel.DataAnnotations;

namespace PlaySlot.Application.DTOs.Bookings;

public record CreateBookingRequest(
    Guid VenueId,
    [StringLength(100, MinimumLength = 1)] string ClientName,
    [StringLength(32, MinimumLength = 1)] string ClientPhone,
    DateOnly Date, TimeOnly StartTime,
    [MaxLength(1000)] string? Notes);
