using System.Security.Claims;
using BuildEstate.Application.Features.Search.Interfaces;
using BuildEstate.Application.Features.Search.Models;
using BuildEstate.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace BuildEstate.Infrastructure.Search.Providers;

/// <summary>
/// Search provider for Planning Conditions within the Planning &amp; Approvals module.
/// Implements permission-aware, read-optimized search with weighted field scoring.
/// </summary>
public class PlanningConditionSearchProvider : ISearchProvider
{
    private readonly BuildEstateDbContext _dbContext;

    public PlanningConditionSearchProvider(BuildEstateDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public string ModuleId => "planning";
    public string EntityName => "Planning Condition";
    public string CategoryName => "Planning";
    public string Icon => "checklist";
    public int Priority => 11;

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

        var results = await _dbContext.PlanningConditions
            .AsNoTracking()
            .Include(pc => pc.Application)
            .Select(pc => new RawSearchResult
            {
                EntityId = pc.Id,
                EntityType = EntityName,
                Title = pc.Description.Length > 60 ? pc.Description.Substring(0, 60) + "..." : pc.Description,
                Subtitle = pc.Application.ApplicationReference ?? "Planning Application",
                Status = pc.Status.ToString(),
                StatusVariant = GetStatusVariant(pc.Status.ToString()),
                Icon = Icon,
                Category = CategoryName,
                ModuleBadge = "Planning",
                NavigationRoute = $"/planning/applications/{pc.ApplicationId}",
                ModifiedAt = pc.UpdatedAt ?? pc.CreatedAt,
                Breadcrumb = $"Planning > Conditions",
                CreatedBy = pc.CreatedBy,
                SearchableFields = new List<SearchableField>
                {
                    new SearchableField { Name = "Description", Value = pc.Description, Weight = 1.5 },
                    new SearchableField { Name = "Status", Value = pc.Status.ToString(), Weight = 1.0 }
                },
                QuickActions = new List<SearchQuickAction>
                {
                    new SearchQuickAction
                    {
                        Label = "View Application",
                        Icon = "visibility",
                        Route = $"/planning/applications/{pc.ApplicationId}"
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

        return await _dbContext.PlanningConditions
            .AsNoTracking()
            .CountAsync(cancellationToken);
    }

    /// <summary>
    /// Checks if the user has permission to access Planning search results.
    /// Requires PlanningManager or SuperAdmin role.
    /// </summary>
    private static bool HasAccess(ClaimsPrincipal user)
    {
        return user.IsInRole("PlanningManager") || user.IsInRole("SuperAdmin");
    }

    /// <summary>
    /// Maps condition status to a display colour variant for status badges.
    /// </summary>
    private static string? GetStatusVariant(string status)
    {
        return status switch
        {
            "Outstanding" => "warning",
            "SubmittedForDischarge" => "info",
            "Discharged" => "success",
            "Rejected" => "error",
            _ => null
        };
    }
}
