using BuildEstate.Application.Features.LandAcquisition.Opportunities.DTOs;
using MediatR;

namespace BuildEstate.Application.Features.LandAcquisition.Opportunities.Commands.CreateOpportunity;

/// <summary>
/// Command to create a new land opportunity in the pipeline.
/// </summary>
public sealed record CreateOpportunityCommand : IRequest<OpportunityDto>
{
    public string Name { get; init; } = string.Empty;
    public string Location { get; init; } = string.Empty;
    public decimal LandSize { get; init; }
    public string? Source { get; init; }
    public DateTime? ExpectedAcquisition { get; init; }
}
