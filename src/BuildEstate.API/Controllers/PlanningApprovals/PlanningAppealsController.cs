using BuildEstate.Application.Features.PlanningApprovals.Appeals.Commands.CreateAppeal;
using BuildEstate.Application.Features.PlanningApprovals.Appeals.Commands.TransitionAppealStatus;
using BuildEstate.Application.Features.PlanningApprovals.Appeals.Queries.GetAppeals;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BuildEstate.API.Controllers.PlanningApprovals;

/// <summary>
/// Manages planning appeals for refused applications.
/// Supports listing, creating, and transitioning appeal status.
/// Appeal creation and status transitions are restricted to Legal_Compliance_Officer.
/// Listing is accessible to all authenticated users with planning roles.
/// </summary>
public class PlanningAppealsController : BaseApiController
{
    /// <summary>
    /// Lists all appeals for a given planning application, ordered by LodgedDate descending.
    /// Accessible by all authenticated users with planning roles.
    /// </summary>
    [HttpGet("/api/v1/planning-applications/{applicationId:guid}/appeals")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetByApplication(
        [FromRoute] Guid applicationId,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        CancellationToken cancellationToken = default)
    {
        var query = new GetAppealsQuery
        {
            ApplicationId = applicationId,
            PageNumber = pageNumber,
            PageSize = pageSize
        };

        var result = await Mediator.Send(query, cancellationToken);

        return Ok(result);
    }

    /// <summary>
    /// Creates a new appeal for a refused planning application.
    /// Restricted to LegalComplianceOfficer role.
    /// </summary>
    [HttpPost("/api/v1/planning-applications/{applicationId:guid}/appeals")]
    [Authorize(Roles = "LegalComplianceOfficer")]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Create(
        [FromRoute] Guid applicationId,
        [FromBody] CreateAppealCommand command,
        CancellationToken cancellationToken)
    {
        var enrichedCommand = command with { ApplicationId = applicationId };

        var result = await Mediator.Send(enrichedCommand, cancellationToken);

        return CreatedAtAction(
            nameof(GetByApplication),
            new { applicationId },
            result);
    }

    /// <summary>
    /// Transitions the status of a planning appeal using the appeal state machine.
    /// Restricted to LegalComplianceOfficer role.
    /// </summary>
    [HttpPut("/api/v1/planning-appeals/{appealId:guid}/status")]
    [Authorize(Roles = "LegalComplianceOfficer")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> TransitionStatus(
        [FromRoute] Guid appealId,
        [FromBody] TransitionAppealStatusCommand command,
        CancellationToken cancellationToken)
    {
        var enrichedCommand = command with { AppealId = appealId };

        var result = await Mediator.Send(enrichedCommand, cancellationToken);

        return Ok(result);
    }
}
