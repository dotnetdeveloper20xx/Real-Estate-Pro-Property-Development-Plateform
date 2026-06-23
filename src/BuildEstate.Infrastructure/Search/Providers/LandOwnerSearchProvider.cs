using System.Security.Claims;
using BuildEstate.Application.Features.Search.Interfaces;
using BuildEstate.Application.Features.Search.Models;
using BuildEstate.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace BuildEstate.Infrastructure.Search.Providers;

/// <summary>
/// Search provider for Land Owners within the Land Acquisition module.
/// Implements permission-aware, read-optimized search with weighted field scoring.
/// </summary>
public class LandOwnerSearchProvider : ISearchProvider
{
    private readonly BuildEstateDbContext _dbContext;

    public LandOwnerSearchProvider(BuildEstateDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public string ModuleId => "land-acquisition";
    public string EntityName => "Land Owner";
    public string CategoryName => "Land Acquisition";
    public string Icon => "person";
    public int Priority => 2;

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

        var results = await _dbContext.LandOwners
            .AsNoTracking()
            .Select(o => new RawSearchResult
            {
                EntityId = o.Id,
                EntityType = EntityName,
                Title = o.Name,
                Subtitle = o.Address ?? string.Empty,
                Status = o.OwnershipType.ToString(),
                StatusVariant = "info",
                Icon = Icon,
                Category = CategoryName,
                ModuleBadge = "Land",
                NavigationRoute = $"/land-acquisition/owners/{o.Id}",
                ModifiedAt = o.UpdatedAt ?? o.CreatedAt,
                Breadcrumb = $"Land Acquisition > Owners > {o.Name}",
                CreatedBy = o.CreatedBy,
                SearchableFields = new List<SearchableField>
                {
                    new SearchableField { Name = "Name", Value = o.Name, Weight = 2.0 },
                    new SearchableField { Name = "ContactDetails", Value = o.ContactDetails ?? string.Empty, Weight = 1.0 },
                    new SearchableField { Name = "Address", Value = o.Address ?? string.Empty, Weight = 1.0 }
                },
                QuickActions = new List<SearchQuickAction>
                {
                    new SearchQuickAction
                    {
                        Label = "View",
                        Icon = "visibility",
                        Route = $"/land-acquisition/owners/{o.Id}"
                    },
                    new SearchQuickAction
                    {
                        Label = "Edit",
                        Icon = "edit",
                        Route = $"/land-acquisition/owners/{o.Id}/edit",
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

        return await _dbContext.LandOwners
            .AsNoTracking()
            .CountAsync(cancellationToken);
    }

    /// <summary>
    /// Checks if the user has permission to access Land Owner search results.
    /// Requires AcquisitionManager or SuperAdmin role.
    /// </summary>
    private static bool HasAccess(ClaimsPrincipal user)
    {
        return user.IsInRole("AcquisitionManager") || user.IsInRole("SuperAdmin");
    }
}
