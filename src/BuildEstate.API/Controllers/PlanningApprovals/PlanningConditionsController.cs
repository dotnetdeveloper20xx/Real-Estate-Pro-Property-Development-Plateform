using BuildEstate.Application.Features.PlanningApprovals.Conditions.Commands.CreateCondition;
using BuildEstate.Application.Features.PlanningApprovals.Conditions.Commands.TransitionConditionStatus;
using BuildEstate.Application.Features.PlanningApprovals.Conditions.Queries.GetConditions;
using BuildEstate.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BuildEstate.API.Controllers.PlanningApprovals;

/// <summary>
/// Manages planning condition lifecycle for approved-with-conditions applications.
/// Supports listing conditions by application, creating new conditions,
/// and transitioning condition status through the discharge workflow.
/// </summary>
[Route("api/v1/planning-applications/{applicationId:guid}/conditions")]
public class PlanningConditionsController : BaseApiController
{
    /// <summary>
    /// Returns a paginated list of planning conditions for the specified application.
    /// Supports optional filtering by Status and ConditionType.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetByApplication(
        [FromRoute] Guid applicationId,
        [FromQuery] ConditionStatus? status,
        [FromQuery] ConditionType? conditionType,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        CancellationToken cancellationToken = default)
    {
        var query = new GetConditionsQuery
        {
            ApplicationId = applicationId,
            Status = status,
            ConditionType = conditionType,
            PageNumber = pageNumber,
            PageSize = pageSize
        };

        var result = await Mediator.Send(query, cancellationToken);

        return Ok(result);
    }

    /// <summary>
    /// Creates a new planning condition against the specified application.
    /// The parent application must have a status of Approved with Conditions.
    /// Restricted to Legal_Compliance_Officer and Admin_Support roles.
    /// </summary>
    [HttpPost]
    [Authorize(Policy = "planning.create")]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create(
        [FromRoute] Guid applicationId,
        [FromBody] CreateConditionCommand command,
        CancellationToken cancellationToken)
    {
        var enrichedCommand = command with { ApplicationId = applicationId };

        var result = await Mediator.Send(enrichedCommand, cancellationToken);

        return CreatedAtAction(nameof(GetByApplication), new { applicationId }, result);
    }

    /// <summary>
    /// Transitions a planning condition to a new status using the condition state machine.
    /// For discharge transitions, DischargeDate and DischargeReference are required.
    /// Restricted to Legal_Compliance_Officer and Admin_Support roles.
    /// </summary>
    [HttpPut("/api/v1/planning-conditions/{conditionId:guid}/status")]
    [Authorize(Policy = "planning.approve")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> TransitionStatus(
        [FromRoute] Guid conditionId,
        [FromBody] TransitionConditionStatusCommand command,
        CancellationToken cancellationToken)
    {
        var enrichedCommand = command with { ConditionId = conditionId };

        var result = await Mediator.Send(enrichedCommand, cancellationToken);

        return Ok(result);
    }
}
