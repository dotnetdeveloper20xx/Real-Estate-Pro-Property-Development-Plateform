using BuildEstate.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BuildEstate.API.Controllers.Admin;

/// <summary>
/// Administrative audit log endpoints for SuperAdmin role.
/// Provides paginated, filterable access to the immutable audit trail.
/// </summary>
[Route("api/v1/audit-logs")]
[Authorize(Roles = "SuperAdmin")]
public class AuditLogsController : BaseApiController
{
    private readonly IAuditLogService _auditLogService;
    private readonly ILogger<AuditLogsController> _logger;

    public AuditLogsController(
        IAuditLogService auditLogService,
        ILogger<AuditLogsController> logger)
    {
        _auditLogService = auditLogService;
        _logger = logger;
    }

    /// <summary>
    /// Returns paginated audit log entries with optional filtering by action type,
    /// user, and date range (max 12-month span).
    /// </summary>
    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? actionType = null,
        [FromQuery] string? userId = null,
        [FromQuery] DateTime? dateRangeStart = null,
        [FromQuery] DateTime? dateRangeEnd = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 25,
        CancellationToken cancellationToken = default)
    {
        var queryParams = new AuditLogQueryParams
        {
            ActionType = actionType,
            UserId = userId,
            DateRangeStart = dateRangeStart,
            DateRangeEnd = dateRangeEnd,
            Page = page,
            PageSize = pageSize
        };

        try
        {
            var result = await _auditLogService.QueryAsync(queryParams, cancellationToken);

            return Ok(new
            {
                items = result.Items.Select(e => new
                {
                    id = e.Id,
                    timestamp = e.Timestamp,
                    action = e.Action,
                    performedByUserId = e.PerformedByUserId,
                    performedByUserName = e.PerformedByUserName,
                    targetEntityType = e.TargetEntityType,
                    targetEntityId = e.TargetEntityId,
                    targetUserName = e.TargetUserName,
                    ipAddress = e.IpAddress,
                    details = e.Details
                }),
                totalCount = result.TotalCount,
                pageNumber = result.PageNumber,
                pageSize = result.PageSize,
                totalPages = result.TotalPages
            });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
