using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PlaySlot.Application.DTOs.Users;
using PlaySlot.Domain.Entities;
using PlaySlot.Domain.Enums;
using PlaySlot.Infrastructure.Data;

namespace PlaySlot.API.Controllers;

[ApiController]
[Route("api/users")]
[Authorize(Roles = "Admin")]
public class UsersController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var users = await db.Users
            .OrderBy(u => u.FullName)
            .Select(u => new UserDto(u.Id, u.FullName, u.Phone, u.Email, u.Role.ToString(), u.CreatedAt))
            .ToListAsync();
        return Ok(users);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateUserRequest request)
    {
        if (!Enum.TryParse<UserRole>(request.Role, true, out var role))
            return BadRequest(new { message = "Invalid role. Use 'User' or 'Admin'" });

        if (await db.Users.AnyAsync(u => u.Email == request.Email))
            return Conflict(new { message = "Email already in use" });

        var user = new User
        {
            FullName = request.FullName,
            Phone = request.Phone,
            Email = request.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            Role = role
        };

        db.Users.Add(user);
        await db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetAll), new UserDto(user.Id, user.FullName, user.Phone, user.Email, user.Role.ToString(), user.CreatedAt));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var user = await db.Users.FindAsync(id);
        if (user is null) return NotFound();

        // Prevent an admin from deleting their own account.
        var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (currentUserId is not null && Guid.TryParse(currentUserId, out var uid) && uid == id)
            return BadRequest(new { message = "You cannot delete your own account" });

        // Never allow removing the last remaining admin.
        if (user.Role == UserRole.Admin)
        {
            var adminCount = await db.Users.CountAsync(u => u.Role == UserRole.Admin);
            if (adminCount <= 1)
                return BadRequest(new { message = "Cannot delete the last admin account" });
        }

        // Block deletion if the user still has bookings (would violate the FK).
        if (await db.Bookings.AnyAsync(b => b.UserId == id))
            return Conflict(new { message = "Cannot delete a user who has bookings" });

        db.Users.Remove(user);
        await db.SaveChangesAsync();
        return NoContent();
    }
}
