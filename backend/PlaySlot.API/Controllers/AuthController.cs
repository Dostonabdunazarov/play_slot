using Microsoft.AspNetCore.Mvc;
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
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
        if (user is null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            return Unauthorized(new { message = "Invalid email or password" });

        var token = tokenService.GenerateToken(user);
        var userDto = new UserDto(user.Id, user.FullName, user.Phone, user.Email, user.Role.ToString(), user.CreatedAt);
        return Ok(new AuthResponse(token, userDto));
    }
}
