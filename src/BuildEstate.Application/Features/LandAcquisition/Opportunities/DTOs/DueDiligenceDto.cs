using BuildEstate.Domain.Enums;

namespace BuildEstate.Application.Features.LandAcquisition.Opportunities.DTOs;

public sealed record DueDiligenceDto(
    Guid Id,
    Guid OpportunityId,
    DueDiligenceType Type,
    DueDiligenceStatus Status,
    string? Findings,
    DateTime? ReportDate,
    DateTime CreatedAt
);
