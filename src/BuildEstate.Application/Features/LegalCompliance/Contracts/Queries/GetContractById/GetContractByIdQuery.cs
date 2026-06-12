using BuildEstate.Application.Features.LegalCompliance.Contracts.DTOs;
using MediatR;

namespace BuildEstate.Application.Features.LegalCompliance.Contracts.Queries.GetContractById;

/// <summary>
/// Query to retrieve a single contract by its unique identifier,
/// including related documents, linked legal case reference,
/// and permitted status transitions from the state machine.
/// </summary>
public sealed record GetContractByIdQuery : IRequest<ContractDetailDto>
{
    public Guid Id { get; init; }
}
