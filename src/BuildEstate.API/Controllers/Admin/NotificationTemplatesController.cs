using BuildEstate.Domain.Entities.Notifications;
using BuildEstate.Domain.Enums;
using BuildEstate.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BuildEstate.API.Controllers.Admin;

[Route("api/v1/notification-templates")]
[Authorize(Roles = "SuperAdmin")]
public class NotificationTemplatesController : BaseApiController
{
    private readonly BuildEstateDbContext _context;

    public NotificationTemplatesController(BuildEstateDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? eventType, CancellationToken ct)
    {
        var query = _context.NotificationTemplates
            .Where(t => !t.IsDeleted)
            .AsNoTracking();

        if (!string.IsNullOrWhiteSpace(eventType))
            query = query.Where(t => t.EventType == eventType);

        var templates = await query.OrderBy(t => t.EventType).ThenBy(t => t.Name).ToListAsync(ct);

        return Ok(new { success = true, data = templates.Select(t => new {
            t.Id, t.Name, t.EventType, t.TitleTemplate, t.BodyTemplate,
            t.IconName,
            severity = t.Severity.ToString(),
            t.Variables,
            t.IsActive,
            t.CreatedAt, t.UpdatedAt
        }), errors = Array.Empty<string>() });
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var template = await _context.NotificationTemplates
            .FirstOrDefaultAsync(t => t.Id == id && !t.IsDeleted, ct);

        if (template is null) return NotFound();

        return Ok(new { success = true, data = new {
            template.Id, template.Name, template.EventType,
            template.TitleTemplate, template.BodyTemplate,
            template.IconName,
            severity = template.Severity.ToString(),
            template.Variables,
            template.IsActive
        }, errors = Array.Empty<string>() });
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateNotificationTemplateDto dto, CancellationToken ct)
    {
        var template = new NotificationTemplate
        {
            Name = dto.Name,
            EventType = dto.EventType,
            TitleTemplate = dto.TitleTemplate,
            BodyTemplate = dto.BodyTemplate,
            IconName = dto.IconName ?? "notifications",
            Severity = Enum.Parse<NotificationSeverity>(dto.Severity ?? "Info"),
            Variables = dto.Variables ?? "[]",
            IsActive = dto.IsActive ?? true,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = "SuperAdmin"
        };

        _context.NotificationTemplates.Add(template);
        await _context.SaveChangesAsync(ct);

        return Created($"/api/v1/notification-templates/{template.Id}", new { success = true, data = new { template.Id }, errors = Array.Empty<string>() });
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateNotificationTemplateDto dto, CancellationToken ct)
    {
        var template = await _context.NotificationTemplates.FirstOrDefaultAsync(t => t.Id == id && !t.IsDeleted, ct);
        if (template is null) return NotFound();

        template.Name = dto.Name ?? template.Name;
        template.EventType = dto.EventType ?? template.EventType;
        template.TitleTemplate = dto.TitleTemplate ?? template.TitleTemplate;
        template.BodyTemplate = dto.BodyTemplate ?? template.BodyTemplate;
        template.IconName = dto.IconName ?? template.IconName;
        if (dto.Severity != null) template.Severity = Enum.Parse<NotificationSeverity>(dto.Severity);
        template.Variables = dto.Variables ?? template.Variables;
        if (dto.IsActive.HasValue) template.IsActive = dto.IsActive.Value;
        template.UpdatedAt = DateTime.UtcNow;
        template.UpdatedBy = "SuperAdmin";

        await _context.SaveChangesAsync(ct);
        return Ok(new { success = true, data = new { template.Id }, errors = Array.Empty<string>() });
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var template = await _context.NotificationTemplates.FirstOrDefaultAsync(t => t.Id == id && !t.IsDeleted, ct);
        if (template is null) return NotFound();

        template.IsDeleted = true;
        template.DeletedAt = DateTime.UtcNow;
        template.DeletedBy = "SuperAdmin";

        await _context.SaveChangesAsync(ct);
        return NoContent();
    }
}

public record CreateNotificationTemplateDto
{
    public string Name { get; init; } = "";
    public string EventType { get; init; } = "";
    public string TitleTemplate { get; init; } = "";
    public string BodyTemplate { get; init; } = "";
    public string? IconName { get; init; }
    public string? Severity { get; init; }
    public string? Variables { get; init; }
    public bool? IsActive { get; init; }
}

public record UpdateNotificationTemplateDto
{
    public string? Name { get; init; }
    public string? EventType { get; init; }
    public string? TitleTemplate { get; init; }
    public string? BodyTemplate { get; init; }
    public string? IconName { get; init; }
    public string? Severity { get; init; }
    public string? Variables { get; init; }
    public bool? IsActive { get; init; }
}
