using System.Security.Claims;
using BuildEstate.Application.Features.Search.Interfaces;
using BuildEstate.Application.Features.Search.Models;
using BuildEstate.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace BuildEstate.Infrastructure.Search.Providers;

/// <summary>
/// Search provider for Due Diligence checks within the Land Acquisition module.
/// Implements permission-aware, read-optimized search with weighted field scoring.
/// </summary>
public class DueDiligenceSearchProvider : ISearchProvider
{
    private readonly BuildEstateDbContext _dbContext;

    public DueDiligenceSearchProvider(BuildEstateDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public string ModuleId => "land-acquisition";
    public string EntityName => "Due Diligence";
    public string CategoryName => "Land Acquisition";
    public string Icon => "fact_check";
    public int Priority => 3;

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

        var results = await _dbContext.DueDiligences
            .AsNoTracking()
            .Select(d => new RawSearchResult
            {
                EntityId = d.Id,
                EntityType = EntityName,
                Title = d.Type.ToString(),
                Subtitle = d.Findings ?? string.Empty,
                Status = d.Status.ToString(),
                StatusVariant = GetStatusVariant(d.Status.ToString()),
                Icon = Icon,
                Category = CategoryName,
                ModuleBadge = "Land",
                NavigationRoute = $"/land-acquisition/opportunities/{d.OpportunityId}/due-diligence/{d.Id}",
                ModifiedAt = d.UpdatedAt ?? d.CreatedAt,
                Breadcrumb = $"Land Acquisition > Due Diligence > {d.Type}",
                CreatedBy = d.CreatedBy,
                SearchableFields = new List<SearchableField>
                {
                    new SearchableField { Name = "Type", Value = d.Type.ToString(), Weight = 1.5 },
                    new SearchableField { Name = "Status", Value = d.Status.ToString(), Weight = 1.0 },
                    new SearchableField { Name = "Findings", Value = d.Findings ?? string.Empty, Weight = 1.0 }
                },
                QuickActions = new List<SearchQuickAction>
                {
                    new SearchQuickAction
                    {
                        Label = "View",
                        Icon = "visibility",
                        Route = $"/land-acquisition/opportunities/{d.OpportunityId}/due-diligence/{d.Id}"
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

        return await _dbContext.DueDiligences
            .AsNoTracking()
            .CountAsync(cancellationToken);
    }

    private static bool HasAccess(ClaimsPrincipal user)
    {
        return user.IsInRole("AcquisitionManager") || user.IsInRole("LegalComplianceOfficer") || user.IsInRole("SuperAdmin");
    }

    private static string? GetStatusVariant(string status)
    {
        return status switch
        {
            "Pending" => "ghost",
            "InProgress" => "warning",
            "Completed" => "success",
            "Failed" => "error",
            _ => null
        };
    }
}
