using BuildEstate.Application.Features.LandAcquisition.DueDiligence.Commands.CreateDueDiligence;
using BuildEstate.Application.Features.LandAcquisition.DueDiligence.Commands.TransitionDueDiligenceStatus;
using BuildEstate.Application.Features.LandAcquisition.DueDiligence.Queries.GetDueDiligenceByOpportunity;
using BuildEstate.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BuildEstate.API.Controllers.LandAcquisition;

/// <summary>
/// Manages due diligence checks associated with land opportunities.
/// Supports listing, creating, and transitioning status of DD checks.
/// </summary>
[Route("api/v1/opportunities/{opportunityId:guid}/due-diligence")]
public class DueDiligenceController : BaseApiController
{
    /// <summary>
    /// Lists all due diligence checks for a given opportunity.
    /// Supports optional filtering by Type and Status query parameters.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetByOpportunity(
        [FromRoute] Guid opportunityId,
        [FromQuery] DueDiligenceType? type,
        [FromQuery] DueDiligenceStatus? status,
        CancellationToken cancellationToken)
    {
        var query = new GetDueDiligenceByOpportunityQuery
        {
            OpportunityId = opportunityId,
            Type = type,
            Status = status
        };

        var result = await Mediator.Send(query, cancellationToken);

        return Ok(result);
    }

    /// <summary>
    /// Creates a new due diligence check for the specified opportunity.
    /// Accessible by AcquisitionManager, LegalOfficer, SuperAdmin, and Admin roles.
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "SuperAdmin,AcquisitionManager,LegalOfficer,Admin")]
    public async Task<IActionResult> Create(
        [FromRoute] Guid opportunityId,
        [FromBody] CreateDueDiligenceCommand command,
        CancellationToken cancellationToken)
    {
        var enrichedCommand = command with { OpportunityId = opportunityId };

        var result = await Mediator.Send(enrichedCommand, cancellationToken);

        return CreatedAtAction(nameof(GetByOpportunity), new { opportunityId }, result);
    }

    /// <summary>
    /// Transitions the status of a due diligence check using the DD state machine.
    /// Accessible by AcquisitionManager, LegalOfficer, SuperAdmin, and Admin roles.
    /// </summary>
    [HttpPatch("{ddId:guid}/status")]
    [Authorize(Roles = "SuperAdmin,AcquisitionManager,LegalOfficer,Admin")]
    public async Task<IActionResult> TransitionStatus(
        [FromRoute] Guid opportunityId,
        [FromRoute] Guid ddId,
        [FromBody] TransitionDueDiligenceStatusCommand command,
        CancellationToken cancellationToken)
    {
        var enrichedCommand = command with { DueDiligenceId = ddId };

        var result = await Mediator.Send(enrichedCommand, cancellationToken);

        return Ok(result);
    }
}
