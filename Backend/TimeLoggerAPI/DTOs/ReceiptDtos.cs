namespace TimeLoggerAPI.DTOs;

public class ReceiptDto
{
    public int Id { get; set; }
    public int ProjectId { get; set; }
    public string ProjectName { get; set; } = string.Empty;
    public string ProjectNumber { get; set; } = string.Empty;
    public string CustomerName { get; set; } = string.Empty;
    public int ReceiptTypeId { get; set; }
    public string ReceiptTypeName { get; set; } = string.Empty;
    public DateTime Date { get; set; }
    public string FileName { get; set; } = string.Empty;
    public decimal Cost { get; set; }
    public string Currency { get; set; } = "EUR";
    public DateTime CreatedDate { get; set; }
    public DateTime? ModifiedDate { get; set; }
}

public class CreateReceiptDto
{
    public int ProjectId { get; set; }
    public int ReceiptTypeId { get; set; }
    public DateTime Date { get; set; }
    public string FileName { get; set; } = string.Empty;
    public decimal Cost { get; set; }
    public string Currency { get; set; } = "EUR";
}

public class UpdateReceiptDto
{
    public int ProjectId { get; set; }
    public int ReceiptTypeId { get; set; }
    public DateTime Date { get; set; }
    public string FileName { get; set; } = string.Empty;
    public decimal Cost { get; set; }
    public string Currency { get; set; } = "EUR";
}
