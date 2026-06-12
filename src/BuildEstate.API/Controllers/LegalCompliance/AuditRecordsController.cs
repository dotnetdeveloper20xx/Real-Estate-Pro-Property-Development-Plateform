using BuildEstate.Application.Features.LegalCompliance.AuditRecords.Commands.CreateAuditRecord;
using BuildEstate.Application.Features.LegalCompliance.AuditRecords.Commands.TransitionAuditRecordStatus;
using BuildEstate.Application.Features.LegalCompliance.AuditRecords.Queries.GetAuditRecordById;
using BuildEstate.Application.Features.LegalCompliance.AuditRecords.Queries.GetAuditRecords;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BuildEstate.API.Controllers.LegalCompliance;

/// <summary>
/// Manages audit record lifecycle operations including creation, listing,
/// detail retrieval, and status transitions. All endpoints require authentication.
/// Create and transition operations are restricted to Legal_Compliance_Officer.
/// Read operations are available to all legal roles.
/// </summary>
[Route("api/v1/audit-records")]
public class AuditRecordsController : BaseApiController
{
    /// <summary>
    /// Creates a new audit record with initial status Planned.
    /// Captures audit type, scope, auditor name, audit date, and optional links
    /// to a legal case or compliance requirement.
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "Legal_Compliance_Officer")]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create(
        [FromBody] CreateAuditRecordCommand command,
        CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(command, cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    /// <summary>
    /// Returns a paginated, filtered, and sorted list of audit records.
    /// Supports filtering by AuditType, Status, RiskRating, date range,
    /// and free-text search across Scope and AuditorName fields.
    /// </summary>
    [HttpGet]
    [Authorize(Roles = "Legal_Compliance_Officer,Finance_Director,Acquisition_Manager,Admin_Support")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(
        [FromQuery] GetAuditRecordsQuery query,
        CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(query, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Returns the full audit record detail including permitted status transitions
    /// from the state machine, days until action due date, and linked entity names.
    /// </summary>
    [HttpGet("{id:guid}")]
    [Authorize(Roles = "Legal_Compliance_Officer,Finance_Director,Acquisition_Manager,Admin_Support")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(
            new GetAuditRecordByIdQuery { Id = id },
            cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Transitions an audit record to a new status, enforcing state machine rules.
    /// Valid transitions: Planned→InProgress, InProgress→FindingsRecorded,
    /// FindingsRecorded→ActionsRequired, FindingsRecorded→Closed,
    /// ActionsRequired→RemediationInProgress, RemediationInProgress→Verified,
    /// Verified→Closed.
    /// Status-specific fields (Findings, RiskRating, Recommendations, ActionDueDate)
    /// are required depending on the target status.
    /// </summary>
    [HttpPost("{id:guid}/transition")]
    [Authorize(Roles = "Legal_Compliance_Officer")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> TransitionStatus(
        Guid id,
        [FromBody] TransitionAuditRecordStatusCommand command,
        CancellationToken cancellationToken)
    {
        if (id != command.Id)
            return BadRequest("Route id does not match command id.");

        var result = await Mediator.Send(command, cancellationToken);
        return Ok(result);
    }
}
