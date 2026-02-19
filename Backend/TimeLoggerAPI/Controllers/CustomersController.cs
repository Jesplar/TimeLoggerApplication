using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TimeLoggerAPI.Data;
using TimeLoggerAPI.DTOs;
using TimeLoggerAPI.Models;

namespace TimeLoggerAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CustomersController : ControllerBase
{
    private readonly TimeLoggerContext _context;

    public CustomersController(TimeLoggerContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<CustomerDto>>> GetCustomers([FromQuery] bool includeInactive = false)
    {
        var query = _context.Customers.AsQueryable();
        
        if (!includeInactive)
        {
            query = query.Where(c => c.IsActive);
        }

        var customers = await query
            .OrderBy(c => c.Name)
            .Select(c => new CustomerDto
            {
                Id = c.Id,
                Name = c.Name,
                IsActive = c.IsActive,
                CreatedDate = c.CreatedDate
            })
            .ToListAsync();

        return Ok(customers);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<CustomerDto>> GetCustomer(int id)
    {
        var customer = await _context.Customers.FindAsync(id);

        if (customer == null)
        {
            return NotFound();
        }

        var customerDto = new CustomerDto
        {
            Id = customer.Id,
            Name = customer.Name,
            IsActive = customer.IsActive,
            CreatedDate = customer.CreatedDate
        };

        return Ok(customerDto);
    }

    [HttpPost]
    public async Task<ActionResult<CustomerDto>> CreateCustomer(CreateCustomerDto createDto)
    {
        if (string.IsNullOrWhiteSpace(createDto.Name))
        {
            return BadRequest("Customer name is required.");
        }

        var customer = new Customer
        {
            Name = createDto.Name.Trim(),
            IsActive = true,
            CreatedDate = DateTime.UtcNow
        };

        _context.Customers.Add(customer);
        await _context.SaveChangesAsync();

        var customerDto = new CustomerDto
        {
            Id = customer.Id,
            Name = customer.Name,
            IsActive = customer.IsActive,
            CreatedDate = customer.CreatedDate
        };

        return CreatedAtAction(nameof(GetCustomer), new { id = customer.Id }, customerDto);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateCustomer(int id, UpdateCustomerDto updateDto)
    {
        if (string.IsNullOrWhiteSpace(updateDto.Name))
        {
            return BadRequest("Customer name is required.");
        }

        var customer = await _context.Customers.FindAsync(id);

        if (customer == null)
        {
            return NotFound();
        }

        customer.Name = updateDto.Name.Trim();
        customer.IsActive = updateDto.IsActive;

        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteCustomer(int id)
    {
        var customer = await _context.Customers
            .Include(c => c.Projects)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (customer == null)
        {
            return NotFound();
        }

        if (customer.Projects.Any())
        {
            return BadRequest("Cannot delete customer with existing projects. Archive it instead.");
        }

        _context.Customers.Remove(customer);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}
