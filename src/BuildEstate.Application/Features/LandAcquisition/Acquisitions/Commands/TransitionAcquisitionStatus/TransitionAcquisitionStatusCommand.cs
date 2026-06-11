using BuildEstate.Application.Features.LandAcquisition.Acquisitions.DTOs;
using BuildEstate.Domain.Enums;
using MediatR;

namespace BuildEstate.Application.Features.LandAcquisition.Acquisitions.Commands.TransitionAcquisitionStatus;

/// <summary>
/// Command to transition a land acquisition record to a new status.
/// Only valid transition is Completed → Registered.
/// When transitioning to Registered, the parent opportunity is cascaded to Acquired.
/// </summary>
public sealed record TransitionAcquisitionStatusCommand : IRequest<AcquisitionDto>
{
    public Guid AcquisitionId { get; init; }
    public AcquisitionStatus TargetStatus { get; init; }
}
