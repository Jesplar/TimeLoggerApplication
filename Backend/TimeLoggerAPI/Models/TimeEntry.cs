namespace TimeLoggerAPI.Models;

public class TimeEntry
{
    public int Id { get; set; }
    public int ProjectId { get; set; }
    public DateTime Date { get; set; }
    public decimal? Hours { get; set; }
    public TimeSpan? StartTime { get; set; }
    public TimeSpan? EndTime { get; set; }
    public string? Description { get; set; }
    public bool IsOnSite { get; set; } = false;
    public decimal? TravelHours { get; set; }
    public decimal? TravelKm { get; set; }
    public DateTime CreatedDate { get; set; } = DateTime.UtcNow;
    public DateTime? ModifiedDate { get; set; }
    
    // Navigation property
    public Project Project { get; set; } = null!;
}
