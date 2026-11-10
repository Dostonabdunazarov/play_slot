using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using PlaySlot.Application.DTOs.Auth;
using PlaySlot.Infrastructure.Data;

namespace PlaySlot.API.Controllers;

[ApiController]
[Route("api/users/me")]
[Authorize]
public class AccountController(AppDbContext db) : ControllerBase
{
    [HttpPut("password")]
    [EnableRateLimiting("password")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
    {
        if (!Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var userId))
            return Unauthorized();

        var user = await db.Users.FirstOrDefaultAsync(u => u.Id == userId);
        if (user is null) return Unauthorized();

        if (!BCrypt.Net.BCrypt.Verify(request.CurrentPassword, user.PasswordHash))
            return BadRequest(new { message = "Current password is incorrect" });

        if (request.CurrentPassword == request.NewPassword)
            return BadRequest(new { message = "New password must differ from the current one" });

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        await db.SaveChangesAsync();
        return NoContent();
    }
}
