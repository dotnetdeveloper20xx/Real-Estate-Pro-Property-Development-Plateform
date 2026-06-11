using BuildEstate.Domain.Common;
using BuildEstate.Domain.Enums;

namespace BuildEstate.Domain.Entities.LandAcquisition;

public class LandOwner : BaseEntity
{
    public Guid OpportunityId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string ContactDetails { get; set; } = string.Empty;
    public string? Address { get; set; }
    public OwnershipType OwnershipType { get; set; }

    // Navigation
    public LandOpportunity Opportunity { get; set; } = null!;
}
