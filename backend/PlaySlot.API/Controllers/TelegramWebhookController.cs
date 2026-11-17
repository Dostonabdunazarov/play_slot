using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PlaySlot.Application.Interfaces;
using PlaySlot.Infrastructure.Data;

namespace PlaySlot.API.Controllers;

[ApiController]
[Route("api/telegram")]
[AllowAnonymous]
public class TelegramWebhookController(
    AppDbContext db,
    INotificationService notifications,
    IConfiguration config,
    ILogger<TelegramWebhookController> logger) : ControllerBase
{
    [HttpPost("webhook")]
    public async Task<IActionResult> Webhook([FromBody] JsonElement update, CancellationToken ct)
    {
        var secret = config["Telegram:WebhookSecret"];
        var header = Request.Headers["X-Telegram-Bot-Api-Secret-Token"].ToString();
        if (string.IsNullOrWhiteSpace(secret) || !SecretMatches(secret, header))
            return Unauthorized();

        try
        {
            if (!update.TryGetProperty("message", out var message)) return Ok();
            if (!message.TryGetProperty("chat", out var chat) || !chat.TryGetProperty("id", out var chatIdEl)) return Ok();
            if (chat.TryGetProperty("type", out var type) && type.GetString() != "private") return Ok();
            if (!message.TryGetProperty("text", out var textEl)) return Ok();

            var text = textEl.GetString() ?? "";
            if (!text.StartsWith("/start ", StringComparison.Ordinal)) return Ok();

            var linkToken = text["/start ".Length..].Trim();
            if (linkToken.Length is 0 or > 64) return Ok();

            var request = await db.BookingRequests
                .Include(r => r.Venue)
                .FirstOrDefaultAsync(r => r.TelegramLinkToken == linkToken, ct);
            if (request is null) return Ok();

            request.TelegramChatId = chatIdEl.GetInt64();
            request.TelegramLinkToken = null;
            await db.SaveChangesAsync(ct);

            await notifications.NotifyGuestStatusAsync(request, ct);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Failed to handle Telegram update");
        }

        return Ok();
    }

    private static bool SecretMatches(string expected, string actual) =>
        CryptographicOperations.FixedTimeEquals(Encoding.UTF8.GetBytes(expected), Encoding.UTF8.GetBytes(actual));
}
