using System.Security.Claims;
using BuildEstate.Application.Features.UserManagement.Roles.Commands.UpdateRolePermissions;
using BuildEstate.Application.Features.UserManagement.Roles.Queries.GetPermissionMatrix;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BuildEstate.API.Controllers.Admin;

/// <summary>
/// Administrative permission management endpoints for SuperAdmin role.
/// Provides the permission matrix view and permission toggle operations.
/// </summary>
[Route("api/v1/permissions")]
[Authorize(Roles = "SuperAdmin")]
public class PermissionsController : BaseApiController
{
    private readonly ILogger<PermissionsController> _logger;

    public PermissionsController(ILogger<PermissionsController> logger)
    {
        _logger = logger;
    }

    /// <summary>
    /// Returns the full permission matrix: all permissions grouped by domain × all roles,
    /// with granted/not-granted state per cell.
    /// </summary>
    [HttpGet("matrix")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMatrix(CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(new GetPermissionMatrixQuery(), cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Toggles a permission on or off for a specific role.
    /// Revokes all active sessions for users assigned to the affected role.
    /// </summary>
    [HttpPut("toggle")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> TogglePermission(
        [FromBody] TogglePermissionRequest request,
        CancellationToken cancellationToken)
    {
        var adminUserId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty;
        var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        var correlationId = HttpContext.Items["CorrelationId"]?.ToString() ?? Guid.NewGuid().ToString();

        var command = new UpdateRolePermissionsCommand
        {
            RoleId = request.RoleId,
            PermissionId = request.PermissionId,
            AdminUserId = adminUserId,
            IpAddress = ipAddress,
            CorrelationId = correlationId
        };

        var result = await Mediator.Send(command, cancellationToken);

        if (!result.Succeeded)
            return BadRequest(new { errors = result.Errors });

        _logger.LogInformation(
            "Permission {PermissionId} toggled for role {RoleId} (granted={IsGranted}) by {AdminId}",
            request.PermissionId, request.RoleId, result.IsGranted, adminUserId);

        return Ok(new
        {
            roleId = request.RoleId,
            permissionId = request.PermissionId,
            isGranted = result.IsGranted
        });
    }
}

// ──────────────────────────────────────────────────────────────────
// Request DTOs
// ──────────────────────────────────────────────────────────────────

public sealed record TogglePermissionRequest
{
    public string RoleId { get; init; } = string.Empty;
    public Guid PermissionId { get; init; }
}
