namespace PlaySlot.Application.DTOs.Users;

public record UserDto(Guid Id, string FullName, string Phone, string Email, string Role, DateTime CreatedAt);
