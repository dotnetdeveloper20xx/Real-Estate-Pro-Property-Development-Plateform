using BuildEstate.Application.Features.LegalCompliance.Insurance.DTOs;
using BuildEstate.Domain.Enums;
using MediatR;

namespace BuildEstate.Application.Features.LegalCompliance.Insurance.Commands.TransitionInsuranceStatus;

/// <summary>
/// Command to transition an insurance record to a new status.
/// Enforces state machine rules via IInsuranceStateMachine and raises
/// InsuranceExpiringEvent for ExpiringSoon/Expired transitions.
/// </summary>
public sealed record TransitionInsuranceStatusCommand : IRequest<InsuranceRecordDto>
{
    public Guid Id { get; init; }
    public InsuranceStatus NewStatus { get; init; }
}
