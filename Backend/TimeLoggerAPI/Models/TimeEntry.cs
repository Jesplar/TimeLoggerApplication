namespace TimeLoggerAPI.Models;

public class TimeEntry
{
    public int Id { get; set; }
    public int ProjectId { get; set; }
    public int TimeCodeId { get; set; }
    public DateTime Date { get; set; }
    public decimal? Hours { get; set; }
    public TimeSpan? StartTime { get; set; }
    public TimeSpan? EndTime { get; set; }
    public string? Description { get; set; }
    public bool IsOnSite { get; set; } = false;
    public decimal? TravelHours { get; set; }
    public int? TravelKm { get; set; }
    public DateTime CreatedDate { get; set; } = DateTime.UtcNow;
    public DateTime? ModifiedDate { get; set; }
    
    // Navigation properties
    public Project Project { get; set; } = null!;
    public TimeCode TimeCode { get; set; } = null!;
}
