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
    IReadOnlyList<RevenuePointDto> RevenueByDay,
    IReadOnlyList<VenueLoadDto> VenueLoad,
    IReadOnlyList<HourLoadDto> BookingsByHour);

// Paid revenue and booking count for a single calendar day.
public record RevenuePointDto(DateOnly Date, decimal PaidRevenue, int Bookings);

// How busy a venue is in the range: bookings count, hours booked, paid revenue.
public record VenueLoadDto(Guid VenueId, string VenueName, int Bookings, int HoursBooked, decimal PaidRevenue);

// Number of bookings that start at a given hour of day (0–23) — reveals peak hours.
public record HourLoadDto(int Hour, int Bookings);
