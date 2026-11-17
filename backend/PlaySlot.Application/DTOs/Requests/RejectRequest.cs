using System.ComponentModel.DataAnnotations;

namespace PlaySlot.Application.DTOs.Requests;

public record RejectRequest([MaxLength(300)] string? Reason);
