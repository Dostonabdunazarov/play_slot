namespace PlaySlot.API.Services;

public class BookingRequestExpiryService(
    IServiceScopeFactory scopeFactory,
    ILogger<BookingRequestExpiryService> logger) : BackgroundService
{
    private static readonly TimeSpan Interval = TimeSpan.FromMinutes(1);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(Interval);
        do
        {
            try
            {
                using var scope = scopeFactory.CreateScope();
                var service = scope.ServiceProvider.GetRequiredService<BookingRequestService>();
                var expired = await service.ExpireDueAsync(stoppingToken);
                if (expired > 0)
                    logger.LogInformation("Expired {Count} booking requests", expired);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Booking request expiry pass failed");
            }
        } while (await timer.WaitForNextTickAsync(stoppingToken));
    }
}
