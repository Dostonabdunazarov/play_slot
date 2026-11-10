using System.ComponentModel.DataAnnotations;

namespace PlaySlot.Application.DTOs.Bookings;

public record UpdatePaymentRequest(
    [property: MaxLength(20)] string PaymentStatus,
    [property: Range(0, 1000000000)] decimal? PrepaymentAmount);
