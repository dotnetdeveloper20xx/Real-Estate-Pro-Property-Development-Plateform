using BuildEstate.Application.Features.LandAcquisition.Contracts.DTOs;
using MediatR;

namespace BuildEstate.Application.Features.LandAcquisition.Contracts.Commands.CreateContract;

/// <summary>
/// Command to create a new contract for a land opportunity.
/// The opportunity must have at least one accepted offer.
/// </summary>
public sealed record CreateContractCommand : IRequest<ContractDto>
{
    public Guid OpportunityId { get; init; }
    public string? SolicitorName { get; init; }
    public string? SolicitorFirm { get; init; }
    public string? SolicitorContact { get; init; }
}
