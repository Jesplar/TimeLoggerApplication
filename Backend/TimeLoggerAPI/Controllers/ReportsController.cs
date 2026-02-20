using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TimeLoggerAPI.Data;
using TimeLoggerAPI.DTOs;

namespace TimeLoggerAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ReportsController : ControllerBase
{
    private readonly TimeLoggerContext _context;

    public ReportsController(TimeLoggerContext context)
    {
        _context = context;
    }

    private static double CalculateHours(decimal? hours, TimeSpan? startTime, TimeSpan? endTime)
    {
        if (hours.HasValue)
            return (double)hours.Value;
        if (startTime.HasValue && endTime.HasValue)
            return (endTime.Value - startTime.Value).TotalHours;
        return 0;
    }

    // Monthly Summary by Customer
    [HttpGet("monthly-customer")]
    public async Task<ActionResult<IEnumerable<MonthlyCustomerReportDto>>> GetMonthlyCustomerReport(
        [FromQuery] int year, [FromQuery] int month)
    {
        var startDate = new DateTime(year, month, 1);
        var endDate = startDate.AddMonths(1);

        var entries = await _context.TimeEntries
            .Include(te => te.Project)
            .ThenInclude(p => p.Customer)
            .Where(te => te.Date >= startDate && te.Date < endDate)
            .ToListAsync();

        var report = entries
            .GroupBy(te => new { te.Project.Customer.Id, te.Project.Customer.Name })
            .Select(g => new MonthlyCustomerReportDto
            {
                Customer = g.Key.Name,
                TotalEntries = g.Count(),
                TotalHours = g.Sum(te => CalculateHours(te.Hours, te.StartTime, te.EndTime)),
                RegularHours = g.Where(te => !te.IsOnSite).Sum(te => CalculateHours(te.Hours, te.StartTime, te.EndTime)),
                OnSiteHours = g.Where(te => te.IsOnSite).Sum(te => CalculateHours(te.Hours, te.StartTime, te.EndTime)),
                TravelHours = g.Sum(te => (double)(te.TravelHours ?? 0)),
                TravelKm = g.Sum(te => (double)(te.TravelKm ?? 0)),
                Period = $"{startDate:MMMM yyyy}"
            })
            .OrderByDescending(r => r.TotalHours)
            .ToList();

        return Ok(report);
    }

    // Monthly Summary by Project
    [HttpGet("monthly-project")]
    public async Task<ActionResult<IEnumerable<MonthlyProjectReportDto>>> GetMonthlyProjectReport(
        [FromQuery] int year, [FromQuery] int month, [FromQuery] int? customerId = null)
    {
        var startDate = new DateTime(year, month, 1);
        var endDate = startDate.AddMonths(1);

        var query = _context.TimeEntries
            .Include(te => te.Project)
            .ThenInclude(p => p.Customer)
            .Where(te => te.Date >= startDate && te.Date < endDate);

        if (customerId.HasValue)
        {
            query = query.Where(te => te.Project.CustomerId == customerId.Value);
        }

        var entries = await query.ToListAsync();

        var report = entries
            .GroupBy(te => new 
            { 
                CustomerName = te.Project.Customer.Name, 
                te.Project.ProjectNumber, 
                ProjectName = te.Project.Name,
                te.ProjectId
            })
            .Select(g => new MonthlyProjectReportDto
            {
                Customer = g.Key.CustomerName,
                ProjectNumber = g.Key.ProjectNumber,
                ProjectName = g.Key.ProjectName,
                Entries = g.Count(),
                TotalHours = g.Sum(te => CalculateHours(te.Hours, te.StartTime, te.EndTime)),
                RegularHours = g.Where(te => !te.IsOnSite).Sum(te => CalculateHours(te.Hours, te.StartTime, te.EndTime)),
                OnSiteHours = g.Where(te => te.IsOnSite).Sum(te => CalculateHours(te.Hours, te.StartTime, te.EndTime)),
                TravelHours = g.Sum(te => (double)(te.TravelHours ?? 0)),
                TravelKm = g.Sum(te => (double)(te.TravelKm ?? 0)),
                Period = $"{startDate:MMMM yyyy}"
            })
            .OrderBy(r => r.Customer)
            .ThenBy(r => r.ProjectNumber)
            .ToList();

        return Ok(report);
    }

