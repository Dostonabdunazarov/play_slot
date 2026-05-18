namespace PlaySlot.Application.DTOs.Venues;

public record UpdateVenueRequest(
    string Name, string Address, string Phone,
    string Description, string ImageUrl,
    decimal PricePerHour, TimeOnly OpenTime, TimeOnly CloseTime, bool IsActive);
