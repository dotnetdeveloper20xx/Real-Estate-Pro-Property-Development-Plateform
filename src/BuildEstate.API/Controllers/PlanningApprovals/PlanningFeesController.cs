using BuildEstate.Application.Features.PlanningApprovals.Fees.Commands.ApproveFee;
using BuildEstate.Application.Features.PlanningApprovals.Fees.Commands.CreateFee;
using BuildEstate.Application.Features.PlanningApprovals.Fees.Commands.TransitionFeeStatus;
using BuildEstate.Application.Features.PlanningApprovals.Fees.Queries.GetFees;
using BuildEstate.Application.Features.PlanningApprovals.Fees.Queries.GetFeeSummary;
using BuildEstate.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BuildEstate.API.Controllers.PlanningApprovals;

/// <summary>
/// Manages planning fee lifecycle for planning applications.
/// Supports listing fees, creating new fees, transitioning payment status,
/// Finance Director approval, and retrieving fee summaries grouped by type and status.
/// </summary>
public class PlanningFeesController : BaseApiController
{
    /// <summary>
    /// Returns a paginated list of planning fees for the specified application.
    /// Supports optional filtering by FeeType and PaymentStatus.
    /// Accessible by all authenticated users with planning roles.
    /// </summary>
    [HttpGet("/api/v1/planning-applications/{applicationId:guid}/fees")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetByApplication(
        [FromRoute] Guid applicationId,
        [FromQuery] FeeType? feeType,
        [FromQuery] PaymentStatus? paymentStatus,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        CancellationToken cancellationToken = default)
    {
        var query = new GetFeesQuery
        {
            ApplicationId = applicationId,
            FeeType = feeType,
            PaymentStatus = paymentStatus,
            PageNumber = pageNumber,
            PageSize = pageSize
        };

        var result = await Mediator.Send(query, cancellationToken);

        return Ok(result);
    }

    /// <summary>
    /// Returns fee totals for the specified application grouped by FeeType and PaymentStatus.
    /// Accessible by all authenticated users with planning roles.
    /// </summary>
    [HttpGet("/api/v1/planning-applications/{applicationId:guid}/fees/summary")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetSummary(
        [FromRoute] Guid applicationId,
        CancellationToken cancellationToken = default)
    {
        var query = new GetFeeSummaryQuery
        {
            ApplicationId = applicationId
        };

        var result = await Mediator.Send(query, cancellationToken);

        return Ok(result);
    }

    /// <summary>
    /// Creates a new planning fee against the specified application.
    /// When the fee amount exceeds the configured threshold, the system raises
    /// a FeeRequiresApprovalDomainEvent for Finance Director notification.
    /// Restricted to Planning_Manager role.
    /// </summary>
    [HttpPost("/api/v1/planning-applications/{applicationId:guid}/fees")]
    [Authorize(Policy = "planning.create")]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create(
        [FromRoute] Guid applicationId,
        [FromBody] CreateFeeCommand command,
        CancellationToken cancellationToken)
    {
        var enrichedCommand = command with { ApplicationId = applicationId };

        var result = await Mediator.Send(enrichedCommand, cancellationToken);

        return CreatedAtAction(nameof(GetByApplication), new { applicationId }, result);
    }

    /// <summary>
    /// Transitions a planning fee to a new payment status using the fee state machine.
    /// Enforces threshold rules: fees above the configured threshold cannot transition
    /// directly from Pending to Paid and must go through AwaitingApproval → Approved → Paid.
    /// Restricted to Planning_Manager role.
    /// </summary>
    [HttpPut("/api/v1/planning-fees/{feeId:guid}/status")]
    [Authorize(Policy = "planning.update")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> TransitionStatus(
        [FromRoute] Guid feeId,
        [FromBody] TransitionFeeStatusCommand command,
        CancellationToken cancellationToken)
    {
        var enrichedCommand = command with { FeeId = feeId };

        var result = await Mediator.Send(enrichedCommand, cancellationToken);

        return Ok(result);
    }

    /// <summary>
    /// Approves a planning fee that is awaiting Finance Director approval.
    /// Records the approver identity, approval timestamp, and optional approval notes.
    /// Restricted to Finance_Director role only.
    /// </summary>
    [HttpPut("/api/v1/planning-fees/{feeId:guid}/approve")]
    [Authorize(Policy = "finance.approve")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Approve(
        [FromRoute] Guid feeId,
        [FromBody] ApproveFeeCommand command,
        CancellationToken cancellationToken)
    {
        var enrichedCommand = command with { FeeId = feeId };

        var result = await Mediator.Send(enrichedCommand, cancellationToken);

        return Ok(result);
    }
}
