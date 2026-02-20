namespace TimeLoggerAPI.Models;

public class Receipt
{
    public int Id { get; set; }
    public int ProjectId { get; set; }
    public int ReceiptTypeId { get; set; }
    public DateTime Date { get; set; }
    public string FileName { get; set; } = string.Empty;
    public decimal Cost { get; set; }
    public string Currency { get; set; } = "EUR"; // 'SEK' or 'EUR'
    public DateTime CreatedDate { get; set; }
    public DateTime? ModifiedDate { get; set; }

    // Navigation properties
    public Project Project { get; set; } = null!;
    public ReceiptType ReceiptType { get; set; } = null!;
}
