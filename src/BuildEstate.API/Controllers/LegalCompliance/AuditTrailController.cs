using BuildEstate.Application.Features.LegalCompliance.AuditTrail.Queries.ExportAuditTrail;
using BuildEstate.Application.Features.LegalCompliance.AuditTrail.Queries.GetAuditHistory;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BuildEstate.API.Controllers.LegalCompliance;

/// <summary>
/// Provides audit trail query and export endpoints for the Legal &amp; Compliance module.
/// Supports paginated, filtered retrieval and CSV export of audit history
/// for compliance reviews. Restricted to Legal_Compliance_Officer role.
/// </summary>
[Route("api/v1/audit-trail")]
public class AuditTrailController : BaseApiController
{
    /// <summary>
    /// Returns a paginated, chronologically ordered list of audit trail entries.
    /// Supports filtering by action type (Create, Update, Delete), entity type,
    /// user ID, entity ID, and date range.
    /// </summary>
    [HttpGet]
    [Authorize(Policy = "legal.read")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetAuditHistory(
        [FromQuery] GetAuditHistoryQuery query,
        CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(query, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Exports audit trail data for a specified date range and optional entity type as a CSV file.
    /// The response is a downloadable file with content type text/csv suitable for compliance reviews.
    /// </summary>
    [HttpGet("export")]
    [Authorize(Policy = "legal.read")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> ExportAuditTrail(
        [FromQuery] ExportAuditTrailQuery query,
        CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(query, cancellationToken);
        return File(result.Content, result.ContentType, result.FileName);
    }
}
