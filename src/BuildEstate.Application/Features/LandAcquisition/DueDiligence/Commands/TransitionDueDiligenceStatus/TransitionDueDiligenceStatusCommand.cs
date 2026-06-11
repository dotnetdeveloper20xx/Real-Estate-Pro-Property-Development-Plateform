using BuildEstate.Application.Features.LandAcquisition.DueDiligence.DTOs;
using BuildEstate.Domain.Enums;
using MediatR;

namespace BuildEstate.Application.Features.LandAcquisition.DueDiligence.Commands.TransitionDueDiligenceStatus;

/// <summary>
/// Command to transition a due diligence check to a new status using the due diligence state machine.
/// When target status is Completed or Failed, ReportDate is set automatically to UTC now.
/// </summary>
public sealed record TransitionDueDiligenceStatusCommand : IRequest<DueDiligenceDto>
{
    public Guid DueDiligenceId { get; init; }
    public DueDiligenceStatus TargetStatus { get; init; }
}
