using BuildEstate.Application.Features.LegalCompliance.LegalCases.DTOs;
using BuildEstate.Domain.Enums;
using MediatR;

namespace BuildEstate.Application.Features.LegalCompliance.LegalCases.Commands.TransitionLegalCaseStatus;

/// <summary>
/// Command to transition a legal case to a new status.
/// Enforces state machine rules and status-specific field requirements.
/// </summary>
public sealed record TransitionLegalCaseStatusCommand : IRequest<LegalCaseDto>
{
    public Guid Id { get; init; }
    public LegalCaseStatus NewStatus { get; init; }
    public string? Reason { get; init; }
    public string? ResolutionSummary { get; init; }
    public DateTime? ResolutionDate { get; init; }
    public string? EscalationReason { get; init; }
    public string? HoldReason { get; init; }
}
