using BuildEstate.Application.Features.LandAcquisition.Opportunities.DTOs;
using MediatR;

namespace BuildEstate.Application.Features.LandAcquisition.Opportunities.Commands.UpdateOpportunity;

/// <summary>
/// Command to update an existing land opportunity's editable fields.
/// Includes RowVersion for optimistic concurrency control.
/// </summary>
public sealed record UpdateOpportunityCommand : IRequest<OpportunityDto>
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
    public string? Source { get; init; }
    public DateTime? ExpectedAcquisition { get; init; }
    public byte[] RowVersion { get; init; } = Array.Empty<byte>();
}
