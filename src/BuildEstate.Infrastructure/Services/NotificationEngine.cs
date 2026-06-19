using BuildEstate.Application.Common.Interfaces;
using BuildEstate.Domain.Entities.LandAcquisition;
using BuildEstate.Domain.Entities.Notifications;
using BuildEstate.Domain.Enums;
using BuildEstate.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace BuildEstate.Infrastructure.Services;

public class NotificationEngine : INotificationEngine
{
    private readonly BuildEstateDbContext _context;
    private readonly ILogger<NotificationEngine> _logger;

    public NotificationEngine(BuildEstateDbContext context, ILogger<NotificationEngine> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task EmitAsync(NotificationEvent notificationEvent, CancellationToken cancellationToken = default)
    {
        // 1. Find active rules for this event type
        var rules = await _context.NotificationRules
            .Include(r => r.Template)
            .Where(r => r.EventType == notificationEvent.EventType && r.IsActive && !r.IsDeleted)
            .ToListAsync(cancellationToken);

        if (rules.Count == 0)
        {
            _logger.LogDebug("No notification rules found for event type {EventType}", notificationEvent.EventType);
            return;
        }

        foreach (var rule in rules)
        {
            // 2. Resolve recipients
            var recipientIds = await ResolveRecipientsAsync(rule, notificationEvent, cancellationToken);

            // 3. Resolve template
            var title = ResolveTemplate(rule.Template?.TitleTemplate ?? notificationEvent.EventType, notificationEvent.Variables);
            var body = ResolveTemplate(rule.Template?.BodyTemplate ?? "", notificationEvent.Variables);
            var icon = rule.Template?.IconName ?? "notifications";
            var severity = rule.Template?.Severity ?? NotificationSeverity.Info;

            // 4. Create notification for each recipient (checking preferences)
            foreach (var recipientId in recipientIds)
            {
                // Skip the triggering user (don't notify yourself)
                if (recipientId == notificationEvent.TriggeredByUserId) continue;

                // Check user preferences
                var preference = await _context.UserNotificationPreferences
                    .FirstOrDefaultAsync(p => p.UserId == recipientId && p.EventType == notificationEvent.EventType && !p.IsDeleted, cancellationToken);

                if (preference != null)
                {
                    if (!preference.InAppEnabled) continue;
                    if (preference.MutedUntil.HasValue && preference.MutedUntil > DateTime.UtcNow) continue;
                }

                // Create the notification
                var notification = new Notification
                {
                    RecipientUserId = recipientId,
                    EventType = notificationEvent.EventType,
                    Module = notificationEvent.Module,
                    Title = title,
                    Message = body,
                    Icon = icon,
                    Severity = severity.ToString(),
                    Priority = rule.Priority.ToString(),
                    RelatedEntityId = notificationEvent.EntityId,
                    RelatedEntityType = notificationEvent.EntityType,
                    RelatedUrl = notificationEvent.RelatedUrl,
                    IsRead = false,
                    Channel = rule.Channel.ToString(),
                    DeliveryStatus = "Delivered",
                    SentAt = DateTime.UtcNow,
                    CreatedAt = DateTime.UtcNow,
                    CreatedBy = "System"
                };

                _context.Notifications.Add(notification);
            }
        }

        await _context.SaveChangesAsync(cancellationToken);
    }

    private async Task<List<string>> ResolveRecipientsAsync(NotificationRule rule, NotificationEvent evt, CancellationToken ct)
    {
        var recipients = new List<string>();

        switch (rule.RecipientType)
        {
            case RecipientType.Role:
                // Find all users with this role
                var usersInRole = await _context.UserRoles
                    .Join(_context.Roles, ur => ur.RoleId, r => r.Id, (ur, r) => new { ur.UserId, r.Name })
                    .Where(x => x.Name == rule.RecipientValue)
                    .Select(x => x.UserId)
                    .ToListAsync(ct);
                recipients.AddRange(usersInRole);
                break;

            case RecipientType.SpecificUser:
                recipients.Add(rule.RecipientValue);
                break;

            case RecipientType.EntityCreator:
                if (evt.EntityId.HasValue)
                {
                    var creator = await _context.LandOpportunities
                        .Where(o => o.Id == evt.EntityId.Value)
                        .Select(o => o.CreatedBy)
                        .FirstOrDefaultAsync(ct);
                    if (!string.IsNullOrEmpty(creator)) recipients.Add(creator);
                }
                break;

            case RecipientType.AllModuleRoles:
                // Get all users with any role associated with this module
                var moduleRoles = GetModuleRoles(evt.Module);
                var moduleUsers = await _context.UserRoles
                    .Join(_context.Roles, ur => ur.RoleId, r => r.Id, (ur, r) => new { ur.UserId, RoleName = r.Name })
                    .Where(x => x.RoleName != null && moduleRoles.Contains(x.RoleName))
                    .Select(x => x.UserId)
                    .Distinct()
                    .ToListAsync(ct);
                recipients.AddRange(moduleUsers);
                break;
        }

        return recipients.Distinct().ToList();
    }

    private static string ResolveTemplate(string template, Dictionary<string, string> variables)
    {
        if (string.IsNullOrEmpty(template)) return template;

        var result = template;
        foreach (var (key, value) in variables)
        {
            result = result.Replace($"{{{key}}}", value, StringComparison.OrdinalIgnoreCase);
        }
        return result;
    }

    private static List<string> GetModuleRoles(string module)
    {
        return module switch
        {
            "LandAcquisition" => new List<string> { "AcquisitionManager", "LegalOfficer", "FinanceDirector", "ValuationAnalyst", "Admin", "SuperAdmin" },
            "Planning" => new List<string> { "PlanningManager", "LegalOfficer", "Admin", "SuperAdmin" },
            "Legal" => new List<string> { "LegalOfficer", "FinanceDirector", "Admin", "SuperAdmin" },
            "Construction" => new List<string> { "ProjectManager", "SiteManager", "Admin", "SuperAdmin" },
            "Finance" => new List<string> { "FinanceDirector", "Admin", "SuperAdmin" },
            _ => new List<string> { "SuperAdmin" }
        };
    }
}
