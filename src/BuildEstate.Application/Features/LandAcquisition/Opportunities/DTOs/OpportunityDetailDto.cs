namespace BuildEstate.Application.Features.LandAcquisition.Opportunities.DTOs;

/// <summary>
/// Detailed opportunity DTO including all navigation properties for the detail view.
/// </summary>
public sealed record OpportunityDetailDto
{
    public Guid Id { get; init; }
    public string Name { get; init; } = string.Empty;
    public string Location { get; init; } = string.Empty;
    public string? County { get; init; }
    public decimal LandSize { get; init; }
    public string? SiteType { get; init; }
    public string? CurrentUse { get; init; }
    public string? Tenure { get; init; }
    public string? Description { get; init; }
    public string Status { get; init; } = string.Empty;
    public string? Source { get; init; }
    public DateTime? ExpectedAcquisition { get; init; }
    public DateTime CreatedAt { get; init; }
    public string CreatedBy { get; init; } = string.Empty;
    public string? WithdrawalReason { get; init; }
    public LandOwnerDto? LandOwner { get; init; }
    public List<DueDiligenceDto> DueDiligences { get; init; } = new();
    public List<OfferDto> Offers { get; init; } = new();
    public List<DocumentDto> Documents { get; init; } = new();
    public ContractDto? Contract { get; init; }
    public FeasibilityDto? FeasibilityAssessment { get; init; }
    public List<ApprovalRequestDto> ApprovalRequests { get; init; } = new();
    public byte[] RowVersion { get; init; } = Array.Empty<byte>();
}
