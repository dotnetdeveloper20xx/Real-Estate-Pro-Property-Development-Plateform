using BuildEstate.Domain.Common;
using BuildEstate.Domain.Enums;

namespace BuildEstate.Domain.Entities.LandAcquisition;

public class LandAcquisitionRecord : BaseEntity
{
    public Guid OpportunityId { get; set; }
    public decimal PurchasePrice { get; set; }
    public DateTime CompletionDate { get; set; }
    public string RegistryRef { get; set; } = string.Empty;
    public AcquisitionStatus Status { get; set; } = AcquisitionStatus.Completed;

    // Navigation
    public LandOpportunity Opportunity { get; set; } = null!;
}
