using BuildEstate.Application.Features.LandAcquisition.DueDiligence.DTOs;
using BuildEstate.Domain.Enums;
using MediatR;

namespace BuildEstate.Application.Features.LandAcquisition.DueDiligence.Queries.GetDueDiligenceByOpportunity;

/// <summary>
/// Query to retrieve due diligence records for a given opportunity.
/// Supports optional filtering by Type and Status.
/// </summary>
public sealed record GetDueDiligenceByOpportunityQuery : IRequest<List<DueDiligenceDto>>
{
    public Guid OpportunityId { get; init; }
    public DueDiligenceType? Type { get; init; }
    public DueDiligenceStatus? Status { get; init; }
}
