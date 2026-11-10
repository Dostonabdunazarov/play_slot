using System.ComponentModel.DataAnnotations;
using PlaySlot.Application.Validation;

namespace PlaySlot.Application.DTOs.Venues;

public record CreateVenueRequest(
    [property: StringLength(200, MinimumLength = 1)] string Name,
    [property: StringLength(300)] string Address,
    [property: StringLength(32)] string Phone,
    [property: StringLength(2000)] string Description,
    [property: HttpsUrl, MaxLength(500)] string ImageUrl,
    [property: Range(0.01, 1000000000)] decimal PricePerHour,
    TimeOnly OpenTime, TimeOnly CloseTime) : IValidatableObject
{
    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (OpenTime >= CloseTime)
            yield return new ValidationResult("OpenTime must be earlier than CloseTime.", [nameof(OpenTime), nameof(CloseTime)]);
    }
}
