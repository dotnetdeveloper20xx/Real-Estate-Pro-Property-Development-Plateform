using System.Security.Claims;
using BuildEstate.Application.Features.Search.Interfaces;
using BuildEstate.Application.Features.Search.Models;
using BuildEstate.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace BuildEstate.Infrastructure.Search.Providers;

/// <summary>
/// Search provider for Notifications.
/// All authenticated users can search notifications, but results are filtered
/// to only include the current user's own notifications (permission-aware).
/// </summary>
public class NotificationSearchProvider : ISearchProvider
{
    private readonly BuildEstateDbContext _dbContext;

    public NotificationSearchProvider(BuildEstateDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public string ModuleId => "notifications";
    public string EntityName => "Notification";
    public string CategoryName => "Notifications";
    public string Icon => "notifications";
    public int Priority => 50;

    public async Task<SearchProviderResult> SearchAsync(
        SearchRequest request,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        if (!HasAccess(user))
        {
            return new SearchProviderResult
            {
                ModuleId = ModuleId,
                CategoryName = CategoryName,
                Icon = Icon,
                Priority = Priority,
                Results = [],
                TotalCount = 0
            };
        }

        var userId = GetUserId(user);

        // Filter notifications to the current user only
        var notifications = await _dbContext.Notifications
            .AsNoTracking()
            .Where(n => n.RecipientUserId == userId)
            .OrderByDescending(n => n.SentAt)
            .Select(n => new
            {
                n.Id,
                n.Title,
                n.Message,
                n.EventType,
                n.Module,
                n.Icon,
                n.Severity,
                n.Priority,
                n.IsRead,
                n.SentAt,
                n.RelatedEntityId,
                n.RelatedEntityType,
                n.RelatedUrl,
                n.CreatedBy
            })
            .ToListAsync(cancellationToken);

        var results = notifications.Select(n => new RawSearchResult
        {
            EntityId = n.Id,
            EntityType = EntityName,
            Title = n.Title,
            Subtitle = n.Message,
            Status = n.IsRead ? "Read" : "Unread",
            StatusVariant = GetSeverityVariant(n.Severity),
            Icon = Icon,
            Category = CategoryName,
            ModuleBadge = "Notifications",
            NavigationRoute = !string.IsNullOrEmpty(n.RelatedUrl) ? n.RelatedUrl : "/notifications",
            ModifiedAt = n.SentAt,
            Breadcrumb = $"Notifications > {n.Module}",
            CreatedBy = n.CreatedBy,
            SearchableFields = new List<SearchableField>
            {
                new SearchableField { Name = "Title", Value = n.Title, Weight = 2.0 },
                new SearchableField { Name = "Message", Value = n.Message, Weight = 1.0 },
                new SearchableField { Name = "Type", Value = n.EventType, Weight = 1.0 }
            },
            QuickActions = new List<SearchQuickAction>
            {
                new SearchQuickAction
                {
                    Label = "View",
                    Icon = "visibility",
                    Route = !string.IsNullOrEmpty(n.RelatedUrl) ? n.RelatedUrl : "/notifications"
                }
            }
        }).ToList();

        return new SearchProviderResult
        {
            ModuleId = ModuleId,
            CategoryName = CategoryName,
            Icon = Icon,
            Priority = Priority,
            Results = results,
            TotalCount = results.Count
        };
    }

    public async Task<int> CountAsync(
        string query,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        if (!HasAccess(user))
        {
            return 0;
        }

        var userId = GetUserId(user);

        return await _dbContext.Notifications
            .AsNoTracking()
            .Where(n => n.RecipientUserId == userId)
            .CountAsync(cancellationToken);
    }

    /// <summary>
    /// All authenticated users can search their own notifications.
    /// </summary>
    private static bool HasAccess(ClaimsPrincipal user)
    {
        return user.Identity?.IsAuthenticated == true;
    }

    /// <summary>
    /// Extracts the user ID from the ClaimsPrincipal.
    /// </summary>
    private static string GetUserId(ClaimsPrincipal user)
    {
        return user.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
            ?? user.FindFirst("sub")?.Value
            ?? string.Empty;
    }

    /// <summary>
    /// Maps notification severity to a display colour variant.
    /// </summary>
    private static string? GetSeverityVariant(string severity)
    {
        return severity switch
        {
            "Critical" => "error",
            "Warning" => "warning",
            "Info" => "info",
            "Success" => "success",
            _ => null
        };
    }
}
