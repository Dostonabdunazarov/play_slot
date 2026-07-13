using PlaySlot.Domain.Entities;

namespace PlaySlot.Application.Interfaces;

// Sends operational notifications (currently to the admin Telegram chat).
// Implementations must never throw into the request path — failures are logged, not propagated.
public interface INotificationService
{
    Task NotifyBookingCreatedAsync(Booking booking, CancellationToken ct = default);
    Task NotifyBookingCancelledAsync(Booking booking, CancellationToken ct = default);
}
