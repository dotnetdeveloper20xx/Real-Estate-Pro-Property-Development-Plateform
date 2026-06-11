namespace BuildEstate.Application.Features.LandAcquisition.Approvals.DTOs;

/// <summary>
/// Data transfer object representing an approval request for a land acquisition decision.
/// </summary>
public sealed record ApprovalRequestDto(
    Guid Id,
    Guid OpportunityId,
    string Status,
    string? ApproverUserId,
    DateTime? ApprovalTimestamp,
    string? ApprovalNotes,
    string? RejectionReason,
    decimal RequestedAmount,
    DateTime CreatedAt,
    string CreatedBy);
