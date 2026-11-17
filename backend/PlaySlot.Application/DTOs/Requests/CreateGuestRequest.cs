using System.ComponentModel.DataAnnotations;

namespace PlaySlot.Application.DTOs.Requests;

public record CreateGuestRequest(
    Guid VenueId,
    DateOnly Date,
    TimeOnly StartTime,
    [Range(1, 3)] int Hours,
    [StringLength(100, MinimumLength = 1)] string ClientName,
    [StringLength(32, MinimumLength = 1)] string ClientPhone,
    [MaxLength(500)] string? Comment,
    [MaxLength(5)] string? Language,
    [MaxLength(200)] string? Website);
