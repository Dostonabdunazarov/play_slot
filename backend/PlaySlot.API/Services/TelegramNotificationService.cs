using System.Net.Http.Json;
using PlaySlot.Application.Interfaces;
using PlaySlot.Domain.Entities;

namespace PlaySlot.API.Services;

// Posts booking events to a Telegram chat via the Bot API.
// Configuration (env / .env):
//   Telegram__BotToken   — bot token from @BotFather
//   Telegram__AdminChatId — chat id that should receive notifications
// If either is missing the service is a no-op, so local dev works without a bot.
public class TelegramNotificationService(
    IHttpClientFactory httpClientFactory,
    IConfiguration config,
    ILogger<TelegramNotificationService> logger) : INotificationService
{
    private readonly string? _botToken = config["Telegram:BotToken"];
    private readonly string? _chatId = config["Telegram:AdminChatId"];

    private bool Enabled => !string.IsNullOrWhiteSpace(_botToken) && !string.IsNullOrWhiteSpace(_chatId);

    public Task NotifyBookingCreatedAsync(Booking booking, CancellationToken ct = default) =>
        SendAsync(
            $"🟢 <b>Новая бронь</b>\n" +
            $"🏟 {Escape(booking.Venue?.Name)}\n" +
            $"👤 {Escape(booking.ClientName)} · {Escape(booking.ClientPhone)}\n" +
            $"📅 {booking.Date:dd.MM.yyyy} · {booking.StartTime:HH\\:mm}–{booking.EndTime:HH\\:mm}\n" +
            $"💰 {booking.TotalAmount:N0} сум",
            ct);

    public Task NotifyBookingCancelledAsync(Booking booking, CancellationToken ct = default) =>
        SendAsync(
            $"🔴 <b>Бронь отменена</b>\n" +
            $"🏟 {Escape(booking.Venue?.Name)}\n" +
            $"👤 {Escape(booking.ClientName)}\n" +
            $"📅 {booking.Date:dd.MM.yyyy} · {booking.StartTime:HH\\:mm}–{booking.EndTime:HH\\:mm}",
            ct);

    private async Task SendAsync(string text, CancellationToken ct)
    {
        if (!Enabled) return;

        try
        {
            var client = httpClientFactory.CreateClient();
            var url = $"https://api.telegram.org/bot{_botToken}/sendMessage";
            var response = await client.PostAsJsonAsync(url, new
            {
                chat_id = _chatId,
                text,
                parse_mode = "HTML",
            }, ct);

            if (!response.IsSuccessStatusCode)
            {
                var body = await response.Content.ReadAsStringAsync(ct);
                logger.LogWarning("Telegram sendMessage failed: {Status} {Body}", response.StatusCode, body);
            }
        }
        catch (Exception ex)
        {
            // Never let a notification failure break the booking flow.
            logger.LogWarning(ex, "Failed to send Telegram notification");
        }
    }

    private static string Escape(string? s) =>
        (s ?? "").Replace("&", "&amp;").Replace("<", "&lt;").Replace(">", "&gt;");
}
