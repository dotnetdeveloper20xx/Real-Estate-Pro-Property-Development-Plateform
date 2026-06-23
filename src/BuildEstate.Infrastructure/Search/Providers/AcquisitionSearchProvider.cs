using System.Security.Claims;
using BuildEstate.Application.Features.Search.Interfaces;
using BuildEstate.Application.Features.Search.Models;
using BuildEstate.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace BuildEstate.Infrastructure.Search.Providers;

/// <summary>
/// Search provider for Land Acquisitions within the Land Acquisition module.
/// Implements permission-aware, read-optimized search with weighted field scoring.
/// </summary>
public class AcquisitionSearchProvider : ISearchProvider
{
    private readonly BuildEstateDbContext _dbContext;

    public AcquisitionSearchProvider(BuildEstateDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public string ModuleId => "land-acquisition";
    public string EntityName => "Acquisition";
    public string CategoryName => "Land Acquisition";
    public string Icon => "real_estate_agent";
    public int Priority => 6;

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

        var results = await _dbContext.LandAcquisitions
            .AsNoTracking()
            .Select(a => new RawSearchResult
            {
                EntityId = a.Id,
                EntityType = EntityName,
                Title = a.RegistryRef,
                Subtitle = $"Purchase Price: {a.PurchasePrice:N2}",
                Status = a.Status.ToString(),
                StatusVariant = GetStatusVariant(a.Status.ToString()),
                Icon = Icon,
                Category = CategoryName,
                ModuleBadge = "Land",
                NavigationRoute = $"/land-acquisition/acquisitions/{a.Id}",
                ModifiedAt = a.UpdatedAt ?? a.CreatedAt,
                Breadcrumb = $"Land Acquisition > Acquisitions > {a.RegistryRef}",
                CreatedBy = a.CreatedBy,
                SearchableFields = new List<SearchableField>
                {
                    new SearchableField { Name = "RegistryRef", Value = a.RegistryRef, Weight = 2.0 },
                    new SearchableField { Name = "Status", Value = a.Status.ToString(), Weight = 1.0 },
                    new SearchableField { Name = "PurchasePrice", Value = a.PurchasePrice.ToString("N2"), Weight = 0.8 }
                },
                QuickActions = new List<SearchQuickAction>
                {
                    new SearchQuickAction
                    {
                        Label = "View",
                        Icon = "visibility",
                        Route = $"/land-acquisition/acquisitions/{a.Id}"
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

        return await _dbContext.LandAcquisitions
            .AsNoTracking()
            .CountAsync(cancellationToken);
    }

    private static bool HasAccess(ClaimsPrincipal user)
    {
        return user.IsInRole("AcquisitionManager") || user.IsInRole("SuperAdmin");
    }

    private static string? GetStatusVariant(string status)
    {
        return status switch
        {
            "Completed" => "success",
            "Registered" => "success",
            _ => null
        };
    }
}
