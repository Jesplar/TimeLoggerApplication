namespace TimeLoggerAPI.DTOs;

public class MonthlyCustomerReportDto
{
    public string Customer { get; set; } = string.Empty;
    public int TotalEntries { get; set; }
    public double TotalHours { get; set; }
    public double RegularHours { get; set; }
    public double OnSiteHours { get; set; }
    public double TravelHours { get; set; }
    public double TravelKm { get; set; }
    public string Period { get; set; } = string.Empty;
}

public class MonthlyProjectReportDto
{
    public string Customer { get; set; } = string.Empty;
    public string ProjectNumber { get; set; } = string.Empty;
    public string ProjectName { get; set; } = string.Empty;
    public int Entries { get; set; }
    public double TotalHours { get; set; }
    public double RegularHours { get; set; }
    public double OnSiteHours { get; set; }
    public double TravelHours { get; set; }
    public double TravelKm { get; set; }
    public string Period { get; set; } = string.Empty;
}

public class InvoiceReportDto
{
    public DateTime Date { get; set; }
    public string Customer { get; set; } = string.Empty;
    public string ProjectNumber { get; set; } = string.Empty;
    public string ProjectName { get; set; } = string.Empty;
    public int TimeCode { get; set; }
    public string TimeCodeDescription { get; set; } = string.Empty;
    public double Hours { get; set; }
    public bool IsOnSite { get; set; }
    public double TravelHours { get; set; }
    public double TravelKm { get; set; }
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
    public bool IsOnSite { get; set; }
    public double TravelHours { get; set; }
    public double TravelKm { get; set; }
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
    public double RegularHours { get; set; }
    public double OnSiteHours { get; set; }
    public double TravelHours { get; set; }
    public double TravelKm { get; set; }
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
    public double RegularHours { get; set; }
    public double OnSiteHours { get; set; }
    public double TravelHours { get; set; }
    public double TravelKm { get; set; }
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
    public double RegularHours { get; set; }
    public double OnSiteHours { get; set; }
    public double TravelHours { get; set; }
    public double TravelKm { get; set; }
    public double AvgHoursPerEntry { get; set; }
}

public class MonthlyComparisonDto
{
    public string YearMonth { get; set; } = string.Empty;
    public int Entries { get; set; }
    public double TotalHours { get; set; }
    public double RegularHours { get; set; }
    public double OnSiteHours { get; set; }
    public double TravelHours { get; set; }
    public double TravelKm { get; set; }
    public int ProjectsActive { get; set; }
    public int CustomersActive { get; set; }
}

public class InvoiceExportProjectDto
{
    public string Customer { get; set; } = string.Empty;
    public string ProjectNumber { get; set; } = string.Empty;
    public string ProjectName { get; set; } = string.Empty;
    public string Period { get; set; } = string.Empty;
    
    // Hours breakdown by time code
    public List<TimeCodeHoursDto> RegularHoursByTimeCode { get; set; } = new();
    public List<TimeCodeHoursDto> OnSiteHoursByTimeCode { get; set; } = new();
    
    // Total hours
    public double RegularHours { get; set; }
    public double OnSiteHours { get; set; }
    public double TravelHours { get; set; }
    public double TravelKm { get; set; }
    
    // Rates from settings
    public decimal HourlyRate { get; set; }
    public decimal TravelHourlyRate { get; set; }
    public decimal KmCost { get; set; }
    
    // Calculated costs
    public decimal RegularCost { get; set; }
    public decimal OnSiteCost { get; set; }
    public decimal TravelTimeCost { get; set; }
    public decimal TravelDistanceCost { get; set; }
    public decimal ReceiptsCost { get; set; }
    public decimal GrandTotal { get; set; }
    
    // Detailed entries for this project
    public List<InvoiceReportDto> Entries { get; set; } = new();
    
    // Receipts for this project
    public List<InvoiceReceiptDto> Receipts { get; set; } = new();
}

public class TimeCodeHoursDto
{
    public int TimeCode { get; set; }
    public string TimeCodeDescription { get; set; } = string.Empty;
    public double Hours { get; set; }
    public decimal Cost { get; set; }
}

public class InvoiceReceiptDto
{
    public DateTime Date { get; set; }
    public string FileName { get; set; } = string.Empty;
    public decimal Cost { get; set; }
    public string Currency { get; set; } = string.Empty;
    public decimal CostInEur { get; set; }
}
