using System.ComponentModel.DataAnnotations;

namespace PlaySlot.Application.DTOs.Auth;

public record LoginRequest(
    [property: MaxLength(254)] string Email,
    [property: MaxLength(128)] string Password);
