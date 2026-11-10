using System.ComponentModel.DataAnnotations;

namespace PlaySlot.Application.DTOs.Users;

public record CreateUserRequest(
    [property: StringLength(100, MinimumLength = 1)] string FullName,
    [property: StringLength(32, MinimumLength = 1)] string Phone,
    [property: EmailAddress, MaxLength(254)] string Email,
    [property: StringLength(128, MinimumLength = 10)] string Password,
    [property: MaxLength(20)] string Role);
