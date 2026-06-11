using BuildEstate.Domain.Common;
using BuildEstate.Domain.Enums;

namespace BuildEstate.Domain.Entities.LandAcquisition;

public class Offer : BaseEntity
{
    public Guid OpportunityId { get; set; }
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "GBP";
    public DateTime OfferDate { get; set; }
    public DateTime ValidUntil { get; set; }
    public OfferStatus Status { get; set; } = OfferStatus.UnderReview;
    public decimal? CounterOfferAmount { get; set; }
    public Guid? OriginalOfferId { get; set; }

    // Navigation
    public LandOpportunity Opportunity { get; set; } = null!;
    public Offer? OriginalOffer { get; set; }
}
