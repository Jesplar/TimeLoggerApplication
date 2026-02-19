using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TimeLoggerAPI.Data;
using TimeLoggerAPI.DTOs;
using TimeLoggerAPI.Models;

namespace TimeLoggerAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TimeEntriesController : ControllerBase
{
    private readonly TimeLoggerContext _context;

    public TimeEntriesController(TimeLoggerContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<TimeEntryDto>>> GetTimeEntries(
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null,
        [FromQuery] int? projectId = null,
        [FromQuery] int? customerId = null)
    {
        var query = _context.TimeEntries
            .Include(t => t.Project)
            .ThenInclude(p => p.Customer)
            .AsQueryable();

        if (startDate.HasValue)
        {
            query = query.Where(t => t.Date >= startDate.Value.Date);
        }

        if (endDate.HasValue)
        {
            query = query.Where(t => t.Date <= endDate.Value.Date);
        }

        if (projectId.HasValue)
        {
            query = query.Where(t => t.ProjectId == projectId.Value);
        }

        if (customerId.HasValue)
        {
            query = query.Where(t => t.Project.CustomerId == customerId.Value);
        }

        var entries = await query
            .OrderByDescending(t => t.Date)
            .ThenBy(t => t.Project.Customer.Name)
            .ThenBy(t => t.Project.ProjectNumber)
            .Select(t => new TimeEntryDto
            {
                Id = t.Id,
                ProjectId = t.ProjectId,
                ProjectName = t.Project.Name,
                ProjectNumber = t.Project.ProjectNumber,
                CustomerId = t.Project.CustomerId,
                CustomerName = t.Project.Customer.Name,
                Date = t.Date,
                Hours = t.Hours,
                StartTime = t.StartTime,
                EndTime = t.EndTime,
                Description = t.Description,
                CreatedDate = t.CreatedDate,
                ModifiedDate = t.ModifiedDate
            })
            .ToListAsync();

        return Ok(entries);
    }

    [HttpGet("weekly")]
    public async Task<ActionResult<WeeklySummaryDto>> GetWeeklySummary(
        [FromQuery] DateTime date,
        [FromQuery] int? customerId = null,
        [FromQuery] int? projectId = null)
    {
        // Calculate week start (Monday)
        var daysSinceMonday = ((int)date.DayOfWeek - 1 + 7) % 7;
        var weekStart = date.Date.AddDays(-daysSinceMonday);
        var weekEnd = weekStart.AddDays(6);

        var query = _context.TimeEntries
            .Include(t => t.Project)
            .ThenInclude(p => p.Customer)
            .Where(t => t.Date >= weekStart && t.Date <= weekEnd);

        if (customerId.HasValue)
        {
            query = query.Where(t => t.Project.CustomerId == customerId.Value);
        }

        if (projectId.HasValue)
        {
            query = query.Where(t => t.ProjectId == projectId.Value);
        }

        var entries = await query
            .OrderBy(t => t.Date)
            .ThenBy(t => t.Project.Customer.Name)
            .ThenBy(t => t.Project.ProjectNumber)
            .ToListAsync();

        // Calculate hours for each entry
        var entriesWithHours = entries.Select(t => new
        {
            Entry = t,
            CalculatedHours = CalculateHours(t)
        }).ToList();

        // Group by date
        var dailySummaries = new List<DailySummaryDto>();
        for (int i = 0; i < 7; i++)
        {
            var currentDate = weekStart.AddDays(i);
            var dayEntries = entriesWithHours.Where(e => e.Entry.Date.Date == currentDate).ToList();

            dailySummaries.Add(new DailySummaryDto
            {
                Date = currentDate,
                Entries = dayEntries.Select(e => new TimeEntryDto
                {
                    Id = e.Entry.Id,
                    ProjectId = e.Entry.ProjectId,
                    ProjectName = e.Entry.Project.Name,
                    ProjectNumber = e.Entry.Project.ProjectNumber,
                    CustomerId = e.Entry.Project.CustomerId,
                    CustomerName = e.Entry.Project.Customer.Name,
                    Date = e.Entry.Date,
                    Hours = e.CalculatedHours,
                    StartTime = e.Entry.StartTime,
                    EndTime = e.Entry.EndTime,
                    Description = e.Entry.Description,
                    CreatedDate = e.Entry.CreatedDate,
                    ModifiedDate = e.Entry.ModifiedDate
                }).ToList(),
                DailyTotal = dayEntries.Sum(e => e.CalculatedHours)
            });
        }

        // Calculate project totals
        var projectTotals = entriesWithHours
            .GroupBy(e => new
            {
                e.Entry.ProjectId,
                e.Entry.Project.Name,
                e.Entry.Project.ProjectNumber,
                CustomerName = e.Entry.Project.Customer.Name
            })
            .Select(g => new ProjectTotalDto
            {
                ProjectId = g.Key.ProjectId,
                ProjectName = g.Key.Name,
                ProjectNumber = g.Key.ProjectNumber,
                CustomerName = g.Key.CustomerName,
                TotalHours = g.Sum(e => e.CalculatedHours)
            })
            .OrderBy(p => p.CustomerName)
            .ThenBy(p => p.ProjectNumber)
            .ToList();

        var summary = new WeeklySummaryDto
        {
            WeekStartDate = weekStart,
            Days = dailySummaries,
            ProjectTotals = projectTotals,
            TotalHours = entriesWithHours.Sum(e => e.CalculatedHours)
        };

        return Ok(summary);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<TimeEntryDto>> GetTimeEntry(int id)
    {
        var entry = await _context.TimeEntries
            .Include(t => t.Project)
            .ThenInclude(p => p.Customer)
            .FirstOrDefaultAsync(t => t.Id == id);

        if (entry == null)
        {
            return NotFound();
        }

        var entryDto = new TimeEntryDto
        {
            Id = entry.Id,
            ProjectId = entry.ProjectId,
            ProjectName = entry.Project.Name,
            ProjectNumber = entry.Project.ProjectNumber,
            CustomerId = entry.Project.CustomerId,
            CustomerName = entry.Project.Customer.Name,
            Date = entry.Date,
            Hours = CalculateHours(entry),
            StartTime = entry.StartTime,
            EndTime = entry.EndTime,
            Description = entry.Description,
            CreatedDate = entry.CreatedDate,
            ModifiedDate = entry.ModifiedDate
        };

        return Ok(entryDto);
    }

    [HttpPost]
    public async Task<ActionResult<TimeEntryDto>> CreateTimeEntry(CreateTimeEntryDto createDto)
    {
        var validationError = ValidateTimeEntry(createDto.Hours, createDto.StartTime, createDto.EndTime);
        if (validationError != null)
        {
            return BadRequest(validationError);
        }

        var projectExists = await _context.Projects.AnyAsync(p => p.Id == createDto.ProjectId);
        if (!projectExists)
        {
            return BadRequest("Project not found.");
        }

        var entry = new TimeEntry
        {
            ProjectId = createDto.ProjectId,
            Date = createDto.Date.Date,
            Hours = createDto.Hours,
            StartTime = createDto.StartTime,
            EndTime = createDto.EndTime,
            Description = createDto.Description?.Trim(),
            CreatedDate = DateTime.UtcNow
        };

        _context.TimeEntries.Add(entry);
        await _context.SaveChangesAsync();

        var project = await _context.Projects
            .Include(p => p.Customer)
            .FirstAsync(p => p.Id == entry.ProjectId);

        var entryDto = new TimeEntryDto
        {
            Id = entry.Id,
            ProjectId = entry.ProjectId,
            ProjectName = project.Name,
            ProjectNumber = project.ProjectNumber,
            CustomerId = project.CustomerId,
            CustomerName = project.Customer.Name,
            Date = entry.Date,
            Hours = CalculateHours(entry),
            StartTime = entry.StartTime,
            EndTime = entry.EndTime,
            Description = entry.Description,
            CreatedDate = entry.CreatedDate,
            ModifiedDate = entry.ModifiedDate
        };

        return CreatedAtAction(nameof(GetTimeEntry), new { id = entry.Id }, entryDto);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateTimeEntry(int id, UpdateTimeEntryDto updateDto)
    {
        var validationError = ValidateTimeEntry(updateDto.Hours, updateDto.StartTime, updateDto.EndTime);
        if (validationError != null)
        {
            return BadRequest(validationError);
        }

        var entry = await _context.TimeEntries.FindAsync(id);

        if (entry == null)
        {
            return NotFound();
        }

        var projectExists = await _context.Projects.AnyAsync(p => p.Id == updateDto.ProjectId);
        if (!projectExists)
        {
            return BadRequest("Project not found.");
        }

        entry.ProjectId = updateDto.ProjectId;
        entry.Date = updateDto.Date.Date;
        entry.Hours = updateDto.Hours;
        entry.StartTime = updateDto.StartTime;
        entry.EndTime = updateDto.EndTime;
        entry.Description = updateDto.Description?.Trim();
        entry.ModifiedDate = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteTimeEntry(int id)
    {
        var entry = await _context.TimeEntries.FindAsync(id);

        if (entry == null)
        {
            return NotFound();
        }

        _context.TimeEntries.Remove(entry);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpGet("export")]
    public async Task<IActionResult> ExportToCsv(
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null)
    {
        var query = _context.TimeEntries
            .Include(t => t.Project)
            .ThenInclude(p => p.Customer)
            .AsQueryable();

        if (startDate.HasValue)
        {
            query = query.Where(t => t.Date >= startDate.Value.Date);
        }

        if (endDate.HasValue)
        {
            query = query.Where(t => t.Date <= endDate.Value.Date);
        }

        var entries = await query
            .OrderBy(t => t.Date)
            .ThenBy(t => t.Project.Customer.Name)
            .ThenBy(t => t.Project.ProjectNumber)
            .ToListAsync();

        var csv = new System.Text.StringBuilder();
        csv.AppendLine("Date,Customer,Project Number,Project Name,Hours,Start Time,End Time,Description");

        foreach (var entry in entries)
        {
            var hours = CalculateHours(entry);
            var startTime = entry.StartTime?.ToString(@"hh\:mm") ?? "";
            var endTime = entry.EndTime?.ToString(@"hh\:mm") ?? "";
            var description = entry.Description?.Replace("\"", "\"\"") ?? "";

            csv.AppendLine($"{entry.Date:yyyy-MM-dd}," +
                          $"\"{entry.Project.Customer.Name}\"," +
                          $"\"{entry.Project.ProjectNumber}\"," +
                          $"\"{entry.Project.Name}\"," +
                          $"{hours}," +
                          $"{startTime}," +
                          $"{endTime}," +
                          $"\"{description}\"");
        }

        var bytes = System.Text.Encoding.UTF8.GetBytes(csv.ToString());
        return File(bytes, "text/csv", $"time-entries-{DateTime.Now:yyyyMMdd}.csv");
    }

    private static decimal CalculateHours(TimeEntry entry)
    {
        if (entry.Hours.HasValue)
        {
            return entry.Hours.Value;
        }

        if (entry.StartTime.HasValue && entry.EndTime.HasValue)
        {
            var duration = entry.EndTime.Value - entry.StartTime.Value;
            return (decimal)duration.TotalHours;
        }

        return 0;
    }

    private static string? ValidateTimeEntry(decimal? hours, TimeSpan? startTime, TimeSpan? endTime)
    {
        if (!hours.HasValue && (!startTime.HasValue || !endTime.HasValue))
        {
            return "Either hours or both start and end times must be provided.";
        }

        if (hours.HasValue && hours.Value < 0)
        {
            return "Hours cannot be negative.";
        }

        if (hours.HasValue && hours.Value > 24)
        {
            return "Hours cannot exceed 24.";
        }

        if (startTime.HasValue && endTime.HasValue && startTime.Value >= endTime.Value)
        {
            return "Start time must be before end time.";
        }

        return null;
    }
}
