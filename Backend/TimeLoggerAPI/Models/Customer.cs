namespace TimeLoggerAPI.Models;

public class Customer
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public DateTime CreatedDate { get; set; } = DateTime.UtcNow;
    
    // Navigation property
    public ICollection<Project> Projects { get; set; } = new List<Project>();
}
