using MediatR;

namespace BuildEstate.Application.Features.LandAcquisition.EventHandlers;

/// <summary>
/// MediatR notification published when a due diligence check fails.
/// Used to notify the Acquisition Manager associated with the parent opportunity.
/// Validates: Requirement 19.3
/// </summary>
public sealed record DueDiligenceFailedNotification : INotification
{
    /// <summary>
    /// The opportunity this due diligence belongs to.
    /// </summary>
    public Guid OpportunityId { get; init; }

    /// <summary>
    /// The due diligence check that failed.
    /// </summary>
    public Guid DueDiligenceId { get; init; }

    /// <summary>
    /// The user ID of the Acquisition Manager who created the opportunity.
    /// </summary>
    public string OpportunityCreatedBy { get; init; } = string.Empty;
}
