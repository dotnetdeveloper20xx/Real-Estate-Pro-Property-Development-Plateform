using BuildEstate.Application.Features.PlanningApprovals.Conditions.DTOs;
using BuildEstate.Application.Features.PlanningApprovals.CouncilContacts.DTOs;
using BuildEstate.Application.Features.PlanningApprovals.Documents.DTOs;
using BuildEstate.Application.Features.PlanningApprovals.Fees.DTOs;
using BuildEstate.Application.Features.PlanningApprovals.Milestones.DTOs;

namespace BuildEstate.Application.Features.PlanningApprovals.Applications.DTOs;

/// <summary>
/// Rich detail DTO for a single planning application retrieved by Id.
/// Includes all application fields plus related collections (conditions, documents,
/// fees, milestones), the council contact, and a LandOpportunity summary.
/// </summary>
public sealed record ApplicationDetailDto
{
    // Core application fields
    public Guid Id { get; init; }
    public Guid OpportunityId { get; init; }
    public string Description { get; init; } = string.Empty;
    public string ApplicationType { get; init; } = string.Empty;
    public string Status { get; init; } = string.Empty;
    public string? ApplicationReference { get; init; }
    public string CouncilName { get; init; } = string.Empty;
    public DateTime? SubmissionDate { get; init; }
    public DateTime? TargetDecisionDate { get; init; }
    public DateTime? ActualDecisionDate { get; init; }
    public DateTime? DecisionDate { get; init; }
    public string? WithdrawalReason { get; init; }
    public DateTime CreatedAt { get; init; }
    public string CreatedBy { get; init; } = string.Empty;
    public DateTime? UpdatedAt { get; init; }
    public string? UpdatedBy { get; init; }

    // Related entities
    public CouncilContactDto? CouncilContact { get; init; }
    public IReadOnlyList<ConditionDto> Conditions { get; init; } = [];
    public IReadOnlyList<DocumentDto> Documents { get; init; } = [];
    public IReadOnlyList<FeeDto> Fees { get; init; } = [];
    public IReadOnlyList<MilestoneDto> Milestones { get; init; } = [];

    // Linked LandOpportunity summary
    public OpportunitySummaryDto? Opportunity { get; init; }
}
