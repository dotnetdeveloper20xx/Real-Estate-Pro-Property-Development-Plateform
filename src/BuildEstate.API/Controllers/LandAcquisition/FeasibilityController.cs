using BuildEstate.Application.Features.LandAcquisition.Feasibility.Commands.CreateOrUpdateFeasibility;
using BuildEstate.Application.Features.LandAcquisition.Feasibility.Queries.GetFeasibilityByOpportunity;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BuildEstate.API.Controllers.LandAcquisition;

/// <summary>
/// Manages feasibility assessment creation, updates, and retrieval for land opportunities.
/// All endpoints require authentication. Creation/update is restricted to
/// ValuationAnalyst and FinanceDirector roles. Read access is available to all authenticated users.
/// </summary>
[Route("api/v1/opportunities/{opportunityId:guid}/feasibility")]
public class FeasibilityController : BaseApiController
{
    /// <summary>
    /// Creates or updates a feasibility assessment for a land opportunity.
    /// Calculates TotalCosts, EstimatedProfit, and RoiPercentage from the provided inputs.
    /// If an assessment already exists for the opportunity, it will be updated.
    /// </summary>
    [HttpPost]
    [Authorize(Policy = "opportunities.create")]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> CreateOrUpdate(
        Guid opportunityId,
        [FromBody] CreateOrUpdateFeasibilityCommand command,
        CancellationToken cancellationToken)
    {
        if (opportunityId != command.OpportunityId)
            return BadRequest("Route opportunityId does not match command OpportunityId.");

        var result = await Mediator.Send(command, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Retrieves the feasibility assessment for a specific opportunity.
    /// Returns 404 if no assessment exists for the given opportunity.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Get(
        Guid opportunityId,
        CancellationToken cancellationToken)
    {
        var query = new GetFeasibilityByOpportunityQuery { OpportunityId = opportunityId };
        var result = await Mediator.Send(query, cancellationToken);

        if (result is null)
            return NotFound($"No feasibility assessment found for opportunity {opportunityId}.");

        return Ok(result);
    }
}
