using BuildEstate.Application.Features.LandAcquisition.Contracts.DTOs;
using BuildEstate.Domain.Enums;
using MediatR;

namespace BuildEstate.Application.Features.LandAcquisition.Contracts.Commands.TransitionContractStatus;

/// <summary>
/// Command to transition a contract to a new status using the contract state machine.
/// When target status is Exchanged, DepositAmount must be provided and greater than zero.
/// </summary>
public sealed record TransitionContractStatusCommand : IRequest<ContractDto>
{
    public Guid ContractId { get; init; }
    public ContractStatus TargetStatus { get; init; }
    public decimal? DepositAmount { get; init; }
}
