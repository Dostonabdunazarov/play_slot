using Microsoft.EntityFrameworkCore;
using PlaySlot.Domain.Entities;
using PlaySlot.Domain.Enums;

namespace PlaySlot.Infrastructure.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Venue> Venues => Set<Venue>();
    public DbSet<Booking> Bookings => Set<Booking>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Role).HasConversion<string>();
            e.HasIndex(x => x.Email).IsUnique();
        });

        modelBuilder.Entity<Venue>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.PricePerHour).HasColumnType("decimal(18,2)");
        });

        modelBuilder.Entity<Booking>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.PaymentStatus).HasConversion<string>();
            e.Property(x => x.Status).HasConversion<string>();
            e.Property(x => x.TotalAmount).HasColumnType("decimal(18,2)");
            e.Property(x => x.PrepaymentAmount).HasColumnType("decimal(18,2)");
            e.HasOne(x => x.Venue).WithMany(v => v.Bookings).HasForeignKey(x => x.VenueId);
            e.HasOne(x => x.User).WithMany(u => u.Bookings).HasForeignKey(x => x.UserId);
        });
    }
}
