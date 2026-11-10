using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PlaySlot.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddUniqueActiveBookingSlot : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Bookings_VenueId",
                table: "Bookings");

            migrationBuilder.CreateIndex(
                name: "IX_Bookings_VenueId_Date_StartTime",
                table: "Bookings",
                columns: new[] { "VenueId", "Date", "StartTime" },
                unique: true,
                filter: "\"Status\" = 'Active'");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Bookings_VenueId_Date_StartTime",
                table: "Bookings");

            migrationBuilder.CreateIndex(
                name: "IX_Bookings_VenueId",
                table: "Bookings",
                column: "VenueId");
        }
    }
}
