using System.ComponentModel.DataAnnotations;

namespace PlaySlot.Application.DTOs.Bookings;

public record UpdatePaymentRequest(
    [MaxLength(20)] string PaymentStatus,
    [Range(0, 1000000000)] decimal? PrepaymentAmount);
