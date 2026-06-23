using System.Security.Claims;
using BuildEstate.Application.Features.Search.Interfaces;
using BuildEstate.Application.Features.Search.Models;
using BuildEstate.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace BuildEstate.Infrastructure.Search.Providers;

/// <summary>
/// Search provider for Contracts within the Land Acquisition module.
/// Implements permission-aware, read-optimized search with weighted field scoring.
/// </summary>
public class ContractSearchProvider : ISearchProvider
{
    private readonly BuildEstateDbContext _dbContext;

    public ContractSearchProvider(BuildEstateDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public string ModuleId => "land-acquisition";
    public string EntityName => "Contract";
    public string CategoryName => "Land Acquisition";
    public string Icon => "description";
    public int Priority => 5;

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

        var results = await _dbContext.Contracts
            .AsNoTracking()
            .Select(c => new RawSearchResult
            {
                EntityId = c.Id,
                EntityType = EntityName,
                Title = $"Contract - {c.Status}",
                Subtitle = c.SolicitorFirm ?? string.Empty,
                Status = c.Status.ToString(),
                StatusVariant = GetStatusVariant(c.Status.ToString()),
                Icon = Icon,
                Category = CategoryName,
                ModuleBadge = "Land",
                NavigationRoute = $"/land-acquisition/opportunities/{c.OpportunityId}/contracts/{c.Id}",
                ModifiedAt = c.UpdatedAt ?? c.CreatedAt,
                Breadcrumb = $"Land Acquisition > Contracts > {c.Status}",
                CreatedBy = c.CreatedBy,
                SearchableFields = new List<SearchableField>
                {
                    new SearchableField { Name = "Status", Value = c.Status.ToString(), Weight = 1.5 },
                    new SearchableField { Name = "SolicitorFirm", Value = c.SolicitorFirm ?? string.Empty, Weight = 1.0 }
                },
                QuickActions = new List<SearchQuickAction>
                {
                    new SearchQuickAction
                    {
                        Label = "View",
                        Icon = "visibility",
                        Route = $"/land-acquisition/opportunities/{c.OpportunityId}/contracts/{c.Id}"
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

        return await _dbContext.Contracts
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
            "Draft" => "ghost",
            "UnderLegalReview" => "info",
            "Approved" => "success",
            "Signed" => "success",
            "Exchanged" => "accent",
            "Completed" => "success",
            _ => null
        };
    }
}
