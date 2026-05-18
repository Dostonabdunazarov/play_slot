namespace PlaySlot.Application.DTOs.Auth;

public record AuthResponse(string Token, string Role, string FullName, Guid UserId);
