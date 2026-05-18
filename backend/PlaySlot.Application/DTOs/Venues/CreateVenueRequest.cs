namespace PlaySlot.Application.DTOs.Venues;

public record CreateVenueRequest(
    string Name, string Address, string Phone,
    string Description, string ImageUrl,
    decimal PricePerHour, TimeOnly OpenTime, TimeOnly CloseTime);
