using BuildEstate.Application.Features.LegalCompliance.ComplianceRequirements.Commands.CreateComplianceRequirement;
using BuildEstate.Application.Features.LegalCompliance.ComplianceRequirements.Commands.RetireComplianceRequirement;
using BuildEstate.Application.Features.LegalCompliance.ComplianceRequirements.Commands.UpdateComplianceRequirement;
using BuildEstate.Application.Features.LegalCompliance.ComplianceRequirements.Queries.GetComplianceChecklist;
using BuildEstate.Application.Features.LegalCompliance.ComplianceRequirements.Queries.GetComplianceRequirements;
using BuildEstate.Application.Features.LegalCompliance.ComplianceRequirements.Queries.GetComplianceStatusSummary;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BuildEstate.API.Controllers.LegalCompliance;

/// <summary>
/// Manages compliance requirements including creation, listing, updates, retirement,
/// checklist view, and compliance status summary.
/// Write operations are restricted to the Legal Compliance Officer role.
/// Read operations are available to all legal roles.
/// </summary>
[Route("api/v1/compliance-requirements")]
public class ComplianceRequirementsController : BaseApiController
{
    /// <summary>
    /// Creates a new compliance requirement with the specified regulatory details.
    /// The requirement is initialised with Status = Active.
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "LegalComplianceOfficer")]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create(
        [FromBody] CreateComplianceRequirementCommand command,
        CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(command, cancellationToken);
        return CreatedAtAction(nameof(GetAll), null, result);
    }

    /// <summary>
    /// Returns a paginated, filtered, sorted, and searchable list of compliance requirements.
    /// Supports filtering by Category, Status, Frequency, ResponsibleRole, and free-text search.
    /// </summary>
    [HttpGet]
    [Authorize(Roles = "LegalComplianceOfficer,AcquisitionManager,FinanceDirector,AdminSupport")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(
        [FromQuery] GetComplianceRequirementsQuery query,
        CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(query, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Updates an existing compliance requirement's editable fields.
    /// Only non-null fields are applied (partial update pattern).
    /// </summary>
    [HttpPut("{id:guid}")]
    [Authorize(Roles = "LegalComplianceOfficer")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(
        Guid id,
        [FromBody] UpdateComplianceRequirementCommand command,
        CancellationToken cancellationToken)
    {
        if (id != command.Id)
            return BadRequest("Route id does not match command id.");

        var result = await Mediator.Send(command, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Retires or supersedes a compliance requirement.
    /// Sets the requirement status to Retired or Superseded with a reason.
    /// </summary>
    [HttpPost("{id:guid}/retire")]
    [Authorize(Roles = "LegalComplianceOfficer")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Retire(
        Guid id,
        [FromBody] RetireComplianceRequirementCommand command,
        CancellationToken cancellationToken)
    {
        if (id != command.Id)
            return BadRequest("Route id does not match command id.");

        var result = await Mediator.Send(command, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Returns a compliance checklist view showing all active requirements with their
    /// last check, next due date, and a color-coded status indicator (green, amber, red, grey).
    /// </summary>
    [HttpGet("checklist")]
    [Authorize(Roles = "LegalComplianceOfficer")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetChecklist(CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(new GetComplianceChecklistQuery(), cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Returns compliance status summary totals grouped by category.
    /// Includes total requirements, compliant count, non-compliant count, and overdue count per category.
    /// </summary>
    [HttpGet("summary")]
    [Authorize(Roles = "LegalComplianceOfficer")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetSummary(CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(new GetComplianceStatusSummaryQuery(), cancellationToken);
        return Ok(result);
    }
}
