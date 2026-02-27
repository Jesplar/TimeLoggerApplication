namespace TimeLoggerAPI.DTOs;

public class ProjectDto
{
    public int Id { get; set; }
    public int CustomerId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public string ProjectNumber { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public bool ExcludeFromInvoice { get; set; }
    public DateTime CreatedDate { get; set; }
}

public class CreateProjectDto
{
    public int CustomerId { get; set; }
    public string ProjectNumber { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
}

public class UpdateProjectDto
{
    public int CustomerId { get; set; }
    public string ProjectNumber { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public bool ExcludeFromInvoice { get; set; }
}
