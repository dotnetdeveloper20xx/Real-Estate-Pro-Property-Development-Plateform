using BuildEstate.Infrastructure.Persistence;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BuildEstate.API.Controllers.LandAcquisition;

/// <summary>
/// Provides audit trail data for a specific land opportunity.
/// Returns the most recent 50 audit log entries related to the opportunity.
/// </summary>
[Route("api/v1/opportunities/{opportunityId:guid}/audit")]
public class OpportunityAuditController : BaseApiController
{
    private readonly BuildEstateDbContext _context;

    public OpportunityAuditController(BuildEstateDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Gets the audit trail for a specific land opportunity, ordered by most recent first.
    /// </summary>
    /// <param name="opportunityId">The opportunity identifier to retrieve audit entries for.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>A list of audit log entries for the specified opportunity.</returns>
    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAuditByOpportunity(
        Guid opportunityId,
        CancellationToken cancellationToken)
    {
        var auditEntries = await _context.AuditLogs
            .AsNoTracking()
            .Where(a => a.EntityId == opportunityId.ToString())
            .OrderByDescending(a => a.Timestamp)
            .Take(50)
            .Select(a => new
            {
                a.Id,
                a.Action,
                a.UserName,
                a.Timestamp,
                a.EntityName,
                a.EntityId,
                ChangedFields = a.AffectedColumns ?? ""
            })
            .ToListAsync(cancellationToken);

        return Ok(new { success = true, data = auditEntries, errors = Array.Empty<string>() });
    }
}
