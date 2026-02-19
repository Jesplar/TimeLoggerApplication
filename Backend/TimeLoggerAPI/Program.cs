using Microsoft.EntityFrameworkCore;
using TimeLoggerAPI.Data;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddOpenApi();

// Configure SQL Server LocalDB database
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") 
    ?? "Server=(localdb)\\mssqllocaldb;Database=TimeLogger;Trusted_Connection=true;MultipleActiveResultSets=true";

builder.Services.AddDbContext<TimeLoggerContext>(options =>
    options.UseSqlServer(connectionString));

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

// Ensure database is created and migrations are applied
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<TimeLoggerContext>();
    context.Database.EnsureCreated();
}

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors("ElectronPolicy");
app.MapControllers();

app.Run();
