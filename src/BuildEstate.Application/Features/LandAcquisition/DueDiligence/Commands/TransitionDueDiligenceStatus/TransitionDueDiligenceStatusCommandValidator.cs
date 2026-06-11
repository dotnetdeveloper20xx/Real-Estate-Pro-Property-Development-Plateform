using BuildEstate.Domain.Enums;
using FluentValidation;

namespace BuildEstate.Application.Features.LandAcquisition.DueDiligence.Commands.TransitionDueDiligenceStatus;

/// <summary>
/// Validates the TransitionDueDiligenceStatusCommand.
/// Ensures DueDiligenceId is present and TargetStatus is a valid DueDiligenceStatus enum value.
/// </summary>
public sealed class TransitionDueDiligenceStatusCommandValidator : AbstractValidator<TransitionDueDiligenceStatusCommand>
{
    public TransitionDueDiligenceStatusCommandValidator()
    {
        RuleFor(x => x.DueDiligenceId)
            .NotEmpty()
            .WithMessage("DueDiligenceId is required.");

        RuleFor(x => x.TargetStatus)
            .IsInEnum()
            .WithMessage("TargetStatus must be a valid DueDiligenceStatus value (Pending, InProgress, Completed, or Failed).");
    }
}
