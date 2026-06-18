using BuildEstate.Application.Features.PlanningApprovals.Milestones.Commands.CompleteMilestone;
using BuildEstate.Application.Features.PlanningApprovals.Milestones.Commands.CreateMilestone;
using BuildEstate.Application.Features.PlanningApprovals.Milestones.Queries.GetMilestones;
using BuildEstate.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BuildEstate.API.Controllers.PlanningApprovals;

/// <summary>
/// Manages planning milestone lifecycle for applications.
/// Supports listing milestones by application, creating new milestones,
/// and recording milestone completion with variance calculation.
/// All write operations are restricted to the PlanningManager role.
/// </summary>
[Route("api/v1/planning-applications/{applicationId:guid}/milestones")]
public class PlanningMilestonesController : BaseApiController
{
    /// <summary>
    /// Returns all planning milestones for the specified application,
    /// ordered by TargetDate ascending. Since milestone types are limited
    /// to a fixed set per application, no pagination is required.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetByApplication(
        [FromRoute] Guid applicationId,
        CancellationToken cancellationToken = default)
    {
        var query = new GetMilestonesQuery
        {
            ApplicationId = applicationId
        };

        var result = await Mediator.Send(query, cancellationToken);

        return Ok(result);
    }

    /// <summary>
    /// Creates a new planning milestone for the specified application.
    /// Validates that MilestoneType is unique within the application.
    /// The milestone is created with Status = Pending.
    /// Restricted to PlanningManager role.
    /// </summary>
    [HttpPost]
    [Authorize(Policy = "planning.create")]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Create(
        [FromRoute] Guid applicationId,
        [FromBody] CreateMilestoneCommand command,
        CancellationToken cancellationToken = default)
    {
        var enrichedCommand = command with { ApplicationId = applicationId };

        var result = await Mediator.Send(enrichedCommand, cancellationToken);

        return CreatedAtAction(nameof(GetByApplication), new { applicationId }, result);
    }

    /// <summary>
    /// Records the actual completion date of a planning milestone and
    /// calculates the variance in days between target and actual dates.
    /// Updates milestone Status to Completed.
    /// Restricted to PlanningManager role.
    /// </summary>
    [HttpPut("/api/v1/planning-milestones/{milestoneId:guid}/complete")]
    [Authorize(Policy = "planning.update")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Complete(
        [FromRoute] Guid milestoneId,
        [FromBody] CompleteMilestoneCommand command,
        CancellationToken cancellationToken = default)
    {
        var enrichedCommand = command with { MilestoneId = milestoneId };

        var result = await Mediator.Send(enrichedCommand, cancellationToken);

        return Ok(result);
    }
}
