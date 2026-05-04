using Microsoft.AspNetCore.Mvc;
using PublicHoliday;

namespace TimeLoggerAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HolidaysController : ControllerBase
{
    private static readonly HashSet<(int Month, int Day)> HalfDayDates = new()
    {
        (12, 24), // Julafton
        (12, 31), // Nyårsafton
        (4, 30),  // Valborgsmässoafton
    };

    [HttpGet]
    public ActionResult GetHolidays([FromQuery] string startDate, [FromQuery] string endDate)
    {
        if (!DateOnly.TryParse(startDate, out var start) || !DateOnly.TryParse(endDate, out var end))
        {
            return BadRequest("Invalid date format. Use yyyy-MM-dd.");
        }

        var calendar = new SwedenPublicHoliday();
        var holidays = new List<object>();

        for (int year = start.Year; year <= end.Year; year++)
        {
            var publicHolidays = calendar.PublicHolidayNames(year);

            foreach (var (date, name) in publicHolidays)
            {
                var dateOnly = DateOnly.FromDateTime(date);
                if (dateOnly >= start && dateOnly <= end)
                {
                    holidays.Add(new
                    {
                        date = dateOnly.ToString("yyyy-MM-dd"),
                        name,
                        isHalfDay = false
                    });
                }
            }

            // Add Swedish half-day eves
            AddHalfDayIfInRange(holidays, year, 12, 24, "Julafton", start, end);
            AddHalfDayIfInRange(holidays, year, 12, 31, "Nyårsafton", start, end);
            AddHalfDayIfInRange(holidays, year, 4, 30, "Valborgsmässoafton", start, end);

            // Midsommarafton: Friday before Midsommardagen (Saturday between June 20-26)
            var midsommarafton = GetMidsommarafton(year);
            var midsommaraftonDate = DateOnly.FromDateTime(midsommarafton);
            if (midsommaraftonDate >= start && midsommaraftonDate <= end &&
                !holidays.Cast<dynamic>().Any(h => h.date == midsommaraftonDate.ToString("yyyy-MM-dd")))
            {
                holidays.Add(new
                {
                    date = midsommaraftonDate.ToString("yyyy-MM-dd"),
                    name = "Midsommarafton",
                    isHalfDay = true
                });
            }

            // Day before Good Friday (Skärtorsdagen) - half day afternoon
            var goodFriday = calendar.PublicHolidays(year)
                .FirstOrDefault(d => d.DayOfWeek == DayOfWeek.Friday && d.Month >= 3 && d.Month <= 4 &&
                    calendar.PublicHolidayNames(year).ContainsKey(d));
            if (goodFriday != default)
            {
                var skartorsdag = DateOnly.FromDateTime(goodFriday.AddDays(-1));
                if (skartorsdag >= start && skartorsdag <= end &&
                    !holidays.Cast<dynamic>().Any(h => h.date == skartorsdag.ToString("yyyy-MM-dd")))
                {
                    holidays.Add(new
                    {
                        date = skartorsdag.ToString("yyyy-MM-dd"),
                        name = "Skärtorsdagen (half day)",
                        isHalfDay = true
                    });
                }
            }
        }

        return Ok(holidays);
    }

    private static void AddHalfDayIfInRange(List<object> holidays, int year, int month, int day, string name, DateOnly start, DateOnly end)
    {
        var date = new DateOnly(year, month, day);
        if (date >= start && date <= end)
        {
            // Check if already added as a full holiday
            var dateStr = date.ToString("yyyy-MM-dd");
            if (!holidays.Cast<dynamic>().Any(h => h.date == dateStr))
            {
                holidays.Add(new
                {
                    date = dateStr,
                    name,
                    isHalfDay = true
                });
            }
        }
    }

    private static DateTime GetMidsommarafton(int year)
    {
        // Midsommardagen is the Saturday between June 20-26
        // Midsommarafton is the Friday before
        for (int day = 20; day <= 26; day++)
        {
            var date = new DateTime(year, 6, day);
            if (date.DayOfWeek == DayOfWeek.Saturday)
            {
                return date.AddDays(-1); // Friday before
            }
        }
        return new DateTime(year, 6, 19); // fallback
    }
}
