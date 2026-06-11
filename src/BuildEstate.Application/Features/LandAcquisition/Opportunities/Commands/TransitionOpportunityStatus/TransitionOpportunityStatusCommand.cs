using BuildEstate.Application.Features.LandAcquisition.Opportunities.DTOs;
using BuildEstate.Domain.Enums;
using MediatR;

namespace BuildEstate.Application.Features.LandAcquisition.Opportunities.Commands.TransitionOpportunityStatus;

/// <summary>
/// Command to transition a land opportunity to a new status.
/// Enforces state machine rules, DD completion gates, and approval checks.
/// </summary>
public sealed record TransitionOpportunityStatusCommand : IRequest<OpportunityDto>
{
    public Guid OpportunityId { get; init; }
    public OpportunityStatus TargetStatus { get; init; }
    public string? WithdrawalReason { get; init; }
}
