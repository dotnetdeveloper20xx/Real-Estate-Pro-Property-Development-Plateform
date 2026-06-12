using BuildEstate.Application.Features.PlanningApprovals.Applications.Commands.CreateApplication;
using BuildEstate.Application.Features.PlanningApprovals.Applications.Commands.TransitionApplicationStatus;
using BuildEstate.Application.Features.PlanningApprovals.Applications.Commands.UpdateApplication;
using BuildEstate.Application.Features.PlanningApprovals.Applications.Queries.GetApplicationById;
using BuildEstate.Application.Features.PlanningApprovals.Applications.Queries.GetApplications;
using BuildEstate.Application.Features.PlanningApprovals.Applications.Queries.GetApplicationsByOpportunity;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BuildEstate.API.Controllers.PlanningApprovals;

/// <summary>
/// Manages planning application CRUD operations, status transitions, and opportunity lookups.
/// All endpoints require authentication. Write operations are restricted to
/// PlanningManager and AdminSupport roles. Read operations are open to all planning roles.
/// </summary>
[Route("api/v1/planning-applications")]
public class PlanningApplicationsController : BaseApiController
{
    /// <summary>
    /// Creates a new planning application linked to an acquired land opportunity.
    /// The application is initialised with status Pre-Application.
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "PlanningManager,AdminSupport")]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Create(
        [FromBody] CreateApplicationCommand command,
        CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(command, cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    /// <summary>
    /// Returns a paginated, filtered, and sorted list of planning applications.
    /// Supports filtering by Status, ApplicationType, CouncilName, and SubmissionDate range.
    /// Supports sorting by Description, CreatedAt, SubmissionDate, TargetDecisionDate, and Status.
    /// Supports free-text search across Description, ApplicationReference, CouncilName,
    /// and linked LandOpportunity Name.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(
        [FromQuery] GetApplicationsQuery query,
        CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(query, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Returns the full planning application detail including associated conditions,
    /// documents, fees, milestones, council contact, and linked LandOpportunity summary.
    /// </summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(
            new GetApplicationByIdQuery { ApplicationId = id },
            cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Updates an existing planning application's editable fields (Description,
    /// ApplicationType, CouncilName, TargetDecisionDate).
    /// Uses optimistic concurrency via RowVersion.
    /// </summary>
    [HttpPut("{id:guid}")]
    [Authorize(Roles = "PlanningManager,AdminSupport")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(
        Guid id,
        [FromBody] UpdateApplicationCommand command,
        CancellationToken cancellationToken)
    {
        if (id != command.Id)
            return BadRequest("Route id does not match command id.");

        var result = await Mediator.Send(command, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Transitions a planning application to a new status, enforcing state machine rules.
    /// Conditional data is required for specific transitions:
    /// - ApplicationReference (5-50 chars) when transitioning to Submitted
    /// - DecisionDate (not in the future) when transitioning to Approved, ApprovedWithConditions, or Refused
    /// - WithdrawalReason (10+ chars) when transitioning to Withdrawn
    /// </summary>
    [HttpPut("{id:guid}/status")]
    [Authorize(Roles = "PlanningManager,AdminSupport")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> TransitionStatus(
        Guid id,
        [FromBody] TransitionApplicationStatusCommand command,
        CancellationToken cancellationToken)
    {
        if (id != command.ApplicationId)
            return BadRequest("Route id does not match command ApplicationId.");

        var result = await Mediator.Send(command, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Returns a list of planning applications linked to a given land opportunity.
    /// Provides a summary view for integration with the Land Acquisition module.
    /// </summary>
    [HttpGet("by-opportunity/{opportunityId:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetByOpportunity(
        Guid opportunityId,
        CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(
            new GetApplicationsByOpportunityQuery { OpportunityId = opportunityId },
            cancellationToken);
        return Ok(result);
    }
}
