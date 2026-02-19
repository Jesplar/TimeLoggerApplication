namespace TimeLoggerAPI.DTOs;

public class SettingsDto
{
    public int Id { get; set; }
    public decimal SekToEurRate { get; set; }
    public decimal HourlyRateEur { get; set; }
    public decimal TravelHourlyRateEur { get; set; }
    public decimal KmCost { get; set; }
    public DateTime CreatedDate { get; set; }
    public DateTime? ModifiedDate { get; set; }
}

public class UpdateSettingsDto
{
    public decimal SekToEurRate { get; set; }
    public decimal HourlyRateEur { get; set; }
    public decimal TravelHourlyRateEur { get; set; }
    public decimal KmCost { get; set; }
}
