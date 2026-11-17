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
    public DbSet<BookingRequest> BookingRequests => Set<BookingRequest>();

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
            e.Property(x => x.PrepaymentFixed).HasColumnType("decimal(18,2)");
            e.Property(x => x.PaymentDetails).HasMaxLength(1000);
        });

        modelBuilder.Entity<Booking>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.PaymentStatus).HasConversion<string>();
            e.Property(x => x.Status).HasConversion<string>();
            e.Property(x => x.TotalAmount).HasColumnType("decimal(18,2)");
            e.Property(x => x.PrepaymentAmount).HasColumnType("decimal(18,2)");
            e.HasOne(x => x.Venue).WithMany(v => v.Bookings).HasForeignKey(x => x.VenueId);
            e.HasOne(x => x.User).WithMany(u => u.Bookings).HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.BookingRequest).WithMany(r => r.Bookings).HasForeignKey(x => x.BookingRequestId).OnDelete(DeleteBehavior.SetNull);
            e.HasIndex(x => new { x.VenueId, x.Date, x.StartTime })
                .IsUnique()
                .HasFilter("\"Status\" IN ('Active', 'Pending')");
        });

        modelBuilder.Entity<BookingRequest>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Status).HasConversion<string>().HasMaxLength(32);
            e.Property(x => x.TotalAmount).HasColumnType("decimal(18,2)");
            e.Property(x => x.ClientName).HasMaxLength(100);
            e.Property(x => x.ClientPhone).HasMaxLength(32);
            e.Property(x => x.Comment).HasMaxLength(500);
            e.Property(x => x.RejectReason).HasMaxLength(300);
            e.Property(x => x.PublicToken).HasMaxLength(64);
            e.Property(x => x.TelegramLinkToken).HasMaxLength(64);
            e.Property(x => x.Language).HasMaxLength(5);
            e.Property(x => x.ClientIp).HasMaxLength(64);
            e.HasOne(x => x.Venue).WithMany().HasForeignKey(x => x.VenueId);
            e.HasOne(x => x.DecidedBy).WithMany().HasForeignKey(x => x.DecidedByUserId).OnDelete(DeleteBehavior.SetNull);
            e.HasIndex(x => x.PublicToken).IsUnique();
            e.HasIndex(x => x.TelegramLinkToken).IsUnique();
            e.HasIndex(x => new { x.Status, x.ExpiresAt });
            e.HasIndex(x => new { x.ClientPhone, x.Status });
        });
    }
}
