using System.ComponentModel.DataAnnotations;
using PlaySlot.Application.Validation;

namespace PlaySlot.Application.DTOs.Venues;

public record CreateVenueRequest(
    [StringLength(200, MinimumLength = 1)] string Name,
    [StringLength(300)] string Address,
    [StringLength(32)] string Phone,
    [StringLength(2000)] string Description,
    [HttpsUrl, MaxLength(500)] string ImageUrl,
    [Range(0.01, 1000000000)] decimal PricePerHour,
    TimeOnly OpenTime, TimeOnly CloseTime,
    [MaxLength(1000)] string? PaymentDetails = null,
    [Range(1, 100)] int? PrepaymentPercent = null,
    [Range(0, 1000000000)] decimal? PrepaymentFixed = null) : IValidatableObject
{
    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (OpenTime >= CloseTime)
            yield return new ValidationResult("OpenTime must be earlier than CloseTime.", [nameof(OpenTime), nameof(CloseTime)]);
        if (PrepaymentPercent is not null && PrepaymentFixed is not null)
            yield return new ValidationResult("Set either PrepaymentPercent or PrepaymentFixed, not both.", [nameof(PrepaymentPercent), nameof(PrepaymentFixed)]);
    }
}
