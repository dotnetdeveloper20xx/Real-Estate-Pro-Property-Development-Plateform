using BuildEstate.Domain.Entities.Notifications;
using BuildEstate.Domain.Enums;
using BuildEstate.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BuildEstate.API.Controllers.Admin;

[Route("api/v1/notification-rules")]
[Authorize(Roles = "SuperAdmin")]
public class NotificationRulesController : BaseApiController
{
    private readonly BuildEstateDbContext _context;

    public NotificationRulesController(BuildEstateDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? module, CancellationToken ct)
    {
        var query = _context.NotificationRules
            .Include(r => r.Template)
            .Where(r => !r.IsDeleted)
            .AsNoTracking();

        if (!string.IsNullOrWhiteSpace(module))
            query = query.Where(r => r.Module == module);

        var rules = await query.OrderBy(r => r.Module).ThenBy(r => r.EventType).ToListAsync(ct);

        return Ok(new { success = true, data = rules.Select(r => new {
            r.Id, r.EventType, r.Module, r.Description,
            recipientType = r.RecipientType.ToString(),
            r.RecipientValue,
            channel = r.Channel.ToString(),
            priority = r.Priority.ToString(),
            r.TemplateId,
            templateName = r.Template?.Name,
            r.IsActive,
            r.CreatedAt, r.UpdatedAt
        }), errors = Array.Empty<string>() });
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var rule = await _context.NotificationRules
            .Include(r => r.Template)
            .FirstOrDefaultAsync(r => r.Id == id && !r.IsDeleted, ct);

        if (rule is null) return NotFound();

        return Ok(new { success = true, data = new {
            rule.Id, rule.EventType, rule.Module, rule.Description,
            recipientType = rule.RecipientType.ToString(),
            rule.RecipientValue,
            channel = rule.Channel.ToString(),
            priority = rule.Priority.ToString(),
            rule.TemplateId,
            templateName = rule.Template?.Name,
            rule.IsActive
        }, errors = Array.Empty<string>() });
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateNotificationRuleDto dto, CancellationToken ct)
    {
        var rule = new NotificationRule
        {
            EventType = dto.EventType,
            Module = dto.Module,
            Description = dto.Description ?? "",
            RecipientType = Enum.Parse<RecipientType>(dto.RecipientType),
            RecipientValue = dto.RecipientValue,
            Channel = Enum.Parse<NotificationChannel>(dto.Channel ?? "InApp"),
            Priority = Enum.Parse<NotificationPriority>(dto.Priority ?? "Normal"),
            TemplateId = dto.TemplateId,
            IsActive = dto.IsActive ?? true,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = "SuperAdmin"
        };

        _context.NotificationRules.Add(rule);
        await _context.SaveChangesAsync(ct);

        return Created($"/api/v1/notification-rules/{rule.Id}", new { success = true, data = new { rule.Id }, errors = Array.Empty<string>() });
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateNotificationRuleDto dto, CancellationToken ct)
    {
        var rule = await _context.NotificationRules.FirstOrDefaultAsync(r => r.Id == id && !r.IsDeleted, ct);
        if (rule is null) return NotFound();

        rule.EventType = dto.EventType ?? rule.EventType;
        rule.Module = dto.Module ?? rule.Module;
        rule.Description = dto.Description ?? rule.Description;
        if (dto.RecipientType != null) rule.RecipientType = Enum.Parse<RecipientType>(dto.RecipientType);
        if (dto.RecipientValue != null) rule.RecipientValue = dto.RecipientValue;
        if (dto.Channel != null) rule.Channel = Enum.Parse<NotificationChannel>(dto.Channel);
        if (dto.Priority != null) rule.Priority = Enum.Parse<NotificationPriority>(dto.Priority);
        rule.TemplateId = dto.TemplateId ?? rule.TemplateId;
        if (dto.IsActive.HasValue) rule.IsActive = dto.IsActive.Value;
        rule.UpdatedAt = DateTime.UtcNow;
        rule.UpdatedBy = "SuperAdmin";

        await _context.SaveChangesAsync(ct);
        return Ok(new { success = true, data = new { rule.Id }, errors = Array.Empty<string>() });
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var rule = await _context.NotificationRules.FirstOrDefaultAsync(r => r.Id == id && !r.IsDeleted, ct);
        if (rule is null) return NotFound();

        rule.IsDeleted = true;
        rule.DeletedAt = DateTime.UtcNow;
        rule.DeletedBy = "SuperAdmin";

        await _context.SaveChangesAsync(ct);
        return NoContent();
    }

    [HttpPatch("{id:guid}/toggle")]
    public async Task<IActionResult> Toggle(Guid id, CancellationToken ct)
    {
        var rule = await _context.NotificationRules.FirstOrDefaultAsync(r => r.Id == id && !r.IsDeleted, ct);
        if (rule is null) return NotFound();

        rule.IsActive = !rule.IsActive;
        rule.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(ct);
        return Ok(new { success = true, data = new { rule.Id, rule.IsActive }, errors = Array.Empty<string>() });
    }
}

public record CreateNotificationRuleDto
{
    public string EventType { get; init; } = "";
    public string Module { get; init; } = "";
    public string? Description { get; init; }
    public string RecipientType { get; init; } = "Role";
    public string RecipientValue { get; init; } = "";
    public string? Channel { get; init; }
    public string? Priority { get; init; }
    public Guid? TemplateId { get; init; }
    public bool? IsActive { get; init; }
}

public record UpdateNotificationRuleDto
{
    public string? EventType { get; init; }
    public string? Module { get; init; }
    public string? Description { get; init; }
    public string? RecipientType { get; init; }
    public string? RecipientValue { get; init; }
    public string? Channel { get; init; }
    public string? Priority { get; init; }
    public Guid? TemplateId { get; init; }
    public bool? IsActive { get; init; }
}
