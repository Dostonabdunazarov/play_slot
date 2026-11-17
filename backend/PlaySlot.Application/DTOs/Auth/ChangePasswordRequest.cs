using System.ComponentModel.DataAnnotations;

namespace PlaySlot.Application.DTOs.Auth;

public record ChangePasswordRequest(
    [MaxLength(128)] string CurrentPassword,
    [StringLength(128, MinimumLength = 10)] string NewPassword);
