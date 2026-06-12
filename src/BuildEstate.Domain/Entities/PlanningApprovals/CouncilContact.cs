using BuildEstate.Domain.Common;

namespace BuildEstate.Domain.Entities.PlanningApprovals;

public class CouncilContact : BaseEntity
{
    public Guid ApplicationId { get; set; }
    public string CouncilName { get; set; } = string.Empty;
    public string PlanningOfficerName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;

    // Navigation properties
    public PlanningApplication Application { get; set; } = null!;
}
