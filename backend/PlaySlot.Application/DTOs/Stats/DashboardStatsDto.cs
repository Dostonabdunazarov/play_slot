namespace PlaySlot.Application.DTOs.Stats;

// Aggregated numbers for the admin dashboard over the requested date range.
public record DashboardStatsDto(
    DateOnly From,
    DateOnly To,
    // "Paid" revenue = FullyPaid → TotalAmount, Prepaid → PrepaymentAmount, Unpaid → 0.
    decimal PaidRevenue,
    // What was booked in total (regardless of payment) — for reference.
    decimal ExpectedRevenue,
    // Outstanding = ExpectedRevenue - PaidRevenue for active bookings.
    decimal OutstandingAmount,
    int TotalBookings,
    int ActiveBookings,
    int CancelledBookings,
    int UnpaidCount,
    IReadOnlyList<VenueLoadDto> VenueLoad);

// How busy a venue is in the range: bookings count, hours booked, paid revenue, outstanding amount.
public record VenueLoadDto(Guid VenueId, string VenueName, int Bookings, int HoursBooked, decimal PaidRevenue, decimal OutstandingAmount);
