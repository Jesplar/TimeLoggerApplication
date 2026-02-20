using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TimeLoggerAPI.Data;
using TimeLoggerAPI.DTOs;
using TimeLoggerAPI.Models;

namespace TimeLoggerAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ReceiptTypesController : ControllerBase
{
    private readonly TimeLoggerContext _context;

    public ReceiptTypesController(TimeLoggerContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ReceiptTypeDto>>> GetReceiptTypes()
    {
        var types = await _context.ReceiptTypes
            .Where(t => t.IsActive)
            .OrderBy(t => t.Name)
            .Select(t => new ReceiptTypeDto
            {
                Id = t.Id,
                Name = t.Name,
                IsActive = t.IsActive,
                CreatedDate = t.CreatedDate,
                ModifiedDate = t.ModifiedDate
            })
            .ToListAsync();

        return Ok(types);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ReceiptTypeDto>> GetReceiptType(int id)
    {
        var type = await _context.ReceiptTypes
            .Where(t => t.Id == id)
            .Select(t => new ReceiptTypeDto
            {
                Id = t.Id,
                Name = t.Name,
                IsActive = t.IsActive,
                CreatedDate = t.CreatedDate,
                ModifiedDate = t.ModifiedDate
            })
            .FirstOrDefaultAsync();

        if (type == null)
        {
            return NotFound();
        }

        return Ok(type);
    }

    [HttpPost]
    public async Task<ActionResult<ReceiptTypeDto>> CreateReceiptType(CreateReceiptTypeDto dto)
    {
        // Check if name already exists
        var exists = await _context.ReceiptTypes.AnyAsync(t => t.Name == dto.Name);
        if (exists)
        {
            return BadRequest("A receipt type with this name already exists");
        }

        var type = new ReceiptType
        {
            Name = dto.Name,
            IsActive = true,
            CreatedDate = DateTime.UtcNow
        };

        _context.ReceiptTypes.Add(type);
        await _context.SaveChangesAsync();

        var result = new ReceiptTypeDto
        {
            Id = type.Id,
            Name = type.Name,
            IsActive = type.IsActive,
            CreatedDate = type.CreatedDate,
            ModifiedDate = type.ModifiedDate
        };

        return CreatedAtAction(nameof(GetReceiptType), new { id = type.Id }, result);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateReceiptType(int id, UpdateReceiptTypeDto dto)
    {
        var type = await _context.ReceiptTypes.FindAsync(id);

        if (type == null)
        {
            return NotFound();
        }

        // Check if name already exists (excluding current type)
        var exists = await _context.ReceiptTypes.AnyAsync(t => t.Name == dto.Name && t.Id != id);
        if (exists)
        {
            return BadRequest("A receipt type with this name already exists");
        }

        type.Name = dto.Name;
        type.IsActive = dto.IsActive;
        type.ModifiedDate = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteReceiptType(int id)
    {
        var type = await _context.ReceiptTypes.FindAsync(id);

        if (type == null)
        {
            return NotFound();
        }

        // Check if in use
        var inUse = await _context.Receipts.AnyAsync(r => r.ReceiptTypeId == id);
        if (inUse)
        {
            return BadRequest("Cannot delete receipt type that is in use. Set it as inactive instead.");
        }

        _context.ReceiptTypes.Remove(type);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}
