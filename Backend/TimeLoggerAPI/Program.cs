using Microsoft.EntityFrameworkCore;
using TimeLoggerAPI.Data;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddOpenApi();

// Configure SQLite database
// Priority: 1. DATABASE_PATH env var, 2. appsettings.json, 3. default to timelogger.db
var databasePath = Environment.GetEnvironmentVariable("DATABASE_PATH");
if (string.IsNullOrEmpty(databasePath))
{
    var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
    if (!string.IsNullOrEmpty(connectionString) && connectionString.StartsWith("Data Source="))
    {
        databasePath = connectionString.Replace("Data Source=", "");
    }
    else
    {
        databasePath = "timelogger.db";
    }
}

// Ensure database directory exists
var dbDirectory = Path.GetDirectoryName(Path.GetFullPath(databasePath));
if (!string.IsNullOrEmpty(dbDirectory) && !Directory.Exists(dbDirectory))
{
    Directory.CreateDirectory(dbDirectory);
}

var sqliteConnectionString = $"Data Source={databasePath}";
builder.Services.AddDbContext<TimeLoggerContext>(options =>
    options.UseSqlite(sqliteConnectionString));

// Configure CORS for Electron renderer
builder.Services.AddCors(options =>
{
    options.AddPolicy("ElectronPolicy", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var app = builder.Build();

// Ensure database is created and up to date.
// Handles three cases:
//   1. Brand new database         → MigrateAsync creates everything from scratch
//   2. EnsureCreated legacy DB    → schema exists but __EFMigrationsHistory is missing or empty;
//                                   stamp InitialCreate so MigrateAsync doesn't try to re-create tables
//   3. Already-migrated database  → MigrateAsync is a no-op
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<TimeLoggerContext>();
    var conn = context.Database.GetDbConnection();
    await conn.OpenAsync();

    // Check whether the schema already exists (Customers table is a reliable indicator)
    using var schemaCmd = conn.CreateCommand();
    schemaCmd.CommandText = "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='Customers'";
    var schemaExists = (long)(await schemaCmd.ExecuteScalarAsync() ?? 0L) > 0;

    if (schemaExists)
    {
        // Schema was created by EnsureCreated (or a previous install). Ensure the migrations
        // history table exists and that InitialCreate is stamped so MigrateAsync won't
        // try to re-create tables that are already there.
        using var createHistoryCmd = conn.CreateCommand();
        createHistoryCmd.CommandText = """
            CREATE TABLE IF NOT EXISTS "__EFMigrationsHistory" (
                "MigrationId" TEXT NOT NULL CONSTRAINT "PK___EFMigrationsHistory" PRIMARY KEY,
                "ProductVersion" TEXT NOT NULL
            )
            """;
        await createHistoryCmd.ExecuteNonQueryAsync();

        using var checkStampCmd = conn.CreateCommand();
        checkStampCmd.CommandText = "SELECT COUNT(*) FROM __EFMigrationsHistory WHERE MigrationId = '20260220183348_InitialCreate'";
        var alreadyStamped = (long)(await checkStampCmd.ExecuteScalarAsync() ?? 0L) > 0;

        if (!alreadyStamped)
        {
            using var stampCmd = conn.CreateCommand();
            stampCmd.CommandText = "INSERT INTO __EFMigrationsHistory (MigrationId, ProductVersion) VALUES ('20260220183348_InitialCreate', '10.0.0')";
            await stampCmd.ExecuteNonQueryAsync();
        }
    }

    await conn.CloseAsync();

    // Now safe — applies only migrations newer than what is already stamped
    await context.Database.MigrateAsync();
}

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors("ElectronPolicy");
app.MapControllers();

app.Run();
