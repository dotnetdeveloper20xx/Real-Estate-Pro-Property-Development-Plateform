using BuildEstate.Domain.Enums;

namespace BuildEstate.Application.Features.LandAcquisition.Opportunities.DTOs;

public sealed record ApprovalRequestDto(
    Guid Id,
    Guid OpportunityId,
    ApprovalStatus Status,
    string? ApproverUserId,
    DateTime? ApprovalTimestamp,
    string? ApprovalNotes,
    string? RejectionReason,
    decimal RequestedAmount,
    DateTime CreatedAt,
    string CreatedBy
);
