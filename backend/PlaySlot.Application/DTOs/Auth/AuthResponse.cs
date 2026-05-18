using PlaySlot.Application.DTOs.Users;

namespace PlaySlot.Application.DTOs.Auth;

public record AuthResponse(string Token, UserDto User);
