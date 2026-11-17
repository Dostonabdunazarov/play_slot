using System.Globalization;
using System.Net.Http.Json;
using PlaySlot.Application.Interfaces;
using PlaySlot.Domain.Entities;
using PlaySlot.Domain.Enums;

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
    private readonly string? _botUsername = config["Telegram:BotUsername"]?.TrimStart('@');
    private readonly string _baseUrl = (config["App:PublicBaseUrl"] ?? "https://play.hypex.site").TrimEnd('/');

    private bool BotEnabled => !string.IsNullOrWhiteSpace(_botToken);
    private bool Enabled => BotEnabled && !string.IsNullOrWhiteSpace(_chatId);

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

    public Task NotifyRequestCreatedAsync(BookingRequest request, CancellationToken ct = default)
    {
        var deadline = TashkentClock.ToLocal(request.ExpiresAt);
        var text =
            $"🟦 <b>Новая заявка с сайта</b>\n" +
            $"🏟 {Escape(request.Venue?.Name)}\n" +
            $"📅 {request.Date:dd.MM.yyyy} · {Range(request)} ({request.HoursCount} ч)\n" +
            $"👤 {Escape(request.ClientName)} · {Escape(request.ClientPhone)}\n" +
            $"💰 {Money(request.TotalAmount)} сум\n" +
            (request.Comment is null ? "" : $"💬 {Escape(request.Comment)}\n") +
            $"⏳ Ответить до {deadline:HH\\:mm}\n" +
            $"{_baseUrl}/requests/{request.Id}";
        return SendAsync(text, ct);
    }

    public Task NotifyRequestCancelledByGuestAsync(BookingRequest request, CancellationToken ct = default) =>
        SendAsync(
            $"⚪️ <b>Гость отменил заявку</b>\n" +
            $"🏟 {Escape(request.Venue?.Name)}\n" +
            $"📅 {request.Date:dd.MM.yyyy} · {Range(request)}\n" +
            $"👤 {Escape(request.ClientName)} · {Escape(request.ClientPhone)}",
            ct);

    public Task NotifyGuestStatusAsync(BookingRequest request, CancellationToken ct = default)
    {
        if (request.TelegramChatId is not { } chatId) return Task.CompletedTask;
        return SendToAsync(chatId.ToString(CultureInfo.InvariantCulture), GuestText(request), ct);
    }

    public string? GuestBotLink(string linkToken) =>
        BotEnabled && !string.IsNullOrWhiteSpace(_botUsername)
            ? $"https://t.me/{_botUsername}?start={linkToken}"
            : null;

    private string GuestText(BookingRequest r)
    {
        var uz = r.Language == "uz";
        var venue = Escape(r.Venue?.Name);
        var when = $"{r.Date:dd.MM.yyyy} · {Range(r)}";
        switch (r.Status)
        {
            case BookingRequestStatus.Approved:
            {
                var prepayment = r.Venue is null ? null : BookingRequestService.PrepaymentFor(r.Venue, r.TotalAmount);
                var lines = new List<string>
                {
                    uz ? "✅ <b>Bron tasdiqlandi</b>" : "✅ <b>Бронь подтверждена</b>",
                    $"🏟 {venue}" + (string.IsNullOrWhiteSpace(r.Venue?.Address) ? "" : $", {Escape(r.Venue!.Address)}"),
                    $"📅 {when}",
                    (uz ? "💰 Summa: " : "💰 Сумма: ") + $"{Money(r.TotalAmount)} " + (uz ? "so'm" : "сум"),
                };
                if (prepayment is { } p)
                    lines.Add((uz ? "Oldindan to'lov: " : "Предоплата: ") + $"{Money(p)} " + (uz ? "so'm" : "сум"));
                if (!string.IsNullOrWhiteSpace(r.Venue?.PaymentDetails))
                    lines.Add((uz ? "\n<b>To'lov rekvizitlari:</b>\n" : "\n<b>Реквизиты для перевода:</b>\n") + Escape(r.Venue!.PaymentDetails));
                if (!string.IsNullOrWhiteSpace(r.Venue?.Phone))
                    lines.Add((uz ? "📞 Maydon telefoni: " : "📞 Телефон площадки: ") + Escape(r.Venue!.Phone));
                lines.Add($"{_baseUrl}/r/{r.PublicToken}");
                return string.Join("\n", lines);
            }
            case BookingRequestStatus.Rejected:
            {
                var reason = ReasonText(r.RejectReason, uz);
                return (uz ? "❌ <b>Ariza rad etildi</b>\n" : "❌ <b>Заявка отклонена</b>\n") +
                       $"🏟 {venue}\n📅 {when}\n" +
                       (reason is null ? "" : (uz ? "Sabab: " : "Причина: ") + Escape(reason) + "\n") +
                       (uz ? "Boshqa vaqtni tanlang: " : "Выберите другое время: ") + $"{_baseUrl}/venues/{r.VenueId}";
            }
            case BookingRequestStatus.Expired:
                return (uz
                           ? "⌛️ <b>Ariza muddati tugadi</b>\nMenejer javob berishga ulgurmadi. Vaqt yana bo'sh — yangi ariza yuborishingiz mumkin.\n"
                           : "⌛️ <b>Заявка истекла</b>\nМенеджер не успел ответить. Время снова свободно — можно отправить новую заявку.\n") +
                       $"{_baseUrl}/venues/{r.VenueId}";
            case BookingRequestStatus.CancelledByGuest:
                return uz ? "Ariza bekor qilindi." : "Заявка отменена.";
            default:
            {
                var deadline = TashkentClock.ToLocal(r.ExpiresAt);
                return (uz ? "🟦 <b>Ariza qabul qilindi</b>\n" : "🟦 <b>Заявка получена</b>\n") +
                       $"🏟 {venue}\n📅 {when}\n" +
                       (uz
                           ? $"Menejer {deadline:HH\\:mm} gacha javob beradi. Natijani shu yerga yuboramiz."
                           : $"Менеджер ответит до {deadline:HH\\:mm}. Результат пришлём сюда.");
            }
        }
    }

    private static string? ReasonText(string? reason, bool uz) => reason switch
    {
        null => null,
        "slot_taken" => uz ? "Bu vaqt band" : "Время уже занято",
        "no_answer" => uz ? "Sizga qo'ng'iroq qilib bo'lmadi" : "Не дозвонились",
        _ => reason,
    };

    private static string Range(BookingRequest r) => $"{r.StartTime:HH\\:mm}–{r.EndTime:HH\\:mm}";

    private static string Money(decimal amount) =>
        amount.ToString("#,0", CultureInfo.InvariantCulture).Replace(",", " ");

    private Task SendAsync(string text, CancellationToken ct) =>
        Enabled ? SendToAsync(_chatId!, text, ct) : Task.CompletedTask;

    private async Task SendToAsync(string chatId, string text, CancellationToken ct)
    {
        if (!BotEnabled) return;

        try
        {
            var client = httpClientFactory.CreateClient();
            var url = $"https://api.telegram.org/bot{_botToken}/sendMessage";
            var response = await client.PostAsJsonAsync(url, new
            {
                chat_id = chatId,
                text,
                parse_mode = "HTML",
                link_preview_options = new { is_disabled = true },
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
