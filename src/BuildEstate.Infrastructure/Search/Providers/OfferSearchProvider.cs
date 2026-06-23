using System.Security.Claims;
using BuildEstate.Application.Features.Search.Interfaces;
using BuildEstate.Application.Features.Search.Models;
using BuildEstate.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace BuildEstate.Infrastructure.Search.Providers;

/// <summary>
/// Search provider for Offers within the Land Acquisition module.
/// Implements permission-aware, read-optimized search with weighted field scoring.
/// </summary>
public class OfferSearchProvider : ISearchProvider
{
    private readonly BuildEstateDbContext _dbContext;

    public OfferSearchProvider(BuildEstateDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public string ModuleId => "land-acquisition";
    public string EntityName => "Offer";
    public string CategoryName => "Land Acquisition";
    public string Icon => "local_offer";
    public int Priority => 4;

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

        var results = await _dbContext.Offers
            .AsNoTracking()
            .Select(o => new RawSearchResult
            {
                EntityId = o.Id,
                EntityType = EntityName,
                Title = $"{o.Currency} {o.Amount:N2}",
                Subtitle = $"Offer for opportunity",
                Status = o.Status.ToString(),
                StatusVariant = GetStatusVariant(o.Status.ToString()),
                Icon = Icon,
                Category = CategoryName,
                ModuleBadge = "Land",
                NavigationRoute = $"/land-acquisition/opportunities/{o.OpportunityId}/offers/{o.Id}",
                ModifiedAt = o.UpdatedAt ?? o.CreatedAt,
                Breadcrumb = $"Land Acquisition > Offers > {o.Currency} {o.Amount:N2}",
                CreatedBy = o.CreatedBy,
                SearchableFields = new List<SearchableField>
                {
                    new SearchableField { Name = "Amount", Value = o.Amount.ToString("N2"), Weight = 1.0 },
                    new SearchableField { Name = "Status", Value = o.Status.ToString(), Weight = 1.5 },
                    new SearchableField { Name = "Currency", Value = o.Currency ?? string.Empty, Weight = 0.5 }
                },
                QuickActions = new List<SearchQuickAction>
                {
                    new SearchQuickAction
                    {
                        Label = "View",
                        Icon = "visibility",
                        Route = $"/land-acquisition/opportunities/{o.OpportunityId}/offers/{o.Id}"
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

        return await _dbContext.Offers
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
            "UnderReview" => "info",
            "Accepted" => "success",
            "Rejected" => "error",
            "CounterOffered" => "warning",
            _ => null
        };
    }
}
