using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TimeLoggerAPI.Data;
using TimeLoggerAPI.DTOs;
using TimeLoggerAPI.Models;

namespace TimeLoggerAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SettingsController : ControllerBase
{
    private readonly TimeLoggerContext _context;

    public SettingsController(TimeLoggerContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<SettingsDto>> GetSettings()
    {
        var settings = await _context.Settings.FirstOrDefaultAsync();

        if (settings == null)
        {
            return NotFound();
        }

        var settingsDto = new SettingsDto
        {
            Id = settings.Id,
            SekToEurRate = settings.SekToEurRate,
            HourlyRateEur = settings.HourlyRateEur,
            TravelHourlyRateEur = settings.TravelHourlyRateEur,
            KmCost = settings.KmCost,
            CreatedDate = settings.CreatedDate,
            ModifiedDate = settings.ModifiedDate
        };

        return Ok(settingsDto);
    }

    [HttpPut]
    public async Task<ActionResult<SettingsDto>> UpdateSettings(UpdateSettingsDto updateDto)
    {
        var settings = await _context.Settings.FirstOrDefaultAsync();

        if (settings == null)
        {
            return NotFound();
        }

        settings.SekToEurRate = updateDto.SekToEurRate;
        settings.HourlyRateEur = updateDto.HourlyRateEur;
        settings.TravelHourlyRateEur = updateDto.TravelHourlyRateEur;
        settings.KmCost = updateDto.KmCost;
        settings.ModifiedDate = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        var settingsDto = new SettingsDto
        {
            Id = settings.Id,
            SekToEurRate = settings.SekToEurRate,
            HourlyRateEur = settings.HourlyRateEur,
            TravelHourlyRateEur = settings.TravelHourlyRateEur,
            KmCost = settings.KmCost,
            CreatedDate = settings.CreatedDate,
            ModifiedDate = settings.ModifiedDate
        };

        return Ok(settingsDto);
    }
}
