using BuildEstate.Application.Features.LegalCompliance.Insurance.Commands.CreateInsuranceRecord;
using BuildEstate.Application.Features.LegalCompliance.Insurance.Commands.RenewInsuranceRecord;
using BuildEstate.Application.Features.LegalCompliance.Insurance.Commands.TransitionInsuranceStatus;
using BuildEstate.Application.Features.LegalCompliance.Insurance.Commands.UpdateInsuranceRecord;
using BuildEstate.Application.Features.LegalCompliance.Insurance.Queries.GetInsuranceById;
using BuildEstate.Application.Features.LegalCompliance.Insurance.Queries.GetInsuranceRecords;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BuildEstate.API.Controllers.LegalCompliance;

/// <summary>
/// Manages insurance record lifecycle operations including creation, updates,
/// status transitions, and policy renewal. All endpoints require authentication.
/// Create and update operations are restricted to Legal_Compliance_Officer and Admin_Support.
/// Transition and renew operations are restricted to Legal_Compliance_Officer only.
/// Read operations are available to all legal roles.
/// </summary>
[Route("api/v1/insurance-records")]
public class InsuranceRecordsController : BaseApiController
{
    /// <summary>
    /// Creates a new insurance record with status Active.
    /// Captures policy number, insurer, coverage type, amounts, and date range.
    /// Optionally links to a land opportunity or legal case.
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "Legal_Compliance_Officer,Admin_Support")]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create(
        [FromBody] CreateInsuranceRecordCommand command,
        CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(command, cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    /// <summary>
    /// Returns a paginated, filtered, and sorted list of insurance records.
    /// Supports filtering by CoverageType, Status, Insurer, expiry date range,
    /// and free-text search across PolicyNumber and Insurer fields.
    /// </summary>
    [HttpGet]
    [Authorize(Roles = "Legal_Compliance_Officer,Finance_Director,Acquisition_Manager,Admin_Support")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(
        [FromQuery] GetInsuranceRecordsQuery query,
        CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(query, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Returns the full insurance record detail including the linked legal case reference,
    /// calculated days until expiry, and permitted status transitions from the state machine.
    /// </summary>
    [HttpGet("{id:guid}")]
    [Authorize(Roles = "Legal_Compliance_Officer,Finance_Director,Acquisition_Manager,Admin_Support")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(
            new GetInsuranceByIdQuery { Id = id },
            cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Updates an existing insurance record's editable fields.
    /// Only non-null fields in the command body are applied (partial update).
    /// Uses optimistic concurrency via RowVersion.
    /// </summary>
    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Legal_Compliance_Officer,Admin_Support")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(
        Guid id,
        [FromBody] UpdateInsuranceRecordCommand command,
        CancellationToken cancellationToken)
    {
        if (id != command.Id)
            return BadRequest("Route id does not match command id.");

        var result = await Mediator.Send(command, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Transitions an insurance record to a new status, enforcing state machine rules.
    /// Valid transitions: Active→ExpiringSoon, Active→Cancelled, ExpiringSoon→Renewed,
    /// ExpiringSoon→Expired, ExpiringSoon→Cancelled, Expired→Renewed, Renewed→Active,
    /// Cancelled→Closed.
    /// Raises InsuranceExpiringEvent for ExpiringSoon/Expired transitions.
    /// </summary>
    [HttpPost("{id:guid}/transition")]
    [Authorize(Roles = "Legal_Compliance_Officer")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> TransitionStatus(
        Guid id,
        [FromBody] TransitionInsuranceStatusCommand command,
        CancellationToken cancellationToken)
    {
        if (id != command.Id)
            return BadRequest("Route id does not match command id.");

        var result = await Mediator.Send(command, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Renews an existing insurance record that is in ExpiringSoon or Expired status.
    /// Creates a new InsuranceRecord linked via PreviousPolicyId, carrying forward
    /// PolicyNumber, Insurer, CoverageType, OpportunityId, and LegalCaseId from the original.
    /// The original policy transitions to Renewed status.
    /// </summary>
    [HttpPost("{id:guid}/renew")]
    [Authorize(Roles = "Legal_Compliance_Officer")]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Renew(
        Guid id,
        [FromBody] RenewInsuranceRecordCommand command,
        CancellationToken cancellationToken)
    {
        if (id != command.Id)
            return BadRequest("Route id does not match command id.");

        var result = await Mediator.Send(command, cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }
}
