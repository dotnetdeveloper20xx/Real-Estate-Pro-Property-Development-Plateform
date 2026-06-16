using BuildEstate.Application.Features.UserManagement.Authentication.DTOs;
using BuildEstate.Application.Interfaces;
using BuildEstate.Infrastructure.Identity;
using BuildEstate.Infrastructure.Persistence;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace BuildEstate.Infrastructure.Services;

/// <summary>
/// Implements IUserIdentityService by wrapping ASP.NET Identity's UserManager
/// and the application DbContext for permission lookups.
/// Provides password management, user lookup, and current user profile retrieval.
/// </summary>
public sealed class UserIdentityService : IUserIdentityService
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly BuildEstateDbContext _dbContext;
    private readonly ILogger<UserIdentityService> _logger;

    public UserIdentityService(
        UserManager<ApplicationUser> userManager,
        BuildEstateDbContext dbContext,
        ILogger<UserIdentityService> logger)
    {
        _userManager = userManager;
        _dbContext = dbContext;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task<CurrentUserDto?> GetCurrentUserAsync(string userId, CancellationToken ct = default)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user is null)
        {
            _logger.LogWarning("GetCurrentUserAsync — user {UserId} not found", userId);
            return null;
        }

        var roles = await _userManager.GetRolesAsync(user);

        // Get all permissions granted through the user's roles
        var permissions = Array.Empty<string>();
        if (roles.Count > 0)
        {
            var roleIds = await _dbContext.Roles
                .Where(r => roles.Contains(r.Name!))
                .Select(r => r.Id)
                .ToListAsync(ct);

            permissions = await _dbContext.RolePermissions
                .Where(rp => roleIds.Contains(rp.RoleId))
                .Select(rp => rp.Permission.Name)
                .Distinct()
                .OrderBy(p => p)
                .ToArrayAsync(ct);
        }

        return new CurrentUserDto
        {
            Id = user.Id,
            FirstName = user.FirstName,
            LastName = user.LastName,
            Email = user.Email ?? string.Empty,
            Roles = roles.OrderBy(r => r).ToArray(),
            Permissions = permissions
        };
    }

    /// <inheritdoc />
    public async Task<bool> VerifyPasswordAsync(string userId, string password, CancellationToken ct = default)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user is null)
            return false;

        return await _userManager.CheckPasswordAsync(user, password);
    }

    /// <inheritdoc />
    public async Task<PasswordChangeResult> ChangePasswordAsync(
        string userId, string currentPassword, string newPassword, CancellationToken ct = default)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user is null)
            return PasswordChangeResult.Failure(["User not found."]);

        var result = await _userManager.ChangePasswordAsync(user, currentPassword, newPassword);
        if (result.Succeeded)
            return PasswordChangeResult.Success();

        var errors = result.Errors.Select(e => e.Description).ToList();
        return PasswordChangeResult.Failure(errors);
    }

    /// <inheritdoc />
    public async Task<string?> GetPasswordHashAsync(string userId, CancellationToken ct = default)
    {
        var user = await _userManager.FindByIdAsync(userId);
        return user?.PasswordHash;
    }

    /// <inheritdoc />
    public async Task<string?> GetUserDisplayNameAsync(string userId, CancellationToken ct = default)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user is null)
            return null;

        return $"{user.FirstName} {user.LastName}";
    }

    /// <inheritdoc />
    public async Task<bool> UserExistsAndIsActiveAsync(string userId, CancellationToken ct = default)
    {
        var user = await _userManager.FindByIdAsync(userId);
        return user is not null && user.IsActive;
    }

    /// <inheritdoc />
    public async Task<bool> EmailExistsAsync(string email, CancellationToken ct = default)
    {
        var user = await _userManager.FindByEmailAsync(email);
        return user is not null;
    }

    /// <inheritdoc />
    public async Task<bool> RoleExistsAsync(string roleName, CancellationToken ct = default)
    {
        return await _dbContext.Roles
            .AnyAsync(r => r.Name == roleName, ct);
    }

    /// <inheritdoc />
    public async Task<CreateUserIdentityResult> CreateUserAsync(
        string firstName, string lastName, string email, string password,
        string createdBy, CancellationToken ct = default)
    {
        var user = new ApplicationUser
        {
            UserName = email,
            Email = email,
            FirstName = firstName,
            LastName = lastName,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = createdBy,
            EmailConfirmed = true
        };

        var result = await _userManager.CreateAsync(user, password);
        if (!result.Succeeded)
        {
            var errors = result.Errors.Select(e => e.Description).ToList();
            _logger.LogWarning("User creation failed for email {Email}: {Errors}", email, string.Join(", ", errors));
            return CreateUserIdentityResult.Failure(errors);
        }

        _logger.LogInformation("User {UserId} created successfully with email {Email}", user.Id, email);
        return CreateUserIdentityResult.Success(user.Id, user.PasswordHash ?? string.Empty);
    }

    /// <inheritdoc />
    public async Task<IdentityOperationResult> AssignRolesAsync(
        string userId, IEnumerable<string> roles, CancellationToken ct = default)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user is null)
            return IdentityOperationResult.Failure(["User not found."]);

        var roleList = roles.ToList();
        if (roleList.Count == 0)
            return IdentityOperationResult.Success();

        var result = await _userManager.AddToRolesAsync(user, roleList);
        if (!result.Succeeded)
        {
            var errors = result.Errors.Select(e => e.Description).ToList();
            _logger.LogWarning("Role assignment failed for user {UserId}: {Errors}", userId, string.Join(", ", errors));
            return IdentityOperationResult.Failure(errors);
        }

        _logger.LogInformation("Roles {Roles} assigned to user {UserId}", string.Join(", ", roleList), userId);
        return IdentityOperationResult.Success();
    }

    /// <inheritdoc />
    public async Task<PasswordChangeResult> ResetPasswordAsync(string userId, string newPassword, CancellationToken ct = default)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user is null)
            return PasswordChangeResult.Failure(["User not found."]);

        var token = await _userManager.GeneratePasswordResetTokenAsync(user);
        var result = await _userManager.ResetPasswordAsync(user, token, newPassword);

        if (result.Succeeded)
            return PasswordChangeResult.Success();

        var errors = result.Errors.Select(e => e.Description).ToList();
        _logger.LogWarning("Password reset failed for user {UserId}: {Errors}", userId, string.Join(", ", errors));
        return PasswordChangeResult.Failure(errors);
    }

    /// <inheritdoc />
    public async Task<UserStatusChangeResult> DeactivateUserAsync(string userId, string adminUserId, CancellationToken ct = default)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user is null)
            return UserStatusChangeResult.Failure(["User not found."]);

        var previousIsActive = user.IsActive;
        var displayName = $"{user.FirstName} {user.LastName}";

        user.IsActive = false;
        user.UpdatedAt = DateTime.UtcNow;
        user.UpdatedBy = adminUserId;

        var result = await _userManager.UpdateAsync(user);
        if (!result.Succeeded)
        {
            var errors = result.Errors.Select(e => e.Description).ToList();
            _logger.LogWarning("Deactivation failed for user {UserId}: {Errors}", userId, string.Join(", ", errors));
            return UserStatusChangeResult.Failure(errors);
        }

        _logger.LogInformation("User {UserId} deactivated by admin {AdminUserId}", userId, adminUserId);
        return UserStatusChangeResult.Success(displayName, previousIsActive);
    }

    /// <inheritdoc />
    public async Task<UserStatusChangeResult> ReactivateUserAsync(string userId, string adminUserId, CancellationToken ct = default)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user is null)
            return UserStatusChangeResult.Failure(["User not found."]);

        var previousIsActive = user.IsActive;
        var displayName = $"{user.FirstName} {user.LastName}";

        user.IsActive = true;
        user.UpdatedAt = DateTime.UtcNow;
        user.UpdatedBy = adminUserId;

        var result = await _userManager.UpdateAsync(user);
        if (!result.Succeeded)
        {
            var errors = result.Errors.Select(e => e.Description).ToList();
            _logger.LogWarning("Reactivation failed for user {UserId}: {Errors}", userId, string.Join(", ", errors));
            return UserStatusChangeResult.Failure(errors);
        }

        _logger.LogInformation("User {UserId} reactivated by admin {AdminUserId}", userId, adminUserId);
        return UserStatusChangeResult.Success(displayName, previousIsActive);
    }
}
