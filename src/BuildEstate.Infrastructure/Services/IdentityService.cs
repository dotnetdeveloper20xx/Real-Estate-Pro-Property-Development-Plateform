using BuildEstate.Application.Interfaces;
using BuildEstate.Infrastructure.Identity;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;

namespace BuildEstate.Infrastructure.Services;

/// <summary>
/// Implements IIdentityService by wrapping ASP.NET Identity's UserManager and SignInManager.
/// Provides user lookup, password verification, role retrieval, and LastLoginAt updates
/// without exposing ApplicationUser to the Application layer.
/// </summary>
public sealed class IdentityService : IIdentityService
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly ILogger<IdentityService> _logger;

    public IdentityService(
        UserManager<ApplicationUser> userManager,
        ILogger<IdentityService> logger)
    {
        _userManager = userManager;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task<UserIdentityResult?> FindByEmailAsync(string email, CancellationToken ct = default)
    {
        var user = await _userManager.FindByEmailAsync(email);
        if (user is null)
            return null;

        return new UserIdentityResult
        {
            UserId = user.Id,
            Email = user.Email ?? string.Empty,
            FirstName = user.FirstName,
            LastName = user.LastName,
            IsActive = user.IsActive
        };
    }

    /// <inheritdoc />
    public async Task<bool> CheckPasswordAsync(string userId, string password, CancellationToken ct = default)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user is null)
            return false;

        return await _userManager.CheckPasswordAsync(user, password);
    }

    /// <inheritdoc />
    public async Task<IList<string>> GetRolesAsync(string userId, CancellationToken ct = default)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user is null)
            return Array.Empty<string>();

        return await _userManager.GetRolesAsync(user);
    }

    /// <inheritdoc />
    public async Task UpdateLastLoginAsync(string userId, CancellationToken ct = default)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user is null)
        {
            _logger.LogWarning("UpdateLastLoginAsync — user {UserId} not found", userId);
            return;
        }

        user.LastLoginAt = DateTime.UtcNow;
        await _userManager.UpdateAsync(user);
    }

    /// <inheritdoc />
    public async Task<UserIdentityResult?> FindByIdAsync(string userId, CancellationToken ct = default)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user is null)
            return null;

        return new UserIdentityResult
        {
            UserId = user.Id,
            Email = user.Email ?? string.Empty,
            FirstName = user.FirstName,
            LastName = user.LastName,
            IsActive = user.IsActive
        };
    }

    /// <inheritdoc />
    public async Task<bool> UpdateUserAsync(string userId, string firstName, string lastName, string email, string updatedBy, CancellationToken ct = default)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user is null)
            return false;

        user.FirstName = firstName;
        user.LastName = lastName;
        user.Email = email;
        user.NormalizedEmail = email.ToUpperInvariant();
        user.UserName = email;
        user.NormalizedUserName = email.ToUpperInvariant();
        user.UpdatedAt = DateTime.UtcNow;
        user.UpdatedBy = updatedBy;

        var result = await _userManager.UpdateAsync(user);
        if (!result.Succeeded)
        {
            _logger.LogWarning("UpdateUserAsync failed for user {UserId}: {Errors}",
                userId, string.Join(", ", result.Errors.Select(e => e.Description)));
        }

        return result.Succeeded;
    }

    /// <inheritdoc />
    public async Task<bool> UpdateUserRolesAsync(string userId, IList<string> newRoles, CancellationToken ct = default)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user is null)
            return false;

        var currentRoles = await _userManager.GetRolesAsync(user);

        // Remove roles no longer assigned
        var rolesToRemove = currentRoles.Except(newRoles, StringComparer.OrdinalIgnoreCase).ToList();
        if (rolesToRemove.Count > 0)
        {
            var removeResult = await _userManager.RemoveFromRolesAsync(user, rolesToRemove);
            if (!removeResult.Succeeded)
            {
                _logger.LogWarning("Failed to remove roles [{Roles}] from user {UserId}: {Errors}",
                    string.Join(", ", rolesToRemove), userId,
                    string.Join(", ", removeResult.Errors.Select(e => e.Description)));
                return false;
            }
        }

        // Add newly assigned roles
        var rolesToAdd = newRoles.Except(currentRoles, StringComparer.OrdinalIgnoreCase).ToList();
        if (rolesToAdd.Count > 0)
        {
            var addResult = await _userManager.AddToRolesAsync(user, rolesToAdd);
            if (!addResult.Succeeded)
            {
                _logger.LogWarning("Failed to add roles [{Roles}] to user {UserId}: {Errors}",
                    string.Join(", ", rolesToAdd), userId,
                    string.Join(", ", addResult.Errors.Select(e => e.Description)));
                return false;
            }
        }

        return true;
    }

    /// <inheritdoc />
    public async Task<bool> IsEmailTakenAsync(string email, string excludeUserId, CancellationToken ct = default)
    {
        var existingUser = await _userManager.FindByEmailAsync(email);
        if (existingUser is null)
            return false;

        // Email is taken only if it belongs to a different user
        return !string.Equals(existingUser.Id, excludeUserId, StringComparison.OrdinalIgnoreCase);
    }
}
