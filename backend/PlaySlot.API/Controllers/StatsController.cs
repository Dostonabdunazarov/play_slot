using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PlaySlot.Application.DTOs.Stats;
using PlaySlot.Domain.Enums;
using PlaySlot.Infrastructure.Data;

namespace PlaySlot.API.Controllers;

[ApiController]
[Route("api/stats")]
[Authorize(Roles = "Admin")]
public class StatsController(AppDbContext db) : ControllerBase
{
    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboard([FromQuery] DateOnly? from, [FromQuery] DateOnly? to)
    {
        // Default to the last 30 days (inclusive) when no range is supplied.
        var toDate = to ?? DateOnly.FromDateTime(DateTime.UtcNow);
        var fromDate = from ?? toDate.AddDays(-29);
        if (fromDate > toDate) (fromDate, toDate) = (toDate, fromDate);

        var bookings = await db.Bookings
            .Include(b => b.Venue)
            .Where(b => b.Date >= fromDate && b.Date <= toDate)
            .ToListAsync();

        var active = bookings.Where(b => b.Status == BookingStatus.Active).ToList();

        static decimal Paid(Domain.Entities.Booking b) => b.PaymentStatus switch
        {
            PaymentStatus.FullyPaid => b.TotalAmount,
            PaymentStatus.Prepaid => b.PrepaymentAmount ?? 0,
            _ => 0,
        };

        var paidRevenue = active.Sum(Paid);
        var expectedRevenue = active.Sum(b => b.TotalAmount);

        var revenueByDay = active
            .GroupBy(b => b.Date)
            .Select(g => new RevenuePointDto(g.Key, g.Sum(Paid), g.Count()))
            .OrderBy(p => p.Date)
            .ToList();

        var venueLoad = active
            .GroupBy(b => new { b.VenueId, b.Venue.Name })
            .Select(g => new VenueLoadDto(
                g.Key.VenueId,
                g.Key.Name,
                g.Count(),
                g.Sum(b => (int)Math.Round((b.EndTime - b.StartTime).TotalHours)),
                g.Sum(Paid)))
            .OrderByDescending(v => v.PaidRevenue)
            .ToList();

        var bookingsByHour = active
            .GroupBy(b => b.StartTime.Hour)
            .Select(g => new HourLoadDto(g.Key, g.Count()))
            .OrderBy(h => h.Hour)
            .ToList();

        var dto = new DashboardStatsDto(
            fromDate,
            toDate,
            paidRevenue,
            expectedRevenue,
            OutstandingAmount: expectedRevenue - paidRevenue,
            TotalBookings: bookings.Count,
            ActiveBookings: active.Count,
            CancelledBookings: bookings.Count(b => b.Status == BookingStatus.Cancelled),
            UnpaidCount: active.Count(b => b.PaymentStatus == PaymentStatus.Unpaid),
            RevenueByDay: revenueByDay,
            VenueLoad: venueLoad,
            BookingsByHour: bookingsByHour);

        return Ok(dto);
    }
}
