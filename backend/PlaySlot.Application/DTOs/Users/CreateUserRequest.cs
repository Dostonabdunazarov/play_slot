namespace PlaySlot.Application.DTOs.Users;

public record CreateUserRequest(string FullName, string Phone, string Email, string Password, string Role);
