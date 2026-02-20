using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TimeLoggerAPI.Data;
using TimeLoggerAPI.DTOs;
using TimeLoggerAPI.Models;

namespace TimeLoggerAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ReceiptsController : ControllerBase
{
    private readonly TimeLoggerContext _context;
    private readonly IConfiguration _configuration;
    private readonly ILogger<ReceiptsController> _logger;

    public ReceiptsController(TimeLoggerContext context, IConfiguration configuration, ILogger<ReceiptsController> logger)
    {
        _context = context;
        _configuration = configuration;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ReceiptDto>>> GetReceipts([FromQuery] DateTime? startDate = null, [FromQuery] DateTime? endDate = null, [FromQuery] int? projectId = null)
    {
        var query = _context.Receipts
            .Include(r => r.Project)
            .ThenInclude(p => p.Customer)
            .Include(r => r.ReceiptType)
            .AsQueryable();

        if (startDate.HasValue)
        {
            query = query.Where(r => r.Date >= startDate.Value);
        }

        if (endDate.HasValue)
        {
            query = query.Where(r => r.Date <= endDate.Value);
        }

        if (projectId.HasValue)
        {
            query = query.Where(r => r.ProjectId == projectId.Value);
        }

        var receipts = await query
            .OrderByDescending(r => r.Date)
            .Select(r => new ReceiptDto
            {
                Id = r.Id,
                ProjectId = r.ProjectId,
                ProjectName = r.Project.Name,
                ProjectNumber = r.Project.ProjectNumber,
                CustomerName = r.Project.Customer.Name,
                ReceiptTypeId = r.ReceiptTypeId,
                ReceiptTypeName = r.ReceiptType.Name,
                Date = r.Date,
                FileName = r.FileName,
                Cost = r.Cost,
                Currency = r.Currency,
                CreatedDate = r.CreatedDate,
                ModifiedDate = r.ModifiedDate
            })
            .ToListAsync();

        return Ok(receipts);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ReceiptDto>> GetReceipt(int id)
    {
        var receipt = await _context.Receipts
            .Include(r => r.Project)
            .ThenInclude(p => p.Customer)
            .Include(r => r.ReceiptType)
            .Where(r => r.Id == id)
            .Select(r => new ReceiptDto
            {
                Id = r.Id,
                ProjectId = r.ProjectId,
                ProjectName = r.Project.Name,
                ProjectNumber = r.Project.ProjectNumber,
                CustomerName = r.Project.Customer.Name,
                ReceiptTypeId = r.ReceiptTypeId,
                ReceiptTypeName = r.ReceiptType.Name,
                Date = r.Date,
                FileName = r.FileName,
                Cost = r.Cost,
                Currency = r.Currency,
                CreatedDate = r.CreatedDate,
                ModifiedDate = r.ModifiedDate
            })
            .FirstOrDefaultAsync();

        if (receipt == null)
        {
            return NotFound();
        }

        return Ok(receipt);
    }

    [HttpPost]
    [RequestSizeLimit(10_000_000)] // 10MB limit
    public async Task<ActionResult<ReceiptDto>> CreateReceipt([FromForm] CreateReceiptDto dto, [FromForm] IFormFile? file)
    {
        // Validate project exists
        var project = await _context.Projects
            .Include(p => p.Customer)
            .FirstOrDefaultAsync(p => p.Id == dto.ProjectId);

        if (project == null)
        {
            return BadRequest("Project not found");
        }

        // Validate receipt type exists
        var receiptType = await _context.ReceiptTypes.FindAsync(dto.ReceiptTypeId);
        if (receiptType == null)
        {
            return BadRequest("Receipt type not found");
        }

        // Validate currency
        if (dto.Currency != "SEK" && dto.Currency != "EUR")
        {
            return BadRequest("Currency must be either 'SEK' or 'EUR'");
        }

        // Get receipts directory from configuration or use default
        var receiptsBasePath = _configuration["ReceiptsPath"];
        if (string.IsNullOrEmpty(receiptsBasePath))
        {
            // Default to Documents folder if not configured
            var documentsPath = Environment.GetFolderPath(Environment.SpecialFolder.MyDocuments);
            receiptsBasePath = Path.Combine(documentsPath, "TimeLogger", "Receipts");
        }

        // Create project subfolder
        var projectFolder = Path.Combine(receiptsBasePath, SanitizeFolderName(project.ProjectNumber));
        Directory.CreateDirectory(projectFolder);

        string fileName = dto.FileName;

        // Handle file upload if provided
        if (file != null && file.Length > 0)
        {
            // Use original file name if FileName is not provided
            if (string.IsNullOrWhiteSpace(fileName))
            {
                fileName = file.FileName;
            }

            // Sanitize filename
            fileName = SanitizeFileName(fileName);

            // Make filename unique if it already exists
            var filePath = Path.Combine(projectFolder, fileName);
            var counter = 1;
            var fileNameWithoutExt = Path.GetFileNameWithoutExtension(fileName);
            var extension = Path.GetExtension(fileName);

            while (System.IO.File.Exists(filePath))
            {
                fileName = $"{fileNameWithoutExt}_{counter}{extension}";
                filePath = Path.Combine(projectFolder, fileName);
                counter++;
            }

            // Save the file
            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            _logger.LogInformation($"Receipt file saved: {filePath}");
        }

        var receipt = new Receipt
        {
            ProjectId = dto.ProjectId,
            ReceiptTypeId = dto.ReceiptTypeId,
            Date = dto.Date,
            FileName = fileName,
            Cost = dto.Cost,
            Currency = dto.Currency,
            CreatedDate = DateTime.UtcNow
        };

        _context.Receipts.Add(receipt);
        await _context.SaveChangesAsync();

        // Return the created receipt with all details
        var createdReceipt = await _context.Receipts
            .Include(r => r.Project)
            .ThenInclude(p => p.Customer)
            .Include(r => r.ReceiptType)
            .Where(r => r.Id == receipt.Id)
            .Select(r => new ReceiptDto
            {
                Id = r.Id,
                ProjectId = r.ProjectId,
                ProjectName = r.Project.Name,
                ProjectNumber = r.Project.ProjectNumber,
                CustomerName = r.Project.Customer.Name,
                ReceiptTypeId = r.ReceiptTypeId,
                ReceiptTypeName = r.ReceiptType.Name,
                Date = r.Date,
                FileName = r.FileName,
                Cost = r.Cost,
                Currency = r.Currency,
                CreatedDate = r.CreatedDate,
                ModifiedDate = r.ModifiedDate
            })
            .FirstAsync();

        return CreatedAtAction(nameof(GetReceipt), new { id = receipt.Id }, createdReceipt);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateReceipt(int id, UpdateReceiptDto dto)
    {
        var receipt = await _context.Receipts.FindAsync(id);

        if (receipt == null)
        {
            return NotFound();
        }

        // Validate project exists
        var project = await _context.Projects.FindAsync(dto.ProjectId);
        if (project == null)
        {
            return BadRequest("Project not found");
        }

        // Validate receipt type exists
        var receiptType = await _context.ReceiptTypes.FindAsync(dto.ReceiptTypeId);
        if (receiptType == null)
        {
            return BadRequest("Receipt type not found");
        }

        // Validate currency
        if (dto.Currency != "SEK" && dto.Currency != "EUR")
        {
            return BadRequest("Currency must be either 'SEK' or 'EUR'");
        }

        receipt.ProjectId = dto.ProjectId;
        receipt.ReceiptTypeId = dto.ReceiptTypeId;
        receipt.Date = dto.Date;
        receipt.FileName = dto.FileName;
        receipt.Cost = dto.Cost;
        receipt.Currency = dto.Currency;
        receipt.ModifiedDate = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteReceipt(int id)
    {
        var receipt = await _context.Receipts.FindAsync(id);

        if (receipt == null)
        {
            return NotFound();
        }

        _context.Receipts.Remove(receipt);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpGet("directory")]
    public ActionResult<string> GetReceiptsDirectory()
    {
        var receiptsBasePath = _configuration["ReceiptsPath"];
        if (string.IsNullOrEmpty(receiptsBasePath))
        {
            var documentsPath = Environment.GetFolderPath(Environment.SpecialFolder.MyDocuments);
            receiptsBasePath = Path.Combine(documentsPath, "TimeLogger", "Receipts");
        }

        return Ok(new { path = receiptsBasePath });
    }

    [HttpPost("directory")]
    public ActionResult SetReceiptsDirectory([FromBody] SetReceiptsDirectoryDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Path))
        {
            return BadRequest("Path cannot be empty");
        }

        if (!Directory.Exists(dto.Path))
        {
            return BadRequest("Directory does not exist");
        }

        // Note: This only sets it for the current session. 
        // In a real app, you'd want to persist this to a settings file
        _configuration["ReceiptsPath"] = dto.Path;

        return Ok(new { path = dto.Path });
    }

    private static string SanitizeFileName(string fileName)
    {
        var invalidChars = Path.GetInvalidFileNameChars();
        return string.Join("_", fileName.Split(invalidChars, StringSplitOptions.RemoveEmptyEntries)).TrimEnd('.');
    }

    private static string SanitizeFolderName(string folderName)
    {
        var invalidChars = Path.GetInvalidPathChars();
        return string.Join("_", folderName.Split(invalidChars, StringSplitOptions.RemoveEmptyEntries)).TrimEnd('.');
    }
}

public class SetReceiptsDirectoryDto
{
    public string Path { get; set; } = string.Empty;
}
