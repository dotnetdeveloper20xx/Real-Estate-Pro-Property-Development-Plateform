using BuildEstate.Application.Features.LegalCompliance.Contracts.DTOs;
using BuildEstate.Domain.Enums;
using MediatR;

namespace BuildEstate.Application.Features.LegalCompliance.Contracts.Commands.TransitionContractStatus;

/// <summary>
/// Command to transition a contract to a new status.
/// Enforces state machine rules and status-specific field requirements.
/// </summary>
public sealed record TransitionContractStatusCommand : IRequest<ContractDto>
{
    public Guid Id { get; init; }
    public LegalContractStatus NewStatus { get; init; }
    public DateTime? ExecutionDate { get; init; }
    public string? SignatoryNames { get; init; }
    public string? TerminationReason { get; init; }
    public DateTime? TerminationDate { get; init; }
    public string? ApprovalNotes { get; init; }
}
