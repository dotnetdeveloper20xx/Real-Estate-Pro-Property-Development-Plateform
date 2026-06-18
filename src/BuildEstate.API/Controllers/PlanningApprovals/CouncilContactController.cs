using BuildEstate.Application.Features.PlanningApprovals.CouncilContacts.Commands.CreateCouncilContact;
using BuildEstate.Application.Features.PlanningApprovals.CouncilContacts.Commands.UpdateCouncilContact;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BuildEstate.API.Controllers.PlanningApprovals;

/// <summary>
/// Manages council contact details for planning applications.
/// A council contact records which local planning authority and officer
/// is handling the application. Only one council contact exists per application.
/// Restricted to the PlanningManager role.
/// </summary>
[Route("api/v1/planning-applications/{applicationId:guid}/council-contact")]
[Authorize(Policy = "planning.update")]
public class CouncilContactController : BaseApiController
{
    /// <summary>
    /// Creates a new council contact for the specified planning application.
    /// Enforces one-to-one relationship — if a contact already exists for
    /// the application, a 409 Conflict response is returned by the handler.
    /// </summary>
    [HttpPost]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Create(
        [FromRoute] Guid applicationId,
        [FromBody] CreateCouncilContactCommand command,
        CancellationToken cancellationToken)
    {
        var enrichedCommand = command with { ApplicationId = applicationId };

        var result = await Mediator.Send(enrichedCommand, cancellationToken);

        return CreatedAtAction(nameof(Create), new { applicationId }, result);
    }

    /// <summary>
    /// Updates the existing council contact for the specified planning application.
    /// All fields (CouncilName, PlanningOfficerName, Email, Phone, Address) are overwritten.
    /// The update is recorded in the audit trail.
    /// </summary>
    [HttpPut("{contactId:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(
        [FromRoute] Guid applicationId,
        [FromRoute] Guid contactId,
        [FromBody] UpdateCouncilContactCommand command,
        CancellationToken cancellationToken)
    {
        if (contactId != command.Id)
            return BadRequest("Route contactId does not match command Id.");

        var result = await Mediator.Send(command, cancellationToken);

        return Ok(result);
    }
}
