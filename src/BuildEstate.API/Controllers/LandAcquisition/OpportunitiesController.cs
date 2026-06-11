using BuildEstate.Application.Features.LandAcquisition.Opportunities.Commands.CreateOpportunity;
using BuildEstate.Application.Features.LandAcquisition.Opportunities.Commands.DeleteOpportunity;
using BuildEstate.Application.Features.LandAcquisition.Opportunities.Commands.TransitionOpportunityStatus;
using BuildEstate.Application.Features.LandAcquisition.Opportunities.Commands.UpdateOpportunity;
using BuildEstate.Application.Features.LandAcquisition.Opportunities.Queries.GetOpportunities;
using BuildEstate.Application.Features.LandAcquisition.Opportunities.Queries.GetOpportunityById;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BuildEstate.API.Controllers.LandAcquisition;

/// <summary>
/// Manages land opportunity CRUD operations and status transitions.
/// All endpoints require authentication. Write operations are restricted
/// to AcquisitionManager and AdminSupport roles.
/// </summary>
[Route("api/v1/opportunities")]
public class OpportunitiesController : BaseApiController
{
    /// <summary>
    /// Creates a new land opportunity in the pipeline with status Identified.
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "AcquisitionManager,AdminSupport")]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Create(
        [FromBody] CreateOpportunityCommand command,
        CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(command, cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    /// <summary>
    /// Returns a paginated, filtered, and sorted list of land opportunities.
    /// Supports filtering by Status, Location, Source, date range, and free-text search.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(
        [FromQuery] GetOpportunitiesQuery query,
        CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(query, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Returns the full opportunity detail including associated LandOwner,
    /// DueDiligence records, Offers, and Documents.
    /// </summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(new GetOpportunityByIdQuery { Id = id }, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Updates an existing land opportunity's editable fields.
    /// Uses optimistic concurrency via RowVersion.
    /// </summary>
    [HttpPut("{id:guid}")]
    [Authorize(Roles = "AcquisitionManager,AdminSupport")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(
        Guid id,
        [FromBody] UpdateOpportunityCommand command,
        CancellationToken cancellationToken)
    {
        if (id != command.Id)
            return BadRequest("Route id does not match command id.");

        var result = await Mediator.Send(command, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Soft-deletes a land opportunity by setting IsDeleted to true.
    /// </summary>
    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "AcquisitionManager,AdminSupport")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        await Mediator.Send(new DeleteOpportunityCommand(id), cancellationToken);
        return NoContent();
    }

    /// <summary>
    /// Transitions a land opportunity to a new status, enforcing state machine rules,
    /// due diligence completion gates, and approval checks.
    /// </summary>
    [HttpPatch("{id:guid}/status")]
    [Authorize(Roles = "AcquisitionManager,AdminSupport")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> TransitionStatus(
        Guid id,
        [FromBody] TransitionOpportunityStatusCommand command,
        CancellationToken cancellationToken)
    {
        if (id != command.OpportunityId)
            return BadRequest("Route id does not match command OpportunityId.");

        var result = await Mediator.Send(command, cancellationToken);
        return Ok(result);
    }
}
