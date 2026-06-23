using System.Security.Claims;
using BuildEstate.Application.Features.Search.Interfaces;
using BuildEstate.Application.Features.Search.Models;
using BuildEstate.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace BuildEstate.Infrastructure.Search.Providers;

/// <summary>
/// Search provider for Compliance Checks within the Legal &amp; Compliance module.
/// Implements permission-aware, read-optimized search with weighted field scoring.
/// </summary>
public class ComplianceCheckSearchProvider : ISearchProvider
{
    private readonly BuildEstateDbContext _dbContext;

    public ComplianceCheckSearchProvider(BuildEstateDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public string ModuleId => "legal";
    public string EntityName => "Compliance Check";
    public string CategoryName => "Legal";
    public string Icon => "verified";
    public int Priority => 21;

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

        var results = await _dbContext.ComplianceChecks
            .AsNoTracking()
            .Include(cc => cc.ComplianceRequirement)
            .Select(cc => new RawSearchResult
            {
                EntityId = cc.Id,
                EntityType = EntityName,
                Title = cc.ComplianceRequirement.Name,
                Subtitle = $"{cc.Outcome.ToString()} — {cc.CheckDate:d}",
                Status = cc.Outcome.ToString(),
                StatusVariant = GetStatusVariant(cc.Outcome.ToString()),
                Icon = Icon,
                Category = CategoryName,
                ModuleBadge = "Legal",
                NavigationRoute = $"/legal/compliance/{cc.ComplianceRequirementId}",
                ModifiedAt = cc.UpdatedAt ?? cc.CreatedAt,
                Breadcrumb = $"Legal > Compliance > {cc.ComplianceRequirement.Category.ToString()}",
                CreatedBy = cc.CreatedBy,
                SearchableFields = new List<SearchableField>
                {
                    new SearchableField { Name = "CheckType", Value = cc.ComplianceRequirement.Name, Weight = 1.5 },
                    new SearchableField { Name = "Status", Value = cc.Outcome.ToString(), Weight = 1.0 },
                    new SearchableField { Name = "Entity", Value = cc.ComplianceRequirement.Category.ToString(), Weight = 1.0 }
                },
                QuickActions = new List<SearchQuickAction>
                {
                    new SearchQuickAction
                    {
                        Label = "View",
                        Icon = "visibility",
                        Route = $"/legal/compliance/{cc.ComplianceRequirementId}"
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

        return await _dbContext.ComplianceChecks
            .AsNoTracking()
            .CountAsync(cancellationToken);
    }

    /// <summary>
    /// Checks if the user has permission to access Legal/Compliance search results.
    /// Requires LegalOfficer or SuperAdmin role.
    /// </summary>
    private static bool HasAccess(ClaimsPrincipal user)
    {
        return user.IsInRole("LegalOfficer") || user.IsInRole("SuperAdmin");
    }

    /// <summary>
    /// Maps compliance check outcome to a display colour variant for status badges.
    /// </summary>
    private static string? GetStatusVariant(string status)
    {
        return status switch
        {
            "Compliant" => "success",
            "NonCompliant" => "error",
            "PartiallyCompliant" => "warning",
            "NotApplicable" => "ghost",
            _ => null
        };
    }
}
