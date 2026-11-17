using PlaySlot.Domain.Enums;

namespace PlaySlot.Domain.Entities;

public class BookingRequest
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid VenueId { get; set; }
    public DateOnly Date { get; set; }
    public TimeOnly StartTime { get; set; }
    public TimeOnly EndTime { get; set; }
    public int HoursCount { get; set; }
    public decimal TotalAmount { get; set; }
    public string ClientName { get; set; } = string.Empty;
    public string ClientPhone { get; set; } = string.Empty;
    public string? Comment { get; set; }
    public BookingRequestStatus Status { get; set; } = BookingRequestStatus.Pending;
    public DateTime ExpiresAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? DecidedAt { get; set; }
    public Guid? DecidedByUserId { get; set; }
    public string? RejectReason { get; set; }
    public string PublicToken { get; set; } = string.Empty;
    public string Language { get; set; } = "ru";
    public long? TelegramChatId { get; set; }
    public string? TelegramLinkToken { get; set; }
    public string? ClientIp { get; set; }

    public Venue Venue { get; set; } = null!;
    public User? DecidedBy { get; set; }
    public ICollection<Booking> Bookings { get; set; } = new List<Booking>();
}
