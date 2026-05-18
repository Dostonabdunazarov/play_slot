namespace PlaySlot.Application.DTOs.Bookings;

public record UpdatePaymentRequest(string PaymentStatus, decimal? PrepaymentAmount);
