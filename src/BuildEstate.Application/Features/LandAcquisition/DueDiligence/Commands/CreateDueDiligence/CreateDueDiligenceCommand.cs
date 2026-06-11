using BuildEstate.Application.Features.LandAcquisition.DueDiligence.DTOs;
using BuildEstate.Domain.Enums;
using MediatR;

namespace BuildEstate.Application.Features.LandAcquisition.DueDiligence.Commands.CreateDueDiligence;

/// <summary>
/// Command to create a new due diligence check associated with a land opportunity.
/// Status is automatically set to Pending on creation.
/// </summary>
public sealed record CreateDueDiligenceCommand : IRequest<DueDiligenceDto>
{
    public Guid OpportunityId { get; init; }
    public DueDiligenceType Type { get; init; }
    public string? Findings { get; init; }
}
