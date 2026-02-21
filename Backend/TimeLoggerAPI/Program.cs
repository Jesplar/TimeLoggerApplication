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

// Ensure database exists (use CanConnect instead of EnsureCreated for existing databases)
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<TimeLoggerContext>();
    try
    {
        // Try to connect - if it fails, create the database
        if (!context.Database.CanConnect())
        {
            context.Database.EnsureCreated();
        }
    }
    catch
    {
        // If connection fails, try to create
        context.Database.EnsureCreated();
    }
}

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors("ElectronPolicy");
app.MapControllers();

app.Run();
