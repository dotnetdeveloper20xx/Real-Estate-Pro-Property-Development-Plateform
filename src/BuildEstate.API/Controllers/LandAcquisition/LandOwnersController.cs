using BuildEstate.Application.Features.LandAcquisition.LandOwners.Commands.CreateLandOwner;
using BuildEstate.Application.Features.LandAcquisition.LandOwners.Commands.UpdateLandOwner;
using BuildEstate.Application.Features.LandAcquisition.LandOwners.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BuildEstate.API.Controllers.LandAcquisition;

/// <summary>
/// Manages land owner records associated with land opportunities.
/// Supports creation and update of owner details for the acquisition workflow.
/// </summary>
[Route("api/v1/opportunities/{opportunityId:guid}/owners")]
public class LandOwnersController : BaseApiController
{
    /// <summary>
    /// Creates a new land owner associated with the specified opportunity.
    /// </summary>
    /// <param name="opportunityId">The opportunity to associate the owner with.</param>
    /// <param name="dto">The land owner creation data.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>The created land owner record.</returns>
    [HttpPost]
    [Authorize(Policy = "opportunities.create")]
    [ProducesResponseType(typeof(LandOwnerDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Create(
        [FromRoute] Guid opportunityId,
        [FromBody] CreateLandOwnerDto dto,
        CancellationToken cancellationToken)
    {
        var command = new CreateLandOwnerCommand
        {
            OpportunityId = opportunityId,
            Name = dto.Name,
            ContactDetails = dto.ContactDetails,
            Address = dto.Address,
            OwnershipType = dto.OwnershipType
        };

        var result = await Mediator.Send(command, cancellationToken);

        return CreatedAtAction(nameof(Create), new { opportunityId, ownerId = result.Id }, result);
    }

    /// <summary>
    /// Updates an existing land owner's details.
    /// </summary>
    /// <param name="opportunityId">The parent opportunity identifier.</param>
    /// <param name="ownerId">The land owner identifier to update.</param>
    /// <param name="dto">The updated land owner data.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>The updated land owner record.</returns>
    [HttpPut("{ownerId:guid}")]
    [Authorize(Policy = "opportunities.update")]
    [ProducesResponseType(typeof(LandOwnerDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(
        [FromRoute] Guid opportunityId,
        [FromRoute] Guid ownerId,
        [FromBody] UpdateLandOwnerDto dto,
        CancellationToken cancellationToken)
    {
        var command = new UpdateLandOwnerCommand
        {
            Id = ownerId,
            Name = dto.Name,
            ContactDetails = dto.ContactDetails,
            Address = dto.Address,
            OwnershipType = dto.OwnershipType
        };

        var result = await Mediator.Send(command, cancellationToken);

        return Ok(result);
    }
}
