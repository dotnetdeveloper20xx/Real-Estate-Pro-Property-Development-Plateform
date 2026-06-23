using System.Security.Claims;
using BuildEstate.Application.Features.Search.Interfaces;
using BuildEstate.Application.Features.Search.Models;
using BuildEstate.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace BuildEstate.Infrastructure.Search.Providers;

/// <summary>
/// Search provider for Planning Applications within the Planning &amp; Approvals module.
/// Implements permission-aware, read-optimized search with weighted field scoring.
/// </summary>
public class PlanningApplicationSearchProvider : ISearchProvider
{
    private readonly BuildEstateDbContext _dbContext;

    public PlanningApplicationSearchProvider(BuildEstateDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public string ModuleId => "planning";
    public string EntityName => "Planning Application";
    public string CategoryName => "Planning";
    public string Icon => "assignment";
    public int Priority => 10;

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

        var results = await _dbContext.PlanningApplications
            .AsNoTracking()
            .Select(pa => new RawSearchResult
            {
                EntityId = pa.Id,
                EntityType = EntityName,
                Title = pa.ApplicationReference ?? "Planning Application",
                Subtitle = pa.Description,
                Status = pa.Status.ToString(),
                StatusVariant = GetStatusVariant(pa.Status.ToString()),
                Icon = Icon,
                Category = CategoryName,
                ModuleBadge = "Planning",
                NavigationRoute = $"/planning/applications/{pa.Id}",
                ModifiedAt = pa.UpdatedAt ?? pa.CreatedAt,
                Breadcrumb = $"Planning > {pa.CouncilName}",
                CreatedBy = pa.CreatedBy,
                SearchableFields = new List<SearchableField>
                {
                    new SearchableField { Name = "ReferenceNumber", Value = pa.ApplicationReference ?? string.Empty, Weight = 2.5 },
                    new SearchableField { Name = "Description", Value = pa.Description, Weight = 2.0 },
                    new SearchableField { Name = "Status", Value = pa.Status.ToString(), Weight = 1.0 },
                    new SearchableField { Name = "CouncilName", Value = pa.CouncilName, Weight = 1.5 }
                },
                QuickActions = new List<SearchQuickAction>
                {
                    new SearchQuickAction
                    {
                        Label = "View",
                        Icon = "visibility",
                        Route = $"/planning/applications/{pa.Id}"
                    },
                    new SearchQuickAction
                    {
                        Label = "Edit",
                        Icon = "edit",
                        Route = $"/planning/applications/{pa.Id}/edit",
                        Permission = "PlanningManager"
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

        return await _dbContext.PlanningApplications
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
    /// Maps planning application status to a display colour variant for status badges.
    /// </summary>
    private static string? GetStatusVariant(string status)
    {
        return status switch
        {
            "PreApplication" => "info",
            "Submitted" => "info",
            "Validated" => "info",
            "UnderReview" => "warning",
            "CommitteeReview" => "warning",
            "Approved" => "success",
            "ApprovedWithConditions" => "success",
            "Refused" => "error",
            "Appeal" => "warning",
            "Withdrawn" => "error",
            _ => null
        };
    }
}
