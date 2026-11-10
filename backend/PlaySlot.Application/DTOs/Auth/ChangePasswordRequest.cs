using System.ComponentModel.DataAnnotations;

namespace PlaySlot.Application.DTOs.Auth;

public record ChangePasswordRequest(
    [property: MaxLength(128)] string CurrentPassword,
    [property: StringLength(128, MinimumLength = 10)] string NewPassword);
