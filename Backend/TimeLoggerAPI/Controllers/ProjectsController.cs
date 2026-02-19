using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TimeLoggerAPI.Data;
using TimeLoggerAPI.DTOs;
using TimeLoggerAPI.Models;

namespace TimeLoggerAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProjectsController : ControllerBase
{
    private readonly TimeLoggerContext _context;

    public ProjectsController(TimeLoggerContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ProjectDto>>> GetProjects([FromQuery] int? customerId = null, [FromQuery] bool includeInactive = false)
    {
        var query = _context.Projects.Include(p => p.Customer).AsQueryable();
        
        if (customerId.HasValue)
        {
            query = query.Where(p => p.CustomerId == customerId.Value);
        }

        if (!includeInactive)
        {
            query = query.Where(p => p.IsActive);
        }

        var projects = await query
            .OrderBy(p => p.Customer.Name)
            .ThenBy(p => p.ProjectNumber)
            .Select(p => new ProjectDto
            {
                Id = p.Id,
                CustomerId = p.CustomerId,
                CustomerName = p.Customer.Name,
                ProjectNumber = p.ProjectNumber,
                Name = p.Name,
                IsActive = p.IsActive,
                CreatedDate = p.CreatedDate
            })
            .ToListAsync();

        return Ok(projects);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ProjectDto>> GetProject(int id)
    {
        var project = await _context.Projects
            .Include(p => p.Customer)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (project == null)
        {
            return NotFound();
        }

        var projectDto = new ProjectDto
        {
            Id = project.Id,
            CustomerId = project.CustomerId,
            CustomerName = project.Customer.Name,
            ProjectNumber = project.ProjectNumber,
            Name = project.Name,
            IsActive = project.IsActive,
            CreatedDate = project.CreatedDate
        };

        return Ok(projectDto);
    }

    [HttpPost]
    public async Task<ActionResult<ProjectDto>> CreateProject(CreateProjectDto createDto)
    {
        if (string.IsNullOrWhiteSpace(createDto.ProjectNumber))
        {
            return BadRequest("Project number is required.");
        }

        if (string.IsNullOrWhiteSpace(createDto.Name))
        {
            return BadRequest("Project name is required.");
        }

        var customerExists = await _context.Customers.AnyAsync(c => c.Id == createDto.CustomerId);
        if (!customerExists)
        {
            return BadRequest("Customer not found.");
        }

        // Check for duplicate project number within the same customer
        var duplicateExists = await _context.Projects
            .AnyAsync(p => p.CustomerId == createDto.CustomerId && p.ProjectNumber == createDto.ProjectNumber);

        if (duplicateExists)
        {
            return BadRequest("A project with this project number already exists for this customer.");
        }

        var project = new Project
        {
            CustomerId = createDto.CustomerId,
            ProjectNumber = createDto.ProjectNumber.Trim(),
            Name = createDto.Name.Trim(),
            IsActive = true,
            CreatedDate = DateTime.UtcNow
        };

        _context.Projects.Add(project);
        await _context.SaveChangesAsync();

        var customer = await _context.Customers.FindAsync(project.CustomerId);

        var projectDto = new ProjectDto
        {
            Id = project.Id,
            CustomerId = project.CustomerId,
            CustomerName = customer!.Name,
            ProjectNumber = project.ProjectNumber,
            Name = project.Name,
            IsActive = project.IsActive,
            CreatedDate = project.CreatedDate
        };

        return CreatedAtAction(nameof(GetProject), new { id = project.Id }, projectDto);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateProject(int id, UpdateProjectDto updateDto)
    {
        if (string.IsNullOrWhiteSpace(updateDto.ProjectNumber))
        {
            return BadRequest("Project number is required.");
        }

        if (string.IsNullOrWhiteSpace(updateDto.Name))
        {
            return BadRequest("Project name is required.");
        }

        var project = await _context.Projects.FindAsync(id);

        if (project == null)
        {
            return NotFound();
        }

        var customerExists = await _context.Customers.AnyAsync(c => c.Id == updateDto.CustomerId);
        if (!customerExists)
        {
            return BadRequest("Customer not found.");
        }

        // Check for duplicate project number within the same customer (excluding current project)
        var duplicateExists = await _context.Projects
            .AnyAsync(p => p.Id != id && p.CustomerId == updateDto.CustomerId && p.ProjectNumber == updateDto.ProjectNumber);

        if (duplicateExists)
        {
            return BadRequest("A project with this project number already exists for this customer.");
        }

        project.CustomerId = updateDto.CustomerId;
        project.ProjectNumber = updateDto.ProjectNumber.Trim();
        project.Name = updateDto.Name.Trim();
        project.IsActive = updateDto.IsActive;

        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteProject(int id)
    {
        var project = await _context.Projects
            .Include(p => p.TimeEntries)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (project == null)
        {
            return NotFound();
        }

        if (project.TimeEntries.Any())
        {
            return BadRequest("Cannot delete project with existing time entries. Archive it instead.");
        }

        _context.Projects.Remove(project);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}
