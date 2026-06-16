using BuildEstate.Application.Common;
using BuildEstate.Application.Features.UserManagement.Roles.DTOs;
using BuildEstate.Application.Interfaces;
using BuildEstate.Infrastructure.Identity;
using BuildEstate.Infrastructure.Persistence;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace BuildEstate.Infrastructure.Services;

/// <summary>
/// Provides role and permission query operations.
/// Uses ASP.NET Identity's RoleManager for role data,
/// and the DbContext for permission and role-permission queries.
/// </summary>
public sealed class RoleQueryService : IRoleQueryService
{
    private readonly RoleManager<ApplicationRole> _roleManager;
    private readonly BuildEstateDbContext _dbContext;

    public RoleQueryService(
        RoleManager<ApplicationRole> roleManager,
        BuildEstateDbContext dbContext)
    {
        _roleManager = roleManager;
        _dbContext = dbContext;
    }

    /// <inheritdoc />
    public async Task<PagedResult<RoleListItemDto>> GetRolesAsync(
        int page,
        int pageSize,
        string? searchTerm,
        CancellationToken ct = default)
    {
        var query = _roleManager.Roles.AsNoTracking();

        // Apply case-insensitive search across Name and Description
        if (!string.IsNullOrWhiteSpace(searchTerm))
        {
            var term = searchTerm.Trim().ToLower();
            query = query.Where(r =>
                r.Name!.ToLower().Contains(term) ||
                r.Description.ToLower().Contains(term));
        }

        // Get total count before pagination
        var totalCount = await query.CountAsync(ct);

        // Apply ordering by Name for consistent results
        query = query.OrderBy(r => r.Name);

        // Apply pagination
        var roles = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        // Get user counts for each role using AspNetUserRoles join table
        var roleIds = roles.Select(r => r.Id).ToList();
        var userCounts = await _dbContext.UserRoles
            .Where(ur => roleIds.Contains(ur.RoleId))
            .GroupBy(ur => ur.RoleId)
            .Select(g => new { RoleId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.RoleId, x => x.Count, ct);

        var items = roles.Select(role => new RoleListItemDto
        {
            Id = role.Id,
            Name = role.Name ?? string.Empty,
            Description = role.Description,
            UserCount = userCounts.GetValueOrDefault(role.Id, 0),
            IsBuiltIn = role.IsBuiltIn
        }).ToList();

        return PagedResult<RoleListItemDto>.Create(items, totalCount, page, pageSize);
    }

    /// <inheritdoc />
    public async Task<RoleDetailDto?> GetRoleByIdAsync(string roleId, CancellationToken ct = default)
    {
        var role = await _roleManager.Roles
            .AsNoTracking()
            .FirstOrDefaultAsync(r => r.Id == roleId, ct);

        if (role is null)
        {
            return null;
        }

        // Get user count for this role
        var userCount = await _dbContext.UserRoles
            .CountAsync(ur => ur.RoleId == roleId, ct);

        // Get assigned permissions via the RolePermission join table
        var permissions = await _dbContext.RolePermissions
            .AsNoTracking()
            .Where(rp => rp.RoleId == roleId)
            .Join(
                _dbContext.Permissions.AsNoTracking(),
                rp => rp.PermissionId,
                p => p.Id,
                (rp, p) => new PermissionItemDto
                {
                    Id = p.Id,
                    Name = p.Name,
                    DisplayName = p.DisplayName,
                    DomainArea = p.DomainArea
                })
            .OrderBy(p => p.DomainArea)
            .ThenBy(p => p.DisplayName)
            .ToArrayAsync(ct);

        return new RoleDetailDto
        {
            Id = role.Id,
            Name = role.Name ?? string.Empty,
            Description = role.Description,
            UserCount = userCount,
            IsBuiltIn = role.IsBuiltIn,
            Permissions = permissions
        };
    }

    /// <inheritdoc />
    public async Task<PermissionMatrixDto> GetPermissionMatrixAsync(CancellationToken ct = default)
    {
        // Get all roles
        var roles = await _roleManager.Roles
            .AsNoTracking()
            .OrderBy(r => r.Name)
            .Select(r => new PermissionMatrixRoleDto
            {
                Id = r.Id,
                Name = r.Name ?? string.Empty
            })
            .ToArrayAsync(ct);

        // Get all permissions grouped by domain area
        var allPermissions = await _dbContext.Permissions
            .AsNoTracking()
            .OrderBy(p => p.DomainArea)
            .ThenBy(p => p.DisplayName)
            .ToListAsync(ct);

        var permissionGroups = allPermissions
            .GroupBy(p => p.DomainArea)
            .OrderBy(g => g.Key)
            .Select(g => new PermissionGroupDto
            {
                DomainArea = g.Key,
                Permissions = g.Select(p => new PermissionItemDto
                {
                    Id = p.Id,
                    Name = p.Name,
                    DisplayName = p.DisplayName,
                    DomainArea = p.DomainArea
                }).ToArray()
            })
            .ToArray();

        // Get all role-permission assignments to build the cells
        var rolePermissions = await _dbContext.RolePermissions
            .AsNoTracking()
            .ToListAsync(ct);

        // Build a HashSet for fast lookups
        var grantedSet = new HashSet<(string RoleId, Guid PermissionId)>(
            rolePermissions.Select(rp => (rp.RoleId, rp.PermissionId)));

        // Generate cells for every role × permission combination
        var cells = new List<PermissionMatrixCellDto>();
        foreach (var role in roles)
        {
            foreach (var permission in allPermissions)
            {
                cells.Add(new PermissionMatrixCellDto
                {
                    RoleId = role.Id,
                    PermissionId = permission.Id,
                    IsGranted = grantedSet.Contains((role.Id, permission.Id))
                });
            }
        }

        return new PermissionMatrixDto
        {
            Roles = roles,
            PermissionGroups = permissionGroups,
            Cells = cells.ToArray()
        };
    }
}
