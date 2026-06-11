using BuildEstate.Application.Features.LandAcquisition.Approvals.Commands.ApproveOrReject;
using BuildEstate.Application.Features.LandAcquisition.Approvals.Commands.CreateApprovalRequest;
using BuildEstate.Application.Features.LandAcquisition.Approvals.DTOs;
using BuildEstate.Application.Features.LandAcquisition.Approvals.Queries.GetPendingApprovals;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BuildEstate.API.Controllers.LandAcquisition;

/// <summary>
/// Manages approval requests for land acquisition decisions.
/// POST is typically auto-triggered by the system when an offer exceeds the approval threshold.
/// PATCH and GET are restricted to the Finance Director role.
/// </summary>
[Route("api/v1/approvals")]
public class ApprovalsController : BaseApiController
{
    /// <summary>
    /// Creates a new approval request. Typically auto-triggered by the system
    /// when an offer amount exceeds the configurable approval threshold.
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(ApprovalRequestDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create(
        [FromBody] CreateApprovalRequestCommand command,
        CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(command, cancellationToken);
        return CreatedAtAction(nameof(GetPending), null, result);
    }

    /// <summary>
    /// Approves or rejects an existing approval request.
    /// Records the approver identity, timestamp, and notes or rejection reason.
    /// Restricted to the Finance Director role.
    /// </summary>
    [HttpPatch("{id:guid}")]
    [Authorize(Roles = "FinanceDirector")]
    [ProducesResponseType(typeof(ApprovalRequestDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ApproveOrReject(
        Guid id,
        [FromBody] ApproveOrRejectCommand command,
        CancellationToken cancellationToken)
    {
        if (id != command.ApprovalRequestId)
            return BadRequest("Route id does not match command ApprovalRequestId.");

        var result = await Mediator.Send(command, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Retrieves all pending approval requests awaiting Finance Director review.
    /// </summary>
    [HttpGet("pending")]
    [Authorize(Roles = "FinanceDirector")]
    [ProducesResponseType(typeof(List<ApprovalRequestDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPending(CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(new GetPendingApprovalsQuery(), cancellationToken);
        return Ok(result);
    }
}
