using System.ComponentModel.DataAnnotations;

namespace TimeLoggerAPI.Models;

public class Settings
{
    [Key]
    public int Id { get; set; }
    
    [Required]
    public decimal SekToEurRate { get; set; }
    
    [Required]
    public decimal HourlyRateEur { get; set; }
    
    [Required]
    public decimal TravelHourlyRateEur { get; set; }
    
    [Required]
    public decimal KmCost { get; set; }
    
    public DateTime CreatedDate { get; set; }
    public DateTime? ModifiedDate { get; set; }
}
