using System.Security.Claims;
using BuildEstate.Application.Features.Search.Interfaces;
using BuildEstate.Application.Features.Search.Models;
using BuildEstate.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace BuildEstate.Infrastructure.Search.Providers;

/// <summary>
/// Search provider for Legal Cases within the Legal &amp; Compliance module.
/// Implements permission-aware, read-optimized search with weighted field scoring.
/// </summary>
public class LegalCaseSearchProvider : ISearchProvider
{
    private readonly BuildEstateDbContext _dbContext;

    public LegalCaseSearchProvider(BuildEstateDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public string ModuleId => "legal";
    public string EntityName => "Legal Case";
    public string CategoryName => "Legal";
    public string Icon => "gavel";
    public int Priority => 20;

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

        var results = await _dbContext.LegalCases
            .AsNoTracking()
            .Select(lc => new RawSearchResult
            {
                EntityId = lc.Id,
                EntityType = EntityName,
                Title = lc.Title,
                Subtitle = lc.CaseReference,
                Status = lc.Status.ToString(),
                StatusVariant = GetStatusVariant(lc.Status.ToString()),
                Icon = Icon,
                Category = CategoryName,
                ModuleBadge = "Legal",
                NavigationRoute = $"/legal/cases/{lc.Id}",
                ModifiedAt = lc.UpdatedAt ?? lc.CreatedAt,
                Breadcrumb = $"Legal > {lc.CaseType.ToString()}",
                CreatedBy = lc.CreatedBy,
                SearchableFields = new List<SearchableField>
                {
                    new SearchableField { Name = "CaseReference", Value = lc.CaseReference, Weight = 2.5 },
                    new SearchableField { Name = "Title", Value = lc.Title, Weight = 2.0 },
                    new SearchableField { Name = "Status", Value = lc.Status.ToString(), Weight = 1.0 },
                    new SearchableField { Name = "Type", Value = lc.CaseType.ToString(), Weight = 1.0 }
                },
                QuickActions = new List<SearchQuickAction>
                {
                    new SearchQuickAction
                    {
                        Label = "View",
                        Icon = "visibility",
                        Route = $"/legal/cases/{lc.Id}"
                    },
                    new SearchQuickAction
                    {
                        Label = "Edit",
                        Icon = "edit",
                        Route = $"/legal/cases/{lc.Id}/edit",
                        Permission = "LegalOfficer"
                    }
                }
            })
            .ToListAsync(cancellationToken);

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

        return await _dbContext.LegalCases
            .AsNoTracking()
            .CountAsync(cancellationToken);
    }

    /// <summary>
    /// Checks if the user has permission to access Legal search results.
    /// Requires LegalOfficer or SuperAdmin role.
    /// </summary>
    private static bool HasAccess(ClaimsPrincipal user)
    {
        return user.IsInRole("LegalOfficer") || user.IsInRole("SuperAdmin");
    }

    /// <summary>
    /// Maps legal case status to a display colour variant for status badges.
    /// </summary>
    private static string? GetStatusVariant(string status)
    {
        return status switch
        {
            "Open" => "info",
            "InProgress" => "warning",
            "UnderReview" => "warning",
            "OnHold" => "ghost",
            "Escalated" => "error",
            "Resolved" => "success",
            "Closed" => "success",
            "Reopened" => "warning",
            _ => null
        };
    }
}
