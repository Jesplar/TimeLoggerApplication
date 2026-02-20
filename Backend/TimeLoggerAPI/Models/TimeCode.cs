namespace TimeLoggerAPI.Models;

public class TimeCode
{
    public int Id { get; set; }
    public int Code { get; set; }
    public required string Description { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedDate { get; set; } = DateTime.UtcNow;
    public DateTime? ModifiedDate { get; set; }
}
