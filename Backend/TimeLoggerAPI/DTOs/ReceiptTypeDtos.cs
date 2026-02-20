namespace TimeLoggerAPI.DTOs;

public class ReceiptTypeDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public DateTime CreatedDate { get; set; }
    public DateTime? ModifiedDate { get; set; }
}

public class CreateReceiptTypeDto
{
    public string Name { get; set; } = string.Empty;
}

public class UpdateReceiptTypeDto
{
    public string Name { get; set; } = string.Empty;
    public bool IsActive { get; set; }
}
