using PlaySlot.Domain.Entities;

namespace PlaySlot.Application.Interfaces;

public interface ITokenService
{
    string GenerateToken(User user);
}
