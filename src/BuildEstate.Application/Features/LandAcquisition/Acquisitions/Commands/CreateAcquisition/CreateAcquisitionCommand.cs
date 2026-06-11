using BuildEstate.Application.Features.LandAcquisition.Acquisitions.DTOs;
using MediatR;

namespace BuildEstate.Application.Features.LandAcquisition.Acquisitions.Commands.CreateAcquisition;

/// <summary>
/// Command to create a land acquisition record for a given opportunity.
/// Only one active acquisition record is allowed per opportunity.
/// </summary>
public sealed record CreateAcquisitionCommand : IRequest<AcquisitionDto>
{
    public Guid OpportunityId { get; init; }
    public decimal PurchasePrice { get; init; }
    public DateTime CompletionDate { get; init; }
    public string RegistryRef { get; init; } = string.Empty;
}
