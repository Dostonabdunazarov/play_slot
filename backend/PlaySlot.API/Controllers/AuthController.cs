using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using PlaySlot.Application.DTOs.Auth;
using PlaySlot.Application.DTOs.Users;
using PlaySlot.Application.Interfaces;
using PlaySlot.Infrastructure.Data;
using BCrypt.Net;

namespace PlaySlot.API.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(AppDbContext db, ITokenService tokenService) : ControllerBase
{
    private static readonly string DummyHash = BCrypt.Net.BCrypt.HashPassword("dummy-password-for-timing");

    [HttpPost("login")]
    [EnableRateLimiting("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
        var passwordValid = BCrypt.Net.BCrypt.Verify(request.Password, user?.PasswordHash ?? DummyHash);
        if (user is null || !passwordValid)
            return Unauthorized(new { message = "Invalid email or password" });

        var token = tokenService.GenerateToken(user);
        var userDto = new UserDto(user.Id, user.FullName, user.Phone, user.Email, user.Role.ToString(), user.CreatedAt);
        return Ok(new AuthResponse(token, userDto));
    }
}
