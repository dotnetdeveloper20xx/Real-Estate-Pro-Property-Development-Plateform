using System.Security.Claims;
using BuildEstate.Application.Interfaces;
using BuildEstate.Infrastructure.Identity;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BuildEstate.API.Controllers.Admin;

/// <summary>
/// Administrative role management endpoints for SuperAdmin role.
/// Provides CRUD operations for application roles with user count tracking.
/// </summary>
[Route("api/v1/roles")]
[Authorize(Roles = "SuperAdmin")]
public class RolesController : BaseApiController
{
    private readonly RoleManager<ApplicationRole> _roleManager;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IRoleManagementService _roleManagementService;
    private readonly ILogger<RolesController> _logger;

    public RolesController(
        RoleManager<ApplicationRole> roleManager,
        UserManager<ApplicationUser> userManager,
        IRoleManagementService roleManagementService,
        ILogger<RolesController> logger)
    {
        _roleManager = roleManager;
        _userManager = userManager;
        _roleManagementService = roleManagementService;
        _logger = logger;
    }

    /// <summary>
    /// Returns all roles with the number of users assigned to each.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll()
    {
        var roles = await _roleManager.Roles.ToListAsync();

        var roleDtos = new List<object>();
        foreach (var role in roles)
        {
            var usersInRole = await _userManager.GetUsersInRoleAsync(role.Name!);
            roleDtos.Add(new
            {
                id = role.Id,
                name = role.Name,
                description = role.Description,
                userCount = usersInRole.Count
            });
        }

        return Ok(roleDtos);
    }

    /// <summary>
    /// Returns detailed information about a role including all assigned users.
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(string id)
    {
        var role = await _roleManager.FindByIdAsync(id);
        if (role is null)
            return NotFound(new { message = "Role not found." });

        var usersInRole = await _userManager.GetUsersInRoleAsync(role.Name!);

        return Ok(new
        {
            id = role.Id,
            name = role.Name,
            description = role.Description,
            users = usersInRole.Select(u => new
            {
                id = u.Id,
                email = u.Email,
                firstName = u.FirstName,
                lastName = u.LastName
            })
        });
    }

    /// <summary>
    /// Creates a new application role.
    /// </summary>
    [HttpPost]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Create([FromBody] CreateRoleRequest request)
    {
        var existingRole = await _roleManager.FindByNameAsync(request.Name);
        if (existingRole is not null)
            return Conflict(new { message = "A role with this name already exists." });

        var role = new ApplicationRole
        {
            Name = request.Name,
            Description = request.Description
        };

        var result = await _roleManager.CreateAsync(role);
        if (!result.Succeeded)
        {
            var errors = result.Errors.Select(e => e.Description).ToList();
            return BadRequest(new { errors });
        }

        // Assign permissions if provided
        if (request.PermissionIds is { Count: > 0 })
        {
            await _roleManagementService.AssignPermissionsAsync(role.Id, request.PermissionIds);
        }

        _logger.LogInformation("Role {RoleName} created by {AdminId} with {PermCount} permissions",
            role.Name,
            User.FindFirstValue(ClaimTypes.NameIdentifier),
            request.PermissionIds?.Count ?? 0);

        return CreatedAtAction(nameof(GetById), new { id = role.Id }, new
        {
            id = role.Id,
            name = role.Name,
            description = role.Description,
            userCount = 0
        });
    }

    /// <summary>
    /// Updates an existing role's description. Role name changes are not permitted.
    /// </summary>
    [HttpPut("{id}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(string id, [FromBody] UpdateRoleRequest request)
    {
        var role = await _roleManager.FindByIdAsync(id);
        if (role is null)
            return NotFound(new { message = "Role not found." });

        role.Description = request.Description;

        var result = await _roleManager.UpdateAsync(role);
        if (!result.Succeeded)
        {
            var errors = result.Errors.Select(e => e.Description).ToList();
            return BadRequest(new { errors });
        }

        _logger.LogInformation("Role {RoleName} updated by {AdminId}",
            role.Name,
            User.FindFirstValue(ClaimTypes.NameIdentifier));

        return Ok(new
        {
            id = role.Id,
            name = role.Name,
            description = role.Description
        });
    }

    /// <summary>
    /// Deletes a role only if no users are currently assigned to it.
    /// Returns 409 Conflict if users are still assigned.
    /// </summary>
    [HttpDelete("{id}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Delete(string id)
    {
        var role = await _roleManager.FindByIdAsync(id);
        if (role is null)
            return NotFound(new { message = "Role not found." });

        var usersInRole = await _userManager.GetUsersInRoleAsync(role.Name!);
        if (usersInRole.Count > 0)
        {
            return Conflict(new
            {
                message = $"Cannot delete role '{role.Name}' because {usersInRole.Count} user(s) are still assigned to it."
            });
        }

        var result = await _roleManager.DeleteAsync(role);
        if (!result.Succeeded)
        {
            var errors = result.Errors.Select(e => e.Description).ToList();
            return BadRequest(new { errors });
        }

        _logger.LogInformation("Role {RoleName} deleted by {AdminId}",
            role.Name,
            User.FindFirstValue(ClaimTypes.NameIdentifier));

        return NoContent();
    }
}

// ──────────────────────────────────────────────────────────────────
// Request DTOs
// ──────────────────────────────────────────────────────────────────

public sealed record CreateRoleRequest
{
    public string Name { get; init; } = string.Empty;
    public string Description { get; init; } = string.Empty;
    public List<Guid> PermissionIds { get; init; } = new();
}

public sealed record UpdateRoleRequest
{
    public string Description { get; init; } = string.Empty;
}
