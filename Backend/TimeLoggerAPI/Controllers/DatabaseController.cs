using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TimeLoggerAPI.Data;

namespace TimeLoggerAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DatabaseController : ControllerBase
{
    private readonly TimeLoggerContext _context;

    public DatabaseController(TimeLoggerContext context)
    {
        _context = context;
    }

    [HttpGet("location")]
    public ActionResult<object> GetDatabaseLocation()
    {
        try
        {
            var connectionString = _context.Database.GetConnectionString();
            
            // Extract file path from SQLite connection string
            string? databasePath = null;
            if (!string.IsNullOrEmpty(connectionString) && connectionString.StartsWith("Data Source="))
            {
                databasePath = connectionString.Replace("Data Source=", "").Trim();
                // Get absolute path
                databasePath = Path.GetFullPath(databasePath);
            }

            return Ok(new
            {
                path = databasePath ?? "Unknown",
                exists = !string.IsNullOrEmpty(databasePath) && System.IO.File.Exists(databasePath)
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message });
        }
    }

    [HttpGet("mode")]
    public ActionResult<object> GetDatabaseMode()
    {
        try
        {
            // Determine if running in portable mode based on DATABASE_PATH environment variable
            var databasePath = Environment.GetEnvironmentVariable("DATABASE_PATH");
            bool isPortable = !string.IsNullOrEmpty(databasePath) && 
                             !databasePath.Contains(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData));

            string mode = isPortable ? "Portable" : "Installed";
            
            return Ok(new
            {
                mode = mode,
                isPortable = isPortable
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message });
        }
    }

    [HttpGet("info")]
    public ActionResult<object> GetDatabaseInfo()
    {
        try
        {
            var connectionString = _context.Database.GetConnectionString();
            string? databasePath = null;
            
            if (!string.IsNullOrEmpty(connectionString) && connectionString.StartsWith("Data Source="))
            {
                databasePath = connectionString.Replace("Data Source=", "").Trim();
                databasePath = Path.GetFullPath(databasePath);
            }

            var envPath = Environment.GetEnvironmentVariable("DATABASE_PATH");
            bool isPortable = !string.IsNullOrEmpty(envPath) && 
                             !envPath.Contains(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData));

            FileInfo? fileInfo = null;
            if (!string.IsNullOrEmpty(databasePath) && System.IO.File.Exists(databasePath))
            {
                fileInfo = new FileInfo(databasePath);
            }

            return Ok(new
            {
                path = databasePath ?? "Unknown",
                exists = fileInfo != null,
                size = fileInfo?.Length ?? 0,
                sizeFormatted = fileInfo != null ? FormatBytes(fileInfo.Length) : "N/A",
                lastModified = fileInfo?.LastWriteTime,
                mode = isPortable ? "Portable" : "Installed",
                isPortable = isPortable,
                provider = "SQLite"
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message });
        }
    }

    private static string FormatBytes(long bytes)
    {
        string[] sizes = { "B", "KB", "MB", "GB" };
        double len = bytes;
        int order = 0;
        while (len >= 1024 && order < sizes.Length - 1)
        {
            order++;
            len = len / 1024;
        }
        return $"{len:0.##} {sizes[order]}";
    }
}
