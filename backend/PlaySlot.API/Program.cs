using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using PlaySlot.Infrastructure.Data;
using PlaySlot.Application.Interfaces;
using PlaySlot.API.Services;
using Scalar.AspNetCore;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddOpenApi();
builder.Services.AddEndpointsApiExplorer();

var isProduction = builder.Environment.IsProduction();

// DB
var connectionString = builder.Configuration.GetConnectionString("Default")
    ?? "Host=localhost;Database=playslot;Username=postgres;Password=postgres";
builder.Services.AddDbContext<AppDbContext>(opt =>
    opt.UseNpgsql(connectionString));

if (isProduction && connectionString.Contains("Password=postgres", StringComparison.OrdinalIgnoreCase))
    throw new InvalidOperationException(
        "The default database password is not allowed in production. Set POSTGRES_PASSWORD in the .env file.");

// JWT — env var `Jwt__Key` maps onto the `Jwt:Key` configuration path automatically.
const string devJwtKey = "super-secret-key-32chars-minimum!";
var jwtKey = builder.Configuration["Jwt:Key"] ?? devJwtKey;
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "PlaySlot";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "PlaySlot";

// In production the JWT signing key MUST be a real secret, not the dev default.
if (isProduction && (jwtKey == devJwtKey || jwtKey.Length < 32))
    throw new InvalidOperationException(
        "Jwt__Key must be set to a strong secret (>= 32 chars) in production. " +
        "Set it via the JWT_KEY environment variable / .env file.");

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(opt =>
    {
        opt.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtIssuer,
            ValidAudience = jwtAudience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };
    });

builder.Services.AddAuthorization();
builder.Services.AddScoped<ITokenService>(sp => new TokenService(jwtKey, jwtIssuer, jwtAudience));

// Notifications (Telegram) — no-op unless Telegram__BotToken / Telegram__AdminChatId are set.
builder.Services.AddHttpClient();
builder.Services.AddScoped<INotificationService, TelegramNotificationService>();

// CORS — wide open in development; restricted to configured origins in production.
// Set `Cors__AllowedOrigins` as a comma/semicolon-separated list (e.g. "https://play.hypex.site").
var allowedOrigins = (builder.Configuration["Cors:AllowedOrigins"] ?? "")
    .Split([',', ';'], StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

builder.Services.AddCors(opt =>
    opt.AddDefaultPolicy(p =>
    {
        if (isProduction)
        {
            if (allowedOrigins.Length == 0)
                throw new InvalidOperationException(
                    "Cors__AllowedOrigins must list at least one origin in production.");
            p.WithOrigins(allowedOrigins).AllowAnyMethod().AllowAnyHeader().AllowCredentials();
        }
        else
        {
            p.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader();
        }
    }));

var app = builder.Build();

if (app.Environment.IsDevelopment())
    app.UseHttpsRedirection();
app.UseCors();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference();
}

// Auto-migrate and seed
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await DbSeeder.SeedAsync(db);
}

app.Run();
