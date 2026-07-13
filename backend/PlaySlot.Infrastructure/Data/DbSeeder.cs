using Microsoft.EntityFrameworkCore;
using PlaySlot.Domain.Entities;
using PlaySlot.Domain.Enums;

namespace PlaySlot.Infrastructure.Data;

public static class DbSeeder
{
    public static async Task SeedAsync(AppDbContext context)
    {
        await context.Database.MigrateAsync();

        if (!await context.Users.AnyAsync())
        {
            context.Users.Add(new User
            {
                FullName = "Administrator",
                Email = "admin@playslot.uz",
                Phone = "+998901234567",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin123!"),
                Role = UserRole.Admin
            });
        }

        if (!await context.Venues.AnyAsync())
        {
            context.Venues.AddRange(
                new Venue
                {
                    Name = "Стадион Центральный",
                    Address = "ул. Навои 1, Ташкент",
                    Phone = "+998711234567",
                    Description = "Профессиональное поле с искусственным газоном",
                    ImageUrl = "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=800&q=80",
                    PricePerHour = 150000,
                    OpenTime = new TimeOnly(8, 0),
                    CloseTime = new TimeOnly(23, 0)
                },
                new Venue
                {
                    Name = "Мини-футбол Чиланзар",
                    Address = "Чиланзарский р-н, 14 квартал",
                    Phone = "+998712345678",
                    Description = "Крытый манеж, всегда в хорошем состоянии",
                    ImageUrl = "https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=800&q=80",
                    PricePerHour = 100000,
                    OpenTime = new TimeOnly(7, 0),
                    CloseTime = new TimeOnly(22, 0)
                }
            );
        }

        await context.SaveChangesAsync();
    }
}
