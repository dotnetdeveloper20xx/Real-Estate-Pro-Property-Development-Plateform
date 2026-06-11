using BuildEstate.Domain.Enums;
using MediatR;

namespace BuildEstate.Application.Features.LandAcquisition.Opportunities.Commands.TransitionOpportunityStatus;

/// <summary>
/// MediatR notification published when an opportunity status transition succeeds.
/// Allows event handlers (notifications, audit enrichment) to react without coupling.
/// </summary>
public sealed record OpportunityStatusTransitionedNotification : INotification
{
    public Guid OpportunityId { get; init; }
    public OpportunityStatus PreviousStatus { get; init; }
    public OpportunityStatus NewStatus { get; init; }
    public string TransitionedBy { get; init; } = string.Empty;
    public DateTime TransitionedAt { get; init; }
}
