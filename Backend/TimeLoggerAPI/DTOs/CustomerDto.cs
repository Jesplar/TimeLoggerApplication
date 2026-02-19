namespace TimeLoggerAPI.DTOs;

public class CustomerDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public DateTime CreatedDate { get; set; }
}

public class CreateCustomerDto
{
    public string Name { get; set; } = string.Empty;
}

public class UpdateCustomerDto
{
    public string Name { get; set; } = string.Empty;
    public bool IsActive { get; set; }
}
