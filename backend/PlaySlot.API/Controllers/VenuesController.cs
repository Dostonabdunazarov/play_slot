using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PlaySlot.Application.DTOs.Venues;
using PlaySlot.Domain.Entities;
using PlaySlot.Infrastructure.Data;

namespace PlaySlot.API.Controllers;

[ApiController]
[Route("api/venues")]
public class VenuesController(AppDbContext db) : ControllerBase
{
    private static VenueDto ToDto(Venue v) =>
        new(v.Id, v.Name, v.Address, v.Phone, v.Description, v.ImageUrl,
            v.PricePerHour, v.OpenTime, v.CloseTime, v.IsActive, v.CreatedAt);

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var venues = await db.Venues
            .Where(v => v.IsActive)
            .OrderBy(v => v.Name)
            .ToListAsync();
        return Ok(venues.Select(ToDto));
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var venue = await db.Venues.FindAsync(id);
        if (venue is null) return NotFound();
        return Ok(ToDto(venue));
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Create([FromBody] CreateVenueRequest request)
    {
        var venue = new Venue
        {
            Name = request.Name,
            Address = request.Address,
            Phone = request.Phone,
            Description = request.Description,
            ImageUrl = request.ImageUrl,
            PricePerHour = request.PricePerHour,
            OpenTime = request.OpenTime,
            CloseTime = request.CloseTime
        };

        db.Venues.Add(venue);
        await db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = venue.Id }, ToDto(venue));
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateVenueRequest request)
    {
        var venue = await db.Venues.FindAsync(id);
        if (venue is null) return NotFound();

        venue.Name = request.Name;
        venue.Address = request.Address;
        venue.Phone = request.Phone;
        venue.Description = request.Description;
        venue.ImageUrl = request.ImageUrl;
        venue.PricePerHour = request.PricePerHour;
        venue.OpenTime = request.OpenTime;
        venue.CloseTime = request.CloseTime;
        venue.IsActive = request.IsActive;

        await db.SaveChangesAsync();
        return Ok(ToDto(venue));
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var venue = await db.Venues.FindAsync(id);
        if (venue is null) return NotFound();

        venue.IsActive = false;
        await db.SaveChangesAsync();
        return NoContent();
    }
}
