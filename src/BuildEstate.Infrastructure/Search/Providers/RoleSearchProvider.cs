using System.Security.Claims;
using BuildEstate.Application.Features.Search.Interfaces;
using BuildEstate.Application.Features.Search.Models;
using BuildEstate.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace BuildEstate.Infrastructure.Search.Providers;

/// <summary>
/// Search provider for Roles (ASP.NET Identity ApplicationRole).
/// Restricted to SuperAdmin role only.
/// </summary>
public class RoleSearchProvider : ISearchProvider
{
    private readonly BuildEstateDbContext _dbContext;

    public RoleSearchProvider(BuildEstateDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public string ModuleId => "users";
    public string EntityName => "Role";
    public string CategoryName => "Users";
    public string Icon => "admin_panel_settings";
    public int Priority => 31;

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

        var roles = await _dbContext.Roles
            .AsNoTracking()
            .Select(r => new
            {
                r.Id,
                r.Name,
                r.Description,
                r.IsBuiltIn,
                r.CreatedAt
            })
            .ToListAsync(cancellationToken);

        var results = roles.Select(r =>
        {
            var roleId = Guid.TryParse(r.Id, out var guid) ? guid : Guid.Empty;

            return new RawSearchResult
            {
                EntityId = roleId,
                EntityType = EntityName,
                Title = r.Name ?? string.Empty,
                Subtitle = r.Description,
                Status = r.IsBuiltIn ? "Built-in" : "Custom",
                StatusVariant = r.IsBuiltIn ? "info" : "accent",
                Icon = Icon,
                Category = CategoryName,
                ModuleBadge = "Users",
                NavigationRoute = $"/admin/roles",
                ModifiedAt = r.CreatedAt,
                SearchableFields = new List<SearchableField>
                {
                    new SearchableField { Name = "Name", Value = r.Name ?? string.Empty, Weight = 2.0 },
                    new SearchableField { Name = "Description", Value = r.Description, Weight = 1.0 }
                },
                QuickActions = new List<SearchQuickAction>
                {
                    new SearchQuickAction
                    {
                        Label = "View Roles",
                        Icon = "visibility",
                        Route = "/admin/roles"
                    }
                }
            };
        }).ToList();

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

        return await _dbContext.Roles
            .AsNoTracking()
            .CountAsync(cancellationToken);
    }

    /// <summary>
    /// Only SuperAdmin users can search roles.
    /// </summary>
    private static bool HasAccess(ClaimsPrincipal user)
    {
        return user.IsInRole("SuperAdmin");
    }
}
