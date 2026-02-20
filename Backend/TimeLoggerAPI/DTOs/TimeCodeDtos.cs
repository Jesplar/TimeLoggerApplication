namespace TimeLoggerAPI.DTOs;

public class TimeCodeDto
{
    public int Id { get; set; }
    public int Code { get; set; }
    public required string Description { get; set; }
    public bool IsActive { get; set; }
}

public class CreateTimeCodeDto
{
    public int Code { get; set; }
    public required string Description { get; set; }
}

public class UpdateTimeCodeDto
{
    public int Code { get; set; }
    public required string Description { get; set; }
    public bool IsActive { get; set; }
}
