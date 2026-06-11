using BuildEstate.Domain.Common;
using BuildEstate.Domain.Enums;

namespace BuildEstate.Domain.Entities.LandAcquisition;

public class Contract : BaseEntity
{
    public Guid OpportunityId { get; set; }
    public ContractStatus Status { get; set; } = ContractStatus.Draft;
    public string? SolicitorName { get; set; }
    public string? SolicitorFirm { get; set; }
    public string? SolicitorContact { get; set; }
    public decimal? DepositAmount { get; set; }

    // Navigation
    public LandOpportunity Opportunity { get; set; } = null!;
}