    // Invoice Preparation Report
    [HttpGet("invoice")]
    public async Task<ActionResult<IEnumerable<InvoiceReportDto>>> GetInvoiceReport(
        [FromQuery] DateTime startDate, [FromQuery] DateTime endDate, [FromQuery] int? customerId = null)
    {
        var query = _context.TimeEntries
            .Include(te => te.Project)
            .ThenInclude(p => p.Customer)
            .Where(te => te.Date >= startDate && te.Date <= endDate);

        if (customerId.HasValue)
        {
            query = query.Where(te => te.Project.CustomerId == customerId.Value);
        }

        var entries = await query
            .OrderBy(te => te.Project.Customer.Name)
            .ThenBy(te => te.Project.ProjectNumber)
            .ThenBy(te => te.Date)
            .ToListAsync();

        var report = entries.Select(te => new InvoiceReportDto
        {
            Date = te.Date,
            Customer = te.Project.Customer.Name,
            ProjectNumber = te.Project.ProjectNumber,
            ProjectName = te.Project.Name,
            Hours = CalculateHours(te.Hours, te.StartTime, te.EndTime),
            IsOnSite = te.IsOnSite,
            TravelHours = (double)(te.TravelHours ?? 0),
            TravelKm = (double)(te.TravelKm ?? 0),
            StartTime = te.StartTime,
            EndTime = te.EndTime,
            Description = te.Description ?? string.Empty
        }).ToList();

        return Ok(report);
    }

    // Invoice Export with Cost Calculations
    [HttpGet("invoice-export")]
    public async Task<ActionResult<IEnumerable<InvoiceExportProjectDto>>> GetInvoiceExport(
        [FromQuery] DateTime startDate, [FromQuery] DateTime endDate, [FromQuery] int? customerId = null)
    {
        // Get settings for rates
        var settings = await _context.Settings.FirstOrDefaultAsync();
        if (settings == null)
        {
            return BadRequest("Settings not configured. Please configure billing rates in Settings.");
        }

        // Get time entries
        var query = _context.TimeEntries
            .Include(te => te.Project)
            .ThenInclude(p => p.Customer)
            .Include(te => te.TimeCode)
            .Where(te => te.Date >= startDate && te.Date <= endDate);

        if (customerId.HasValue)
        {
            query = query.Where(te => te.Project.CustomerId == customerId.Value);
        }

        var entries = await query
            .OrderBy(te => te.Project.Customer.Name)
            .ThenBy(te => te.Project.ProjectNumber)
            .ThenBy(te => te.Date)
            .ToListAsync();

        // Group by project and calculate costs
        var projectGroups = entries
            .GroupBy(te => new 
            { 
                te.ProjectId,
                CustomerName = te.Project.Customer.Name,
                te.Project.ProjectNumber,
                ProjectName = te.Project.Name
            })
            .Select(g =>
            {
                // Group regular hours by time code
                var regularByTimeCode = g
                    .Where(te => !te.IsOnSite)
                    .GroupBy(te => new { te.TimeCode.Code, te.TimeCode.Description })
                    .Select(tcg =>
                    {
                        var hours = tcg.Sum(te => CalculateHours(te.Hours, te.StartTime, te.EndTime));
                        return new TimeCodeHoursDto
                        {
                            TimeCode = tcg.Key.Code,
                            TimeCodeDescription = tcg.Key.Description,
                            Hours = hours,
                            Cost = (decimal)hours * settings.HourlyRateEur
                        };
                    })
                    .OrderBy(tc => tc.TimeCode)
                    .ToList();

                // Group on-site hours by time code
                var onSiteByTimeCode = g
                    .Where(te => te.IsOnSite)
                    .GroupBy(te => new { te.TimeCode.Code, te.TimeCode.Description })
                    .Select(tcg =>
                    {
                        var hours = tcg.Sum(te => CalculateHours(te.Hours, te.StartTime, te.EndTime));
                        return new TimeCodeHoursDto
                        {
                            TimeCode = tcg.Key.Code,
                            TimeCodeDescription = tcg.Key.Description,
                            Hours = hours,
                            Cost = (decimal)hours * settings.HourlyRateEur
                        };
                    })
                    .OrderBy(tc => tc.TimeCode)
                    .ToList();

                var regularHours = regularByTimeCode.Sum(tc => tc.Hours);
                var onSiteHours = onSiteByTimeCode.Sum(tc => tc.Hours);
                var travelHours = g.Sum(te => (double)(te.TravelHours ?? 0));
                var travelKm = g.Sum(te => (double)(te.TravelKm ?? 0));

                var regularCost = regularByTimeCode.Sum(tc => tc.Cost);
                var onSiteCost = onSiteByTimeCode.Sum(tc => tc.Cost);
                var travelTimeCost = (decimal)travelHours * settings.TravelHourlyRateEur;
                var travelDistanceCost = (decimal)travelKm * settings.KmCost;

                return new InvoiceExportProjectDto
                {
                    Customer = g.Key.CustomerName,
                    ProjectNumber = g.Key.ProjectNumber,
                    ProjectName = g.Key.ProjectName,
                    Period = $"{startDate:MMMM yyyy}",
                    
                    RegularHoursByTimeCode = regularByTimeCode,
                    OnSiteHoursByTimeCode = onSiteByTimeCode,
                    
                    RegularHours = regularHours,
                    OnSiteHours = onSiteHours,
                    TravelHours = travelHours,
                    TravelKm = travelKm,
                    
                    HourlyRate = settings.HourlyRateEur,
                    TravelHourlyRate = settings.TravelHourlyRateEur,
                    KmCost = settings.KmCost,
                    
                    RegularCost = regularCost,
                    OnSiteCost = onSiteCost,
                    TravelTimeCost = travelTimeCost,
                    TravelDistanceCost = travelDistanceCost,
                    GrandTotal = regularCost + onSiteCost + travelTimeCost + travelDistanceCost,
                    
                    Entries = g.Select(te => new InvoiceReportDto
                    {
                        Date = te.Date,
                        Customer = te.Project.Customer.Name,
                        ProjectNumber = te.Project.ProjectNumber,
                        ProjectName = te.Project.Name,
                        TimeCode = te.TimeCode.Code,
                        TimeCodeDescription = te.TimeCode.Description,
                        Hours = CalculateHours(te.Hours, te.StartTime, te.EndTime),
                        IsOnSite = te.IsOnSite,
                        TravelHours = (double)(te.TravelHours ?? 0),
                        TravelKm = (double)(te.TravelKm ?? 0),
                        StartTime = te.StartTime,
                        EndTime = te.EndTime,
                        Description = te.Description ?? string.Empty
                    }).ToList()
                };
            })
            .OrderBy(p => p.Customer)
            .ThenBy(p => p.ProjectNumber)
            .ToList();

        return Ok(projectGroups);
    }

