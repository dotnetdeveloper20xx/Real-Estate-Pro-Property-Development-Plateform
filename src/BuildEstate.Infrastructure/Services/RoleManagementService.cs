using BuildEstate.Application.Interfaces;
using BuildEstate.Domain.Entities.UserManagement;
using BuildEstate.Infrastructure.Identity;
using BuildEstate.Infrastructure.Persistence;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace BuildEstate.Infrastructure.Services;

/// <summary>
/// Implements role management operations using ASP.NET Identity's RoleManager
/// and the DbContext for permission assignment.
/// </summary>
public sealed class RoleManagementService : IRoleManagementService
{
    private readonly RoleManager<ApplicationRole> _roleManager;
    private readonly BuildEstateDbContext _dbContext;

    public RoleManagementService(
        RoleManager<ApplicationRole> roleManager,
        BuildEstateDbContext dbContext)
    {
        _roleManager = roleManager;
        _dbContext = dbContext;
    }

    public async Task<bool> RoleNameExistsAsync(string roleName, CancellationToken ct = default)
    {
        return await _roleManager.RoleExistsAsync(roleName);
    }

    public async Task<bool> RoleNameExistsExcludingAsync(string roleName, string excludeRoleId, CancellationToken ct = default)
    {
        var existing = await _roleManager.Roles
            .FirstOrDefaultAsync(r => r.Name == roleName && r.Id != excludeRoleId, ct);
        return existing is not null;
    }

    public async Task<CreateRoleResult> CreateRoleAsync(string name, string description, CancellationToken ct = default)
    {
        var role = new ApplicationRole
        {
            Name = name,
            Description = description,
            IsBuiltIn = false,
            CreatedAt = DateTime.UtcNow
        };

        var result = await _roleManager.CreateAsync(role);
        if (!result.Succeeded)
        {
            return CreateRoleResult.Failure(result.Errors.Select(e => e.Description).ToArray());
        }

        return CreateRoleResult.Success(role.Id);
    }

    public async Task<IdentityOperationResult> AssignPermissionsAsync(
        string roleId, IReadOnlyList<Guid> permissionIds, CancellationToken ct = default)
    {
        foreach (var permissionId in permissionIds)
        {
            var exists = await _dbContext.RolePermissions
                .AnyAsync(rp => rp.RoleId == roleId && rp.PermissionId == permissionId, ct);

            if (!exists)
            {
                _dbContext.RolePermissions.Add(new RolePermission
                {
                    RoleId = roleId,
                    PermissionId = permissionId
                });
            }
        }

        await _dbContext.SaveChangesAsync(ct);
        return IdentityOperationResult.Success();
    }

    public async Task<IReadOnlyList<Guid>> GetNonExistentPermissionIdsAsync(
        IReadOnlyList<Guid> permissionIds, CancellationToken ct = default)
    {
        var existingIds = await _dbContext.Permissions
            .Where(p => permissionIds.Contains(p.Id))
            .Select(p => p.Id)
            .ToListAsync(ct);

        return permissionIds.Where(id => !existingIds.Contains(id)).ToList();
    }

    public async Task<IdentityOperationResult> UpdateRoleAsync(
        string roleId, string name, string description, CancellationToken ct = default)
    {
        var role = await _roleManager.FindByIdAsync(roleId);
        if (role is null)
        {
            return IdentityOperationResult.Failure(new[] { "Role not found." });
        }

        role.Name = name;
        role.Description = description;

        var result = await _roleManager.UpdateAsync(role);
        if (!result.Succeeded)
        {
            return IdentityOperationResult.Failure(result.Errors.Select(e => e.Description).ToArray());
        }

        return IdentityOperationResult.Success();
    }

    public async Task<IdentityOperationResult> DeleteRoleAsync(string roleId, CancellationToken ct = default)
    {
        var role = await _roleManager.FindByIdAsync(roleId);
        if (role is null)
        {
            return IdentityOperationResult.Failure(new[] { "Role not found." });
        }

        // Remove role-permission assignments first
        var rolePermissions = await _dbContext.RolePermissions
            .Where(rp => rp.RoleId == roleId)
            .ToListAsync(ct);

        _dbContext.RolePermissions.RemoveRange(rolePermissions);
        await _dbContext.SaveChangesAsync(ct);

        var result = await _roleManager.DeleteAsync(role);
        if (!result.Succeeded)
        {
            return IdentityOperationResult.Failure(result.Errors.Select(e => e.Description).ToArray());
        }

        return IdentityOperationResult.Success();
    }

    public async Task<bool> IsBuiltInRoleAsync(string roleId, CancellationToken ct = default)
    {
        var role = await _roleManager.Roles
            .FirstOrDefaultAsync(r => r.Id == roleId, ct);
        return role?.IsBuiltIn ?? false;
    }

    public async Task<int> GetUserCountForRoleAsync(string roleId, CancellationToken ct = default)
    {
        return await _dbContext.UserRoles
            .CountAsync(ur => ur.RoleId == roleId, ct);
    }

    public async Task<string?> GetRoleNameAsync(string roleId, CancellationToken ct = default)
    {
        var role = await _roleManager.FindByIdAsync(roleId);
        return role?.Name;
    }

    public async Task<TogglePermissionResult> TogglePermissionAsync(
        string roleId, Guid permissionId, CancellationToken ct = default)
    {
        // Check if permission exists
        var permissionExists = await _dbContext.Permissions.AnyAsync(p => p.Id == permissionId, ct);
        if (!permissionExists)
        {
            return TogglePermissionResult.Failure("Permission not found.");
        }

        // Check if role exists
        var roleExists = await _roleManager.Roles.AnyAsync(r => r.Id == roleId, ct);
        if (!roleExists)
        {
            return TogglePermissionResult.Failure("Role not found.");
        }

        var existing = await _dbContext.RolePermissions
            .FirstOrDefaultAsync(rp => rp.RoleId == roleId && rp.PermissionId == permissionId, ct);

        if (existing is not null)
        {
            // Permission is currently granted — revoke it
            _dbContext.RolePermissions.Remove(existing);
            await _dbContext.SaveChangesAsync(ct);
            return TogglePermissionResult.Revoked();
        }
        else
        {
            // Permission is not granted — grant it
            _dbContext.RolePermissions.Add(new RolePermission
            {
                RoleId = roleId,
                PermissionId = permissionId
            });
            await _dbContext.SaveChangesAsync(ct);
            return TogglePermissionResult.Granted();
        }
    }
}
