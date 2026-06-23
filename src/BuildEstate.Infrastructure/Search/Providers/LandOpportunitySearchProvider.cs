using System.Security.Claims;
using BuildEstate.Application.Features.Search.Interfaces;
using BuildEstate.Application.Features.Search.Models;
using BuildEstate.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace BuildEstate.Infrastructure.Search.Providers;

/// <summary>
/// Search provider for Land Opportunities within the Land Acquisition module.
/// Implements permission-aware, read-optimized search with weighted field scoring.
/// </summary>
public class LandOpportunitySearchProvider : ISearchProvider
{
    private readonly BuildEstateDbContext _dbContext;

    public LandOpportunitySearchProvider(BuildEstateDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public string ModuleId => "land-acquisition";
    public string EntityName => "Land Opportunity";
    public string CategoryName => "Land Acquisition";
    public string Icon => "landscape";
    public int Priority => 1;

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

        var results = await _dbContext.LandOpportunities
            .AsNoTracking()
            .Select(o => new RawSearchResult
            {
                EntityId = o.Id,
                EntityType = EntityName,
                Title = o.Name,
                Subtitle = o.Location,
                Status = o.Status.ToString(),
                StatusVariant = GetStatusVariant(o.Status.ToString()),
                Icon = Icon,
                Category = CategoryName,
                ModuleBadge = "Land",
                NavigationRoute = $"/land-acquisition/opportunities/{o.Id}",
                ModifiedAt = o.UpdatedAt ?? o.CreatedAt,
                Breadcrumb = $"Land Acquisition > {o.Location}",
                CreatedBy = o.CreatedBy,
                SearchableFields = new List<SearchableField>
                {
                    new SearchableField { Name = "Name", Value = o.Name, Weight = 2.0 },
                    new SearchableField { Name = "Location", Value = o.Location, Weight = 1.5 },
                    new SearchableField { Name = "Status", Value = o.Status.ToString(), Weight = 1.0 },
                    new SearchableField { Name = "Source", Value = o.Source ?? string.Empty, Weight = 0.8 }
                },
                QuickActions = new List<SearchQuickAction>
                {
                    new SearchQuickAction
                    {
                        Label = "View",
                        Icon = "visibility",
                        Route = $"/land-acquisition/opportunities/{o.Id}"
                    },
                    new SearchQuickAction
                    {
                        Label = "Edit",
                        Icon = "edit",
                        Route = $"/land-acquisition/opportunities/{o.Id}/edit",
                        Permission = "AcquisitionManager"
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

        return await _dbContext.LandOpportunities
            .AsNoTracking()
            .CountAsync(cancellationToken);
    }

    /// <summary>
    /// Checks if the user has permission to access Land Acquisition search results.
    /// Requires AcquisitionManager or SuperAdmin role.
    /// </summary>
    private static bool HasAccess(ClaimsPrincipal user)
    {
        return user.IsInRole("AcquisitionManager") || user.IsInRole("SuperAdmin");
    }

    /// <summary>
    /// Maps opportunity status to a display colour variant for status badges.
    /// </summary>
    private static string? GetStatusVariant(string status)
    {
        return status switch
        {
            "Identified" => "info",
            "InitialReview" => "info",
            "DueDiligence" => "warning",
            "OfferMade" => "warning",
            "UnderContract" => "accent",
            "Acquired" => "success",
            "Withdrawn" => "error",
            _ => null
        };
    }
}
