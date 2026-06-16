using System.Security.Claims;
using BuildEstate.Application.Features.UserManagement.Users.Commands.BulkImport;
using BuildEstate.Application.Interfaces;
using BuildEstate.Infrastructure.Identity;
using BuildEstate.Infrastructure.Services;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace BuildEstate.API.Controllers.Admin;

/// <summary>
/// Administrative user management endpoints for SuperAdmin role.
/// Provides CRUD operations, role assignment, activation/deactivation,
/// and password reset capabilities.
/// </summary>
[Route("api/v1/users")]
[Authorize(Roles = "SuperAdmin")]
public class UsersController : BaseApiController
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly RoleManager<ApplicationRole> _roleManager;
    private readonly ITokenService _tokenService;
    private readonly ILogger<UsersController> _logger;

    public UsersController(
        UserManager<ApplicationUser> userManager,
        RoleManager<ApplicationRole> roleManager,
        ITokenService tokenService,
        ILogger<UsersController> logger)
    {
        _userManager = userManager;
        _roleManager = roleManager;
        _tokenService = tokenService;
        _logger = logger;
    }

    /// <summary>
    /// Returns a paginated list of users with their assigned roles.
    /// Supports filtering by search term, role, and active status.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null,
        [FromQuery] string? role = null,
        [FromQuery] bool? isActive = null)
    {
        var query = _userManager.Users.AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var searchLower = search.ToLower();
            query = query.Where(u =>
                u.Email!.ToLower().Contains(searchLower) ||
                u.FirstName.ToLower().Contains(searchLower) ||
                u.LastName.ToLower().Contains(searchLower));
        }

        if (isActive.HasValue)
        {
            query = query.Where(u => u.IsActive == isActive.Value);
        }

        // If filtering by role, get user IDs in that role first
        if (!string.IsNullOrWhiteSpace(role))
        {
            var usersInRole = await _userManager.GetUsersInRoleAsync(role);
            var userIds = usersInRole.Select(u => u.Id).ToHashSet();
            query = query.Where(u => userIds.Contains(u.Id));
        }

        var totalCount = query.Count();
        var users = query
            .OrderBy(u => u.LastName)
            .ThenBy(u => u.FirstName)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToList();

        var userDtos = new List<object>();
        foreach (var user in users)
        {
            var roles = await _userManager.GetRolesAsync(user);
            userDtos.Add(new
            {
                id = user.Id,
                email = user.Email,
                firstName = user.FirstName,
                lastName = user.LastName,
                isActive = user.IsActive,
                roles = roles,
                emailConfirmed = user.EmailConfirmed
            });
        }

        return Ok(new
        {
            items = userDtos,
            pageNumber,
            pageSize,
            totalCount,
            totalPages = pageSize > 0 ? (int)Math.Ceiling((double)totalCount / pageSize) : 0
        });
    }

    /// <summary>
    /// Returns detailed information about a specific user including roles and lockout status.
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(string id)
    {
        var user = await _userManager.FindByIdAsync(id);
        if (user is null)
            return NotFound(new { message = "User not found." });

        var roles = await _userManager.GetRolesAsync(user);

        return Ok(new
        {
            id = user.Id,
            email = user.Email,
            firstName = user.FirstName,
            lastName = user.LastName,
            isActive = user.IsActive,
            roles = roles,
            emailConfirmed = user.EmailConfirmed,
            lockoutEnd = user.LockoutEnd
        });
    }

    /// <summary>
    /// Creates a new user with the specified roles.
    /// </summary>
    [HttpPost]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create([FromBody] CreateUserRequest request)
    {
        var existingUser = await _userManager.FindByEmailAsync(request.Email);
        if (existingUser is not null)
            return BadRequest(new { errors = new[] { "A user with this email already exists." } });

        var user = new ApplicationUser
        {
            UserName = request.Email,
            Email = request.Email,
            FirstName = request.FirstName,
            LastName = request.LastName,
            IsActive = true,
            EmailConfirmed = true
        };

        var createResult = await _userManager.CreateAsync(user, request.Password);
        if (!createResult.Succeeded)
        {
            var errors = createResult.Errors.Select(e => e.Description).ToList();
            return BadRequest(new { errors });
        }

        if (request.Roles is { Count: > 0 })
        {
            var roleResult = await _userManager.AddToRolesAsync(user, request.Roles);
            if (!roleResult.Succeeded)
            {
                var errors = roleResult.Errors.Select(e => e.Description).ToList();
                _logger.LogWarning("Failed to assign roles to user {UserId}: {Errors}", user.Id, string.Join(", ", errors));
            }
        }

        var assignedRoles = await _userManager.GetRolesAsync(user);

        _logger.LogInformation("User {UserId} created by {AdminId} with roles [{Roles}]",
            user.Id,
            User.FindFirstValue(ClaimTypes.NameIdentifier),
            string.Join(", ", assignedRoles));

        return CreatedAtAction(nameof(GetById), new { id = user.Id }, new
        {
            id = user.Id,
            email = user.Email,
            firstName = user.FirstName,
            lastName = user.LastName,
            isActive = user.IsActive,
            roles = assignedRoles
        });
    }

    /// <summary>
    /// Updates an existing user's profile information.
    /// </summary>
    [HttpPut("{id}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(string id, [FromBody] UpdateUserRequest request)
    {
        var user = await _userManager.FindByIdAsync(id);
        if (user is null)
            return NotFound(new { message = "User not found." });

        user.FirstName = request.FirstName;
        user.LastName = request.LastName;
        user.IsActive = request.IsActive;

        // Update email if changed
        if (!string.Equals(user.Email, request.Email, StringComparison.OrdinalIgnoreCase))
        {
            var existingUser = await _userManager.FindByEmailAsync(request.Email);
            if (existingUser is not null && existingUser.Id != id)
                return BadRequest(new { errors = new[] { "A user with this email already exists." } });

            user.Email = request.Email;
            user.UserName = request.Email;
        }

        var result = await _userManager.UpdateAsync(user);
        if (!result.Succeeded)
        {
            var errors = result.Errors.Select(e => e.Description).ToList();
            return BadRequest(new { errors });
        }

        var roles = await _userManager.GetRolesAsync(user);

        _logger.LogInformation("User {UserId} updated by {AdminId}", id,
            User.FindFirstValue(ClaimTypes.NameIdentifier));

        return Ok(new
        {
            id = user.Id,
            email = user.Email,
            firstName = user.FirstName,
            lastName = user.LastName,
            isActive = user.IsActive,
            roles = roles
        });
    }

    /// <summary>
    /// Replaces all role assignments for a user with the specified roles.
    /// </summary>
    [HttpPut("{id}/roles")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> AssignRoles(string id, [FromBody] AssignRolesRequest request)
    {
        var user = await _userManager.FindByIdAsync(id);
        if (user is null)
            return NotFound(new { message = "User not found." });

        var currentRoles = await _userManager.GetRolesAsync(user);

        // Remove all current roles
        if (currentRoles.Count > 0)
        {
            var removeResult = await _userManager.RemoveFromRolesAsync(user, currentRoles);
            if (!removeResult.Succeeded)
                return BadRequest(new { errors = removeResult.Errors.Select(e => e.Description).ToList() });
        }

        // Add new roles
        if (request.Roles is { Count: > 0 })
        {
            var addResult = await _userManager.AddToRolesAsync(user, request.Roles);
            if (!addResult.Succeeded)
                return BadRequest(new { errors = addResult.Errors.Select(e => e.Description).ToList() });
        }

        var updatedRoles = await _userManager.GetRolesAsync(user);

        _logger.LogInformation(
            "User {UserId} roles changed from [{OldRoles}] to [{NewRoles}] by {AdminId}",
            id,
            string.Join(", ", currentRoles),
            string.Join(", ", updatedRoles),
            User.FindFirstValue(ClaimTypes.NameIdentifier));

        // Revoke tokens so user gets new claims on next login
        await _tokenService.RevokeAllUserTokensAsync(id);

        return Ok(new { id, roles = updatedRoles });
    }

    /// <summary>
    /// Deactivates a user account and revokes all their active tokens.
    /// </summary>
    [HttpPatch("{id}/deactivate")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Deactivate(string id)
    {
        var user = await _userManager.FindByIdAsync(id);
        if (user is null)
            return NotFound(new { message = "User not found." });

        user.IsActive = false;
        await _userManager.UpdateAsync(user);
        await _tokenService.RevokeAllUserTokensAsync(id);

        _logger.LogInformation("User {UserId} deactivated by {AdminId}", id,
            User.FindFirstValue(ClaimTypes.NameIdentifier));

        return Ok(new { message = "User deactivated successfully." });
    }

    /// <summary>
    /// Reactivates a previously deactivated user account.
    /// </summary>
    [HttpPatch("{id}/activate")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Activate(string id)
    {
        var user = await _userManager.FindByIdAsync(id);
        if (user is null)
            return NotFound(new { message = "User not found." });

        user.IsActive = true;
        await _userManager.UpdateAsync(user);

        _logger.LogInformation("User {UserId} activated by {AdminId}", id,
            User.FindFirstValue(ClaimTypes.NameIdentifier));

        return Ok(new { message = "User activated successfully." });
    }

    /// <summary>
    /// Bulk imports users from a CSV file.
    /// CSV format: FirstName,LastName,Email,Password,Roles
    /// Valid rows are imported; invalid rows are reported with error details.
    /// </summary>
    [HttpPost("bulk-import")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> BulkImport(IFormFile file, [FromServices] ISender mediator)
    {
        if (file is null || file.Length == 0)
            return BadRequest(new { errors = new[] { "No file provided or file is empty." } });

        if (!file.FileName.EndsWith(".csv", StringComparison.OrdinalIgnoreCase))
            return BadRequest(new { errors = new[] { "Only CSV files are accepted." } });

        using var reader = new StreamReader(file.OpenReadStream());
        var csvContent = await reader.ReadToEndAsync();

        var adminUserId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty;
        var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        var correlationId = HttpContext.Items["CorrelationId"]?.ToString() ?? Guid.NewGuid().ToString();

        var command = new BulkImportUsersCommand
        {
            CsvContent = csvContent,
            AdminUserId = adminUserId,
            IpAddress = ipAddress,
            CorrelationId = correlationId
        };

        var result = await mediator.Send(command);

        if (result.Errors.Count > 0 && result.SuccessCount == 0)
            return BadRequest(new { result.Errors, result.RowErrors });

        return Ok(new
        {
            result.SuccessCount,
            result.FailedCount,
            result.RowErrors,
            result.Errors
        });
    }

    /// <summary>
    /// Resets a user's password to a new value specified by an administrator.
    /// Revokes all existing tokens for the user.
    /// </summary>
    [HttpPost("{id}/reset-password")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ResetPassword(string id, [FromBody] AdminResetPasswordRequest request)
    {
        var user = await _userManager.FindByIdAsync(id);
        if (user is null)
            return NotFound(new { message = "User not found." });

        var token = await _userManager.GeneratePasswordResetTokenAsync(user);
        var result = await _userManager.ResetPasswordAsync(user, token, request.NewPassword);

        if (!result.Succeeded)
        {
            var errors = result.Errors.Select(e => e.Description).ToList();
            return BadRequest(new { errors });
        }

        await _tokenService.RevokeAllUserTokensAsync(id);

        _logger.LogInformation("Password reset for user {UserId} by admin {AdminId}", id,
            User.FindFirstValue(ClaimTypes.NameIdentifier));

        return Ok(new { message = "Password reset successfully." });
    }
}

// ──────────────────────────────────────────────────────────────────
// Request DTOs
// ──────────────────────────────────────────────────────────────────

public sealed record CreateUserRequest
{
    public string Email { get; init; } = string.Empty;
    public string FirstName { get; init; } = string.Empty;
    public string LastName { get; init; } = string.Empty;
    public string Password { get; init; } = string.Empty;
    public List<string> Roles { get; init; } = new();
}

public sealed record UpdateUserRequest
{
    public string FirstName { get; init; } = string.Empty;
    public string LastName { get; init; } = string.Empty;
    public string Email { get; init; } = string.Empty;
    public bool IsActive { get; init; } = true;
}

public sealed record AssignRolesRequest
{
    public List<string> Roles { get; init; } = new();
}

public sealed record AdminResetPasswordRequest
{
    public string NewPassword { get; init; } = string.Empty;
}
