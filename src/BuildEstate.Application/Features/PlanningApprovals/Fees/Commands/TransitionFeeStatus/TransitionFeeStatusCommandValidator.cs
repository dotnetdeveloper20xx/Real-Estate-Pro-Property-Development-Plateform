using BuildEstate.Domain.Enums;
using FluentValidation;

namespace BuildEstate.Application.Features.PlanningApprovals.Fees.Commands.TransitionFeeStatus;

/// <summary>
/// Validates basic field presence for the TransitionFeeStatusCommand.
/// Business rules (state machine validation, threshold enforcement) are enforced in the handler.
/// </summary>
public sealed class TransitionFeeStatusCommandValidator : AbstractValidator<TransitionFeeStatusCommand>
{
    public TransitionFeeStatusCommandValidator()
    {
        RuleFor(x => x.FeeId)
            .NotEmpty()
            .WithMessage("FeeId is required.");

        RuleFor(x => x.NewStatus)
            .IsInEnum()
            .WithMessage("NewStatus must be a valid PaymentStatus value.");
    }
}
