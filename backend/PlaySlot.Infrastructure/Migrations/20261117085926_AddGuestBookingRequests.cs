using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PlaySlot.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddGuestBookingRequests : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Bookings_VenueId_Date_StartTime",
                table: "Bookings");

            migrationBuilder.AddColumn<string>(
                name: "PaymentDetails",
                table: "Venues",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<decimal>(
                name: "PrepaymentFixed",
                table: "Venues",
                type: "numeric(18,2)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "PrepaymentPercent",
                table: "Venues",
                type: "integer",
                nullable: true);

            migrationBuilder.AlterColumn<Guid>(
                name: "UserId",
                table: "Bookings",
                type: "uuid",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uuid");

            migrationBuilder.AddColumn<Guid>(
                name: "BookingRequestId",
                table: "Bookings",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "BookingRequests",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    VenueId = table.Column<Guid>(type: "uuid", nullable: false),
                    Date = table.Column<DateOnly>(type: "date", nullable: false),
                    StartTime = table.Column<TimeOnly>(type: "time without time zone", nullable: false),
                    EndTime = table.Column<TimeOnly>(type: "time without time zone", nullable: false),
                    HoursCount = table.Column<int>(type: "integer", nullable: false),
                    TotalAmount = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    ClientName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    ClientPhone = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    Comment = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Status = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    DecidedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DecidedByUserId = table.Column<Guid>(type: "uuid", nullable: true),
                    RejectReason = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: true),
                    PublicToken = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    Language = table.Column<string>(type: "character varying(5)", maxLength: 5, nullable: false),
                    TelegramChatId = table.Column<long>(type: "bigint", nullable: true),
                    TelegramLinkToken = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    ClientIp = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BookingRequests", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BookingRequests_Users_DecidedByUserId",
                        column: x => x.DecidedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_BookingRequests_Venues_VenueId",
                        column: x => x.VenueId,
                        principalTable: "Venues",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Bookings_BookingRequestId",
                table: "Bookings",
                column: "BookingRequestId");

            migrationBuilder.CreateIndex(
                name: "IX_Bookings_VenueId_Date_StartTime",
                table: "Bookings",
                columns: new[] { "VenueId", "Date", "StartTime" },
                unique: true,
                filter: "\"Status\" IN ('Active', 'Pending')");

            migrationBuilder.CreateIndex(
                name: "IX_BookingRequests_ClientPhone_Status",
                table: "BookingRequests",
                columns: new[] { "ClientPhone", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_BookingRequests_DecidedByUserId",
                table: "BookingRequests",
                column: "DecidedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_BookingRequests_PublicToken",
                table: "BookingRequests",
                column: "PublicToken",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_BookingRequests_Status_ExpiresAt",
                table: "BookingRequests",
                columns: new[] { "Status", "ExpiresAt" });

            migrationBuilder.CreateIndex(
                name: "IX_BookingRequests_TelegramLinkToken",
                table: "BookingRequests",
                column: "TelegramLinkToken",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_BookingRequests_VenueId",
                table: "BookingRequests",
                column: "VenueId");

            migrationBuilder.AddForeignKey(
                name: "FK_Bookings_BookingRequests_BookingRequestId",
                table: "Bookings",
                column: "BookingRequestId",
                principalTable: "BookingRequests",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Bookings_BookingRequests_BookingRequestId",
                table: "Bookings");

            migrationBuilder.DropTable(
                name: "BookingRequests");

            migrationBuilder.DropIndex(
                name: "IX_Bookings_BookingRequestId",
                table: "Bookings");

            migrationBuilder.DropIndex(
                name: "IX_Bookings_VenueId_Date_StartTime",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "PaymentDetails",
                table: "Venues");

            migrationBuilder.DropColumn(
                name: "PrepaymentFixed",
                table: "Venues");

            migrationBuilder.DropColumn(
                name: "PrepaymentPercent",
                table: "Venues");

            migrationBuilder.DropColumn(
                name: "BookingRequestId",
                table: "Bookings");

            migrationBuilder.AlterColumn<Guid>(
                name: "UserId",
                table: "Bookings",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Bookings_VenueId_Date_StartTime",
                table: "Bookings",
                columns: new[] { "VenueId", "Date", "StartTime" },
                unique: true,
                filter: "\"Status\" = 'Active'");
        }
    }
}