    // Weekly Timesheet Report
    [HttpGet("weekly-timesheet")]
    public async Task<ActionResult<IEnumerable<WeeklyTimesheetReportDto>>> GetWeeklyTimesheetReport(
        [FromQuery] DateTime weekStartDate)
    {
        var weekEndDate = weekStartDate.AddDays(6);

        var entries = await _context.TimeEntries
            .Include(te => te.Project)
            .ThenInclude(p => p.Customer)
            .Where(te => te.Date >= weekStartDate && te.Date <= weekEndDate)
            .OrderBy(te => te.Date)
            .ThenBy(te => te.Project.Customer.Name)
            .ThenBy(te => te.Project.ProjectNumber)
            .ToListAsync();

        var report = entries.Select(te => new WeeklyTimesheetReportDto
        {
            Date = te.Date,
            DayOfWeek = te.Date.DayOfWeek.ToString(),
            Customer = te.Project.Customer.Name,
            ProjectNumber = te.Project.ProjectNumber,
            Project = te.Project.Name,
            Hours = CalculateHours(te.Hours, te.StartTime, te.EndTime),
            IsOnSite = te.IsOnSite,
            TravelHours = (double)(te.TravelHours ?? 0),
            TravelKm = (double)(te.TravelKm ?? 0),
            StartTime = te.StartTime,
            EndTime = te.EndTime,
            Description = te.Description ?? string.Empty
        }).ToList();

        return Ok(report);
    }

    // Customer Activity Report
    [HttpGet("customer-activity")]
    public async Task<ActionResult<IEnumerable<CustomerActivityReportDto>>> GetCustomerActivityReport(
        [FromQuery] DateTime startDate, [FromQuery] DateTime endDate)
    {
        var entries = await _context.TimeEntries
            .Include(te => te.Project)
            .ThenInclude(p => p.Customer)
            .Where(te => te.Date >= startDate && te.Date <= endDate)
            .ToListAsync();

        var report = entries
            .GroupBy(te => new { te.Project.Customer.Id, te.Project.Customer.Name })
            .Select(g => new CustomerActivityReportDto
            {
                Customer = g.Key.Name,
                ActiveProjects = g.Select(te => te.ProjectId).Distinct().Count(),
                TotalEntries = g.Count(),
                TotalHours = g.Sum(te => CalculateHours(te.Hours, te.StartTime, te.EndTime)),
                RegularHours = g.Where(te => !te.IsOnSite).Sum(te => CalculateHours(te.Hours, te.StartTime, te.EndTime)),
                OnSiteHours = g.Where(te => te.IsOnSite).Sum(te => CalculateHours(te.Hours, te.StartTime, te.EndTime)),
                TravelHours = g.Sum(te => (double)(te.TravelHours ?? 0)),
                TravelKm = g.Sum(te => (double)(te.TravelKm ?? 0)),
                FirstEntry = g.Min(te => te.Date),
                LastEntry = g.Max(te => te.Date)
            })
            .OrderByDescending(r => r.TotalHours)
            .ToList();

        return Ok(report);
    }

