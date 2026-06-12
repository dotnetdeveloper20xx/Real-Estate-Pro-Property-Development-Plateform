using BuildEstate.Application.Features.LegalCompliance.Contracts.DTOs;
using MediatR;

namespace BuildEstate.Application.Features.LegalCompliance.Contracts.Commands.UpdateContract;

/// <summary>
/// Command to update an existing contract's editable fields.
/// Only non-null fields are applied (partial update pattern).
/// </summary>
public sealed record UpdateContractCommand : IRequest<ContractDto>
{
    public Guid Id { get; init; }
    public string? Title { get; init; }
    public string? CounterpartyName { get; init; }
    public decimal? ContractValue { get; init; }
    public string? Currency { get; init; }
    public DateTime? StartDate { get; init; }
    public DateTime? EndDate { get; init; }
    public DateTime? RenewalDate { get; init; }
    public string? TerminationClause { get; init; }
    public string? SpecialConditions { get; init; }
    public string? PaymentTerms { get; init; }
}
