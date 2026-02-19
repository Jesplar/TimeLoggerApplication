namespace TimeLoggerAPI.DTOs;

public class TimeEntryDto
{
    public int Id { get; set; }
    public int ProjectId { get; set; }
    public string ProjectName { get; set; } = string.Empty;
    public string ProjectNumber { get; set; } = string.Empty;
    public string CustomerName { get; set; } = string.Empty;
    public DateTime Date { get; set; }
    public decimal? Hours { get; set; }
    public TimeSpan? StartTime { get; set; }
    public TimeSpan? EndTime { get; set; }
    public string? Description { get; set; }
    public DateTime CreatedDate { get; set; }
    public DateTime? ModifiedDate { get; set; }
}

public class CreateTimeEntryDto
{
    public int ProjectId { get; set; }
    public DateTime Date { get; set; }
    public decimal? Hours { get; set; }
    public TimeSpan? StartTime { get; set; }
    public TimeSpan? EndTime { get; set; }
    public string? Description { get; set; }
}

public class UpdateTimeEntryDto
{
    public int ProjectId { get; set; }
    public DateTime Date { get; set; }
    public decimal? Hours { get; set; }
    public TimeSpan? StartTime { get; set; }
    public TimeSpan? EndTime { get; set; }
    public string? Description { get; set; }
}

public class WeeklySummaryDto
{
    public DateTime WeekStartDate { get; set; }
    public List<DailySummaryDto> Days { get; set; } = new();
    public List<ProjectTotalDto> ProjectTotals { get; set; } = new();
    public decimal TotalHours { get; set; }
}

public class DailySummaryDto
{
    public DateTime Date { get; set; }
    public List<TimeEntryDto> Entries { get; set; } = new();
    public decimal DailyTotal { get; set; }
}

public class ProjectTotalDto
{
    public int ProjectId { get; set; }
    public string ProjectName { get; set; } = string.Empty;
    public string ProjectNumber { get; set; } = string.Empty;
    public string CustomerName { get; set; } = string.Empty;
    public decimal TotalHours { get; set; }
}
