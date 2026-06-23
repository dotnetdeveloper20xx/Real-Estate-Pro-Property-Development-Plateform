using System.Security.Claims;
using BuildEstate.Application.Features.Search.Interfaces;
using BuildEstate.Application.Features.Search.Models;
using BuildEstate.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace BuildEstate.Infrastructure.Search.Providers;

/// <summary>
/// Search provider for Users (ASP.NET Identity ApplicationUser).
/// Restricted to SuperAdmin role only.
/// </summary>
public class UserSearchProvider : ISearchProvider
{
    private readonly BuildEstateDbContext _dbContext;

    public UserSearchProvider(BuildEstateDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public string ModuleId => "users";
    public string EntityName => "User";
    public string CategoryName => "Users";
    public string Icon => "person";
    public int Priority => 30;

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

        // Join users with their roles via the AspNetUserRoles join table
        var usersWithRoles = await _dbContext.Users
            .AsNoTracking()
            .Where(u => u.IsActive)
            .Select(u => new
            {
                u.Id,
                u.FirstName,
                u.LastName,
                u.Email,
                u.CreatedAt,
                u.UpdatedAt,
                u.CreatedBy,
                Roles = _dbContext.UserRoles
                    .Where(ur => ur.UserId == u.Id)
                    .Join(_dbContext.Roles, ur => ur.RoleId, r => r.Id, (ur, r) => r.Name)
                    .ToList()
            })
            .ToListAsync(cancellationToken);

        var results = usersWithRoles.Select(u =>
        {
            var fullName = $"{u.FirstName} {u.LastName}".Trim();
            var roleDisplay = u.Roles.Any() ? string.Join(", ", u.Roles) : "No Role";

            return new RawSearchResult
            {
                EntityId = Guid.TryParse(u.Id, out var guid) ? guid : Guid.Empty,
                EntityType = EntityName,
                Title = fullName,
                Subtitle = u.Email ?? string.Empty,
                Status = roleDisplay,
                StatusVariant = "info",
                Icon = Icon,
                Category = CategoryName,
                ModuleBadge = "Users",
                NavigationRoute = $"/admin/users/{u.Id}",
                ModifiedAt = u.UpdatedAt ?? u.CreatedAt,
                CreatedBy = u.CreatedBy,
                SearchableFields = new List<SearchableField>
                {
                    new SearchableField { Name = "FullName", Value = fullName, Weight = 2.5 },
                    new SearchableField { Name = "Email", Value = u.Email ?? string.Empty, Weight = 2.0 },
                    new SearchableField { Name = "Role", Value = roleDisplay, Weight = 1.5 },
                    new SearchableField { Name = "Department", Value = string.Empty, Weight = 1.0 }
                },
                QuickActions = new List<SearchQuickAction>
                {
                    new SearchQuickAction
                    {
                        Label = "View",
                        Icon = "visibility",
                        Route = $"/admin/users/{u.Id}"
                    },
                    new SearchQuickAction
                    {
                        Label = "Edit",
                        Icon = "edit",
                        Route = $"/admin/users/{u.Id}",
                        Permission = "SuperAdmin"
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

        return await _dbContext.Users
            .AsNoTracking()
            .Where(u => u.IsActive)
            .CountAsync(cancellationToken);
    }

    /// <summary>
    /// Only SuperAdmin users can search users.
    /// </summary>
    private static bool HasAccess(ClaimsPrincipal user)
    {
        return user.IsInRole("SuperAdmin");
    }
}
