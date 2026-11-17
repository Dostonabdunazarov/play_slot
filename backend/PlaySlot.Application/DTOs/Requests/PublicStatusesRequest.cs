using System.ComponentModel.DataAnnotations;

namespace PlaySlot.Application.DTOs.Requests;

public record PublicStatusesRequest([MaxLength(20)] string[] Tokens);
