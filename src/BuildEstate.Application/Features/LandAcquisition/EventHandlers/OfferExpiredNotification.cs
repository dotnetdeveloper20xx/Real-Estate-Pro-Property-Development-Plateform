using MediatR;

namespace BuildEstate.Application.Features.LandAcquisition.EventHandlers;

/// <summary>
/// MediatR notification published when an offer expires (ValidUntil date has passed).
/// Used to notify the Acquisition Manager who created the offer.
/// Validates: Requirement 19.2
/// </summary>
public sealed record OfferExpiredNotification : INotification
{
    /// <summary>
    /// The opportunity this offer belongs to.
    /// </summary>
    public Guid OpportunityId { get; init; }

    /// <summary>
    /// The expired offer identifier.
    /// </summary>
    public Guid OfferId { get; init; }

    /// <summary>
    /// The user ID of the Acquisition Manager who created the offer.
    /// </summary>
    public string CreatedBy { get; init; } = string.Empty;
}
