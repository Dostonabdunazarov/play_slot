using System.ComponentModel.DataAnnotations;

namespace PlaySlot.Application.DTOs.Users;

public record CreateUserRequest(
    [StringLength(100, MinimumLength = 1)] string FullName,
    [StringLength(32, MinimumLength = 1)] string Phone,
    [EmailAddress, MaxLength(254)] string Email,
    [StringLength(128, MinimumLength = 10)] string Password,
    [MaxLength(20)] string Role);
