using BuildEstate.Application.Features.LandAcquisition.Offers.Commands.CreateOffer;
using BuildEstate.Application.Features.LandAcquisition.Offers.Commands.TransitionOfferStatus;
using BuildEstate.Application.Features.LandAcquisition.Offers.Queries.GetOffersByOpportunity;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BuildEstate.API.Controllers.LandAcquisition;

/// <summary>
/// Manages offers associated with land opportunities.
/// Supports listing, creating, and transitioning status of offers.
/// </summary>
[Route("api/v1/opportunities/{opportunityId:guid}/offers")]
public class OffersController : BaseApiController
{
    /// <summary>
    /// Lists all offers for a given opportunity, ordered by OfferDate descending.
    /// Accessible by all authenticated users with land acquisition roles.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetByOpportunity(
        [FromRoute] Guid opportunityId,
        CancellationToken cancellationToken)
    {
        var query = new GetOffersByOpportunityQuery
        {
            OpportunityId = opportunityId
        };

        var result = await Mediator.Send(query, cancellationToken);

        return Ok(result);
    }

    /// <summary>
    /// Creates a new offer for the specified opportunity.
    /// Restricted to AcquisitionManager and Admin roles.
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "AcquisitionManager,Admin")]
    public async Task<IActionResult> Create(
        [FromRoute] Guid opportunityId,
        [FromBody] CreateOfferCommand command,
        CancellationToken cancellationToken)
    {
        var enrichedCommand = command with { OpportunityId = opportunityId };

        var result = await Mediator.Send(enrichedCommand, cancellationToken);

        return CreatedAtAction(nameof(GetByOpportunity), new { opportunityId }, result);
    }

    /// <summary>
    /// Transitions the status of an offer using the offer state machine.
    /// Restricted to AcquisitionManager and Admin roles.
    /// </summary>
    [HttpPatch("{offerId:guid}/status")]
    [Authorize(Roles = "AcquisitionManager,Admin")]
    public async Task<IActionResult> TransitionStatus(
        [FromRoute] Guid opportunityId,
        [FromRoute] Guid offerId,
        [FromBody] TransitionOfferStatusCommand command,
        CancellationToken cancellationToken)
    {
        var enrichedCommand = command with { OfferId = offerId };

        var result = await Mediator.Send(enrichedCommand, cancellationToken);

        return Ok(result);
    }
}