    // Project Status Report
    [HttpGet("project-status")]
    public async Task<ActionResult<IEnumerable<ProjectStatusReportDto>>> GetProjectStatusReport()
    {
        var projects = await _context.Projects
            .Include(p => p.Customer)
            .Include(p => p.TimeEntries)
            .ToListAsync();

        var report = projects.Select(p => new ProjectStatusReportDto
        {
            Customer = p.Customer.Name,
            ProjectNumber = p.ProjectNumber,
            ProjectName = p.Name,
            Active = p.IsActive,
            TotalEntries = p.TimeEntries.Count,
            TotalHours = p.TimeEntries.Sum(te => CalculateHours(te.Hours, te.StartTime, te.EndTime)),
            RegularHours = p.TimeEntries.Where(te => !te.IsOnSite).Sum(te => CalculateHours(te.Hours, te.StartTime, te.EndTime)),
            OnSiteHours = p.TimeEntries.Where(te => te.IsOnSite).Sum(te => CalculateHours(te.Hours, te.StartTime, te.EndTime)),
            TravelHours = p.TimeEntries.Sum(te => (double)(te.TravelHours ?? 0)),
            TravelKm = p.TimeEntries.Sum(te => (double)(te.TravelKm ?? 0)),
            LastActivity = p.TimeEntries.Any() ? p.TimeEntries.Max(te => te.Date) : (DateTime?)null,
            DaysSinceLastEntry = p.TimeEntries.Any() 
                ? (DateTime.Today - p.TimeEntries.Max(te => te.Date)).Days 
                : (int?)null
        })
        .OrderByDescending(r => r.LastActivity)
        .ToList();

        return Ok(report);
    }

    // Year-to-Date Summary
    [HttpGet("ytd-summary")]
    public async Task<ActionResult<YearToDateSummaryDto>> GetYearToDateSummary([FromQuery] int year)
    {
        var startDate = new DateTime(year, 1, 1);
        var endDate = new DateTime(year, 12, 31);

        var entries = await _context.TimeEntries
            .Include(te => te.Project)
            .Where(te => te.Date >= startDate && te.Date <= endDate)
            .ToListAsync();

        var summary = new YearToDateSummaryDto
        {
            Year = year,
            DaysWorked = entries.Select(te => te.Date.Date).Distinct().Count(),
            ProjectsWorked = entries.Select(te => te.ProjectId).Distinct().Count(),
            CustomersServed = entries.Select(te => te.Project.CustomerId).Distinct().Count(),
            TotalEntries = entries.Count,
            TotalHours = entries.Sum(te => CalculateHours(te.Hours, te.StartTime, te.EndTime)),
            RegularHours = entries.Where(te => !te.IsOnSite).Sum(te => CalculateHours(te.Hours, te.StartTime, te.EndTime)),
            OnSiteHours = entries.Where(te => te.IsOnSite).Sum(te => CalculateHours(te.Hours, te.StartTime, te.EndTime)),
            TravelHours = entries.Sum(te => (double)(te.TravelHours ?? 0)),
            TravelKm = entries.Sum(te => (double)(te.TravelKm ?? 0)),
            AvgHoursPerEntry = entries.Any() 
                ? entries.Average(te => CalculateHours(te.Hours, te.StartTime, te.EndTime))
                : 0
        };

        return Ok(summary);
    }

    // Month-by-Month Comparison
    [HttpGet("monthly-comparison")]
    public async Task<ActionResult<IEnumerable<MonthlyComparisonDto>>> GetMonthlyComparison(
        [FromQuery] int year, [FromQuery] int monthsBack = 6)
    {
        var startDate = DateTime.Today.AddMonths(-monthsBack);
        var endDate = DateTime.Today;

        var entries = await _context.TimeEntries
            .Include(te => te.Project)
            .Where(te => te.Date >= startDate && te.Date <= endDate)
            .ToListAsync();

        var report = entries
            .GroupBy(te => new { Year = te.Date.Year, Month = te.Date.Month })
            .Select(g => new MonthlyComparisonDto
            {
                YearMonth = $"{g.Key.Year}-{g.Key.Month:D2}",
                Entries = g.Count(),
                TotalHours = g.Sum(te => CalculateHours(te.Hours, te.StartTime, te.EndTime)),
                RegularHours = g.Where(te => !te.IsOnSite).Sum(te => CalculateHours(te.Hours, te.StartTime, te.EndTime)),
                OnSiteHours = g.Where(te => te.IsOnSite).Sum(te => CalculateHours(te.Hours, te.StartTime, te.EndTime)),
                TravelHours = g.Sum(te => (double)(te.TravelHours ?? 0)),
                TravelKm = g.Sum(te => (double)(te.TravelKm ?? 0)),
                ProjectsActive = g.Select(te => te.ProjectId).Distinct().Count(),
                CustomersActive = g.Select(te => te.Project.CustomerId).Distinct().Count()
            })
            .OrderByDescending(r => r.YearMonth)
            .ToList();

        return Ok(report);
    }
}
