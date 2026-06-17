using BuildEstate.Application.Features.LandAcquisition.Contracts.Commands.CreateContract;
using BuildEstate.Application.Features.LandAcquisition.Contracts.Commands.TransitionContractStatus;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BuildEstate.API.Controllers.LandAcquisition;

/// <summary>
/// Manages contract creation and status transitions for land opportunities.
/// All endpoints require authentication. Operations are restricted to
/// LegalOfficer and Admin roles.
/// </summary>
[Route("api/v1/opportunities/{opportunityId:guid}/contracts")]
public class ContractsController : BaseApiController
{
    /// <summary>
    /// Creates a new contract for a land opportunity that has an accepted offer.
    /// The contract is created with status Draft.
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "SuperAdmin,AcquisitionManager,LegalOfficer,Admin")]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Create(
        Guid opportunityId,
        [FromBody] CreateContractCommand command,
        CancellationToken cancellationToken)
    {
        if (opportunityId != command.OpportunityId)
            return BadRequest("Route opportunityId does not match command OpportunityId.");

        var result = await Mediator.Send(command, cancellationToken);
        return Created($"api/v1/opportunities/{opportunityId}/contracts/{result.Id}", result);
    }

    /// <summary>
    /// Transitions a contract to a new status, enforcing the contract state machine rules.
    /// When transitioning to Exchanged status, a deposit amount must be provided.
    /// </summary>
    [HttpPatch("{contractId:guid}/status")]
    [Authorize(Roles = "SuperAdmin,AcquisitionManager,LegalOfficer,Admin")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> TransitionStatus(
        Guid opportunityId,
        Guid contractId,
        [FromBody] TransitionContractStatusCommand command,
        CancellationToken cancellationToken)
    {
        if (contractId != command.ContractId)
            return BadRequest("Route contractId does not match command ContractId.");

        var result = await Mediator.Send(command, cancellationToken);
        return Ok(result);
    }
}
