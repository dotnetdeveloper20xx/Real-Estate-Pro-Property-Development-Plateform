using BuildEstate.Application.Features.LandAcquisition.Acquisitions.Commands.CreateAcquisition;
using BuildEstate.Application.Features.LandAcquisition.Acquisitions.Commands.TransitionAcquisitionStatus;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BuildEstate.API.Controllers.LandAcquisition;

/// <summary>
/// Manages land acquisition record creation and status transitions for opportunities.
/// All endpoints require authentication. Operations are restricted to the Admin role.
/// </summary>
[Route("api/v1/opportunities/{opportunityId:guid}/acquisitions")]
public class AcquisitionsController : BaseApiController
{
    /// <summary>
    /// Creates a new land acquisition record for an opportunity.
    /// Only one active acquisition record is permitted per opportunity.
    /// The record is created with status Completed.
    /// </summary>
    [HttpPost]
    [Authorize(Policy = "opportunities.create")]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Create(
        Guid opportunityId,
        [FromBody] CreateAcquisitionCommand command,
        CancellationToken cancellationToken)
    {
        if (opportunityId != command.OpportunityId)
            return BadRequest("Route opportunityId does not match command OpportunityId.");

        var result = await Mediator.Send(command, cancellationToken);
        return Created($"api/v1/opportunities/{opportunityId}/acquisitions/{result.Id}", result);
    }

    /// <summary>
    /// Transitions an acquisition record to a new status.
    /// Only valid transition is Completed → Registered.
    /// When transitioning to Registered, the parent opportunity is cascaded to Acquired status.
    /// </summary>
    [HttpPatch("{acqId:guid}/status")]
    [Authorize(Policy = "opportunities.approve")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> TransitionStatus(
        Guid opportunityId,
        Guid acqId,
        [FromBody] TransitionAcquisitionStatusCommand command,
        CancellationToken cancellationToken)
    {
        if (acqId != command.AcquisitionId)
            return BadRequest("Route acqId does not match command AcquisitionId.");

        var result = await Mediator.Send(command, cancellationToken);
        return Ok(result);
    }
}
