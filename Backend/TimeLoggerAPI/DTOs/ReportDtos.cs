namespace TimeLoggerAPI.DTOs;

public class MonthlyCustomerReportDto
{
    public string Customer { get; set; } = string.Empty;
    public int TotalEntries { get; set; }
    public double TotalHours { get; set; }
    public string Period { get; set; } = string.Empty;
}

public class MonthlyProjectReportDto
{
    public string Customer { get; set; } = string.Empty;
    public string ProjectNumber { get; set; } = string.Empty;
    public string ProjectName { get; set; } = string.Empty;
    public int Entries { get; set; }
    public double TotalHours { get; set; }
    public string Period { get; set; } = string.Empty;
}

public class InvoiceReportDto
{
    public DateTime Date { get; set; }
    public string Customer { get; set; } = string.Empty;
    public string ProjectNumber { get; set; } = string.Empty;
    public string ProjectName { get; set; } = string.Empty;
    public double Hours { get; set; }
    public TimeSpan? StartTime { get; set; }
    public TimeSpan? EndTime { get; set; }
    public string Description { get; set; } = string.Empty;
}

public class WeeklyTimesheetReportDto
{
    public DateTime Date { get; set; }
    public string DayOfWeek { get; set; } = string.Empty;
    public string Customer { get; set; } = string.Empty;
    public string ProjectNumber { get; set; } = string.Empty;
    public string Project { get; set; } = string.Empty;
    public double Hours { get; set; }
    public TimeSpan? StartTime { get; set; }
    public TimeSpan? EndTime { get; set; }
    public string Description { get; set; } = string.Empty;
}

public class CustomerActivityReportDto
{
    public string Customer { get; set; } = string.Empty;
    public int ActiveProjects { get; set; }
    public int TotalEntries { get; set; }
    public double TotalHours { get; set; }
    public DateTime FirstEntry { get; set; }
    public DateTime LastEntry { get; set; }
}

public class ProjectStatusReportDto
{
    public string Customer { get; set; } = string.Empty;
    public string ProjectNumber { get; set; } = string.Empty;
    public string ProjectName { get; set; } = string.Empty;
    public bool Active { get; set; }
    public int TotalEntries { get; set; }
    public double TotalHours { get; set; }
    public DateTime? LastActivity { get; set; }
    public int? DaysSinceLastEntry { get; set; }
}

public class YearToDateSummaryDto
{
    public int Year { get; set; }
    public int DaysWorked { get; set; }
    public int ProjectsWorked { get; set; }
    public int CustomersServed { get; set; }
    public int TotalEntries { get; set; }
    public double TotalHours { get; set; }
    public double AvgHoursPerEntry { get; set; }
}

public class MonthlyComparisonDto
{
    public string YearMonth { get; set; } = string.Empty;
    public int Entries { get; set; }
    public double TotalHours { get; set; }
    public int ProjectsActive { get; set; }
    public int CustomersActive { get; set; }
}
