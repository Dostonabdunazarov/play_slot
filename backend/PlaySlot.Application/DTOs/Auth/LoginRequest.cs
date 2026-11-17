using System.ComponentModel.DataAnnotations;

namespace PlaySlot.Application.DTOs.Auth;

public record LoginRequest(
    [MaxLength(254)] string Email,
    [MaxLength(128)] string Password);
