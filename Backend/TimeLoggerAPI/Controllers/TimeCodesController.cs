using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TimeLoggerAPI.Data;
using TimeLoggerAPI.DTOs;
using TimeLoggerAPI.Models;

namespace TimeLoggerAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TimeCodesController : ControllerBase
{
    private readonly TimeLoggerContext _context;

    public TimeCodesController(TimeLoggerContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<TimeCodeDto>>> GetTimeCodes()
    {
        var timeCodes = await _context.TimeCodes
            .Where(tc => tc.IsActive)
            .OrderBy(tc => tc.Code)
            .ToListAsync();

        return Ok(timeCodes.Select(tc => new TimeCodeDto
        {
            Id = tc.Id,
            Code = tc.Code,
            Description = tc.Description,
            IsActive = tc.IsActive
        }));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<TimeCodeDto>> GetTimeCode(int id)
    {
        var timeCode = await _context.TimeCodes.FindAsync(id);

        if (timeCode == null)
        {
            return NotFound();
        }

        return new TimeCodeDto
        {
            Id = timeCode.Id,
            Code = timeCode.Code,
            Description = timeCode.Description,
            IsActive = timeCode.IsActive
        };
    }

    [HttpPost]
    public async Task<ActionResult<TimeCodeDto>> CreateTimeCode(CreateTimeCodeDto dto)
    {
        // Check if code already exists
        if (await _context.TimeCodes.AnyAsync(tc => tc.Code == dto.Code))
        {
            return BadRequest($"Time code {dto.Code} already exists.");
        }

        var timeCode = new TimeCode
        {
            Code = dto.Code,
            Description = dto.Description,
            IsActive = true,
            CreatedDate = DateTime.UtcNow
        };

        _context.TimeCodes.Add(timeCode);
        await _context.SaveChangesAsync();

        var result = new TimeCodeDto
        {
            Id = timeCode.Id,
            Code = timeCode.Code,
            Description = timeCode.Description,
            IsActive = timeCode.IsActive
        };

        return CreatedAtAction(nameof(GetTimeCode), new { id = timeCode.Id }, result);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateTimeCode(int id, UpdateTimeCodeDto dto)
    {
        var timeCode = await _context.TimeCodes.FindAsync(id);

        if (timeCode == null)
        {
            return NotFound();
        }

        // Check if code already exists for another time code
        if (await _context.TimeCodes.AnyAsync(tc => tc.Code == dto.Code && tc.Id != id))
        {
            return BadRequest($"Time code {dto.Code} already exists.");
        }

        timeCode.Code = dto.Code;
        timeCode.Description = dto.Description;
        timeCode.IsActive = dto.IsActive;
        timeCode.ModifiedDate = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteTimeCode(int id)
    {
        var timeCode = await _context.TimeCodes.FindAsync(id);

        if (timeCode == null)
        {
            return NotFound();
        }

        // Check if time code is used by any time entries
        var hasEntries = await _context.TimeEntries.AnyAsync(te => te.TimeCodeId == id);
        if (hasEntries)
        {
            return BadRequest("Cannot delete time code that is in use by time entries.");
        }

        _context.TimeCodes.Remove(timeCode);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}
