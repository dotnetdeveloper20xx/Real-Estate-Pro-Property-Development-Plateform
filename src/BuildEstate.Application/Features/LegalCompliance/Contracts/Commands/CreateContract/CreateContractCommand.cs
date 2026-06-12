using BuildEstate.Application.Features.LegalCompliance.Contracts.DTOs;
using BuildEstate.Domain.Enums;
using MediatR;

namespace BuildEstate.Application.Features.LegalCompliance.Contracts.Commands.CreateContract;

/// <summary>
/// Command to create a new contract associated with a legal case.
/// Sets initial status to Draft and generates a unique contract reference.
/// </summary>
public sealed record CreateContractCommand : IRequest<ContractDto>
{
    public Guid LegalCaseId { get; init; }
    public string Title { get; init; } = string.Empty;
    public LegalContractType ContractType { get; init; }
    public string CounterpartyName { get; init; } = string.Empty;
    public decimal ContractValue { get; init; }
    public string Currency { get; init; } = string.Empty;
    public DateTime StartDate { get; init; }
    public DateTime EndDate { get; init; }
}
