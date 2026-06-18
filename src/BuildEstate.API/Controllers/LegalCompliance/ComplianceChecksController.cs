using BuildEstate.Application.Features.LegalCompliance.ComplianceChecks.Commands.CreateComplianceCheck;
using BuildEstate.Application.Features.LegalCompliance.ComplianceChecks.Queries.GetComplianceChecks;
using BuildEstate.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BuildEstate.API.Controllers.LegalCompliance;

/// <summary>
/// Manages compliance check operations — recording new checks against compliance requirements
/// and retrieving check history. Compliance checks capture evidence of regulatory compliance
/// and form the audit trail for each ComplianceRequirement.
/// </summary>
[Route("api/v1/compliance-checks")]
public class ComplianceChecksController : BaseApiController
{
    /// <summary>
    /// Records a new compliance check against an active ComplianceRequirement.
    /// Captures outcome, findings, evidence reference, and optional remediation details.
    /// Restricted to Legal_Compliance_Officer and Admin_Support roles.
    /// </summary>
    [HttpPost]
    [Authorize(Policy = "legal.create")]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Create(
        [FromBody] CreateComplianceCheckCommand command,
        CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(command, cancellationToken);

        return CreatedAtAction(
            nameof(GetByRequirement),
            new { requirementId = result.ComplianceRequirementId },
            result);
    }

    /// <summary>
    /// Returns a paginated list of compliance checks for a given requirement.
    /// Ordered by CheckDate descending. Supports filtering by Outcome and date range.
    /// Accessible by all legal roles.
    /// </summary>
    [HttpGet]
    [Authorize(Policy = "legal.read")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetByRequirement(
        [FromQuery] Guid requirementId,
        [FromQuery] ComplianceCheckOutcome? outcome,
        [FromQuery] DateTime? dateFrom,
        [FromQuery] DateTime? dateTo,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        CancellationToken cancellationToken = default)
    {
        var query = new GetComplianceChecksQuery
        {
            ComplianceRequirementId = requirementId,
            Outcome = outcome,
            DateFrom = dateFrom,
            DateTo = dateTo,
            PageNumber = pageNumber,
            PageSize = pageSize
        };

        var result = await Mediator.Send(query, cancellationToken);

        return Ok(result);
    }
}
