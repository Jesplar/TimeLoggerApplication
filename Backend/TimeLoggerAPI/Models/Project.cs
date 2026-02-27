namespace TimeLoggerAPI.Models;

public class Project
{
    public int Id { get; set; }
    public int CustomerId { get; set; }
    public string ProjectNumber { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public bool ExcludeFromInvoice { get; set; } = false;
    public DateTime CreatedDate { get; set; } = DateTime.UtcNow;
    
    // Navigation properties
    public Customer Customer { get; set; } = null!;
    public ICollection<TimeEntry> TimeEntries { get; set; } = new List<TimeEntry>();
}
