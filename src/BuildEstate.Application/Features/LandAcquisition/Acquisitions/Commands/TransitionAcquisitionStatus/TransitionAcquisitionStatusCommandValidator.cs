using BuildEstate.Domain.Enums;
using FluentValidation;

namespace BuildEstate.Application.Features.LandAcquisition.Acquisitions.Commands.TransitionAcquisitionStatus;

/// <summary>
/// Validates the TransitionAcquisitionStatusCommand.
/// Ensures AcquisitionId is present and TargetStatus is a valid enum value.
/// </summary>
public sealed class TransitionAcquisitionStatusCommandValidator : AbstractValidator<TransitionAcquisitionStatusCommand>
{
    public TransitionAcquisitionStatusCommandValidator()
    {
        RuleFor(x => x.AcquisitionId)
            .NotEmpty()
            .WithMessage("AcquisitionId is required.");

        RuleFor(x => x.TargetStatus)
            .IsInEnum()
            .WithMessage("TargetStatus must be a valid AcquisitionStatus value.");
    }
}
