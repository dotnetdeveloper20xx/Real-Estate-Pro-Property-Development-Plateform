using BuildEstate.Application.Features.LegalCompliance.LegalCases.Commands.CreateLegalCase;
using BuildEstate.Application.Features.LegalCompliance.LegalCases.Commands.TransitionLegalCaseStatus;
using BuildEstate.Application.Features.LegalCompliance.LegalCases.Commands.UpdateLegalCase;
using BuildEstate.Application.Features.LegalCompliance.LegalCases.Queries.GetLegalCaseById;
using BuildEstate.Application.Features.LegalCompliance.LegalCases.Queries.GetLegalCasePipeline;
using BuildEstate.Application.Features.LegalCompliance.LegalCases.Queries.GetLegalCases;
using BuildEstate.Application.Features.LegalCompliance.LegalCases.Queries.GetLegalCaseSummaryForOpportunity;
using BuildEstate.Application.Features.LegalCompliance.LegalCases.Queries.GetLegalCaseSummaryForPlanning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BuildEstate.API.Controllers.LegalCompliance;

/// <summary>
/// Manages legal case lifecycle operations including creation, updates, status transitions,
/// pipeline views, and cross-module summary endpoints.
/// All endpoints require authentication. Write operations (create, update, transition)
/// are restricted to Legal_Compliance_Officer and Admin_Support roles.
/// Read operations are available to all legal roles.
/// </summary>
[Route("api/v1/legal-cases")]
public class LegalCasesController : BaseApiController
{
    /// <summary>
    /// Creates a new legal case linked to a land opportunity or planning application.
    /// The case is initialised with status Open and a unique reference (LC-YYYY-NNNNN).
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "Legal_Compliance_Officer,Admin_Support")]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create(
        [FromBody] CreateLegalCaseCommand command,
        CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(command, cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    /// <summary>
    /// Returns a paginated, filtered, and sorted list of legal cases.
    /// Supports filtering by Status, CaseType, Priority, and free-text search
    /// across Title, CaseReference, and AssignedSolicitor.
    /// </summary>
    [HttpGet]
    [Authorize(Roles = "Legal_Compliance_Officer,Finance_Director,Acquisition_Manager,Admin_Support")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(
        [FromQuery] GetLegalCasesQuery query,
        CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(query, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Returns the full legal case detail including related contracts, documents,
    /// insurance records, and permitted status transitions from the state machine.
    /// </summary>
    [HttpGet("{id:guid}")]
    [Authorize(Roles = "Legal_Compliance_Officer,Finance_Director,Acquisition_Manager,Admin_Support")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(
            new GetLegalCaseByIdQuery { Id = id },
            cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Updates an existing legal case's editable fields including Title, Description,
    /// Priority, AssignedSolicitor, SolicitorFirm, SolicitorEmail, SolicitorPhone, and Notes.
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
        [FromBody] UpdateLegalCaseCommand command,
        CancellationToken cancellationToken)
    {
        if (id != command.Id)
            return BadRequest("Route id does not match command id.");

        var result = await Mediator.Send(command, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Transitions a legal case to a new status, enforcing state machine rules.
    /// Conditional data required for specific transitions:
    /// - ResolutionSummary (≥20 chars) + ResolutionDate for Resolved
    /// - EscalationReason (≥10 chars) for Escalated
    /// - HoldReason (≥10 chars) for On Hold
    /// - All linked contracts in terminal state for Closed
    /// </summary>
    [HttpPost("{id:guid}/transition")]
    [Authorize(Roles = "Legal_Compliance_Officer,Admin_Support")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> TransitionStatus(
        Guid id,
        [FromBody] TransitionLegalCaseStatusCommand command,
        CancellationToken cancellationToken)
    {
        if (id != command.Id)
            return BadRequest("Route id does not match command id.");

        var result = await Mediator.Send(command, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Returns all non-deleted legal cases grouped by their current status
    /// for a pipeline/kanban board view. Each group includes its case items and count.
    /// Restricted to Legal_Compliance_Officer role.
    /// </summary>
    [HttpGet("pipeline")]
    [Authorize(Roles = "Legal_Compliance_Officer")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPipeline(CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(new GetLegalCasePipelineQuery(), cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Returns legal case summaries for a specific land opportunity.
    /// Provides a lightweight view for cross-module integration with Land Acquisition.
    /// </summary>
    [HttpGet("summary/opportunity/{opportunityId:guid}")]
    [Authorize(Roles = "Legal_Compliance_Officer,Finance_Director,Acquisition_Manager,Admin_Support")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetSummaryForOpportunity(
        Guid opportunityId,
        CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(
            new GetLegalCaseSummaryForOpportunityQuery { OpportunityId = opportunityId },
            cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Returns legal case summaries for a specific planning application.
    /// Provides a lightweight view for cross-module integration with Planning &amp; Approvals.
    /// </summary>
    [HttpGet("summary/planning/{planningApplicationId:guid}")]
    [Authorize(Roles = "Legal_Compliance_Officer,Finance_Director,Acquisition_Manager,Admin_Support")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetSummaryForPlanning(
        Guid planningApplicationId,
        CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(
            new GetLegalCaseSummaryForPlanningQuery { PlanningApplicationId = planningApplicationId },
            cancellationToken);
        return Ok(result);
    }
}
