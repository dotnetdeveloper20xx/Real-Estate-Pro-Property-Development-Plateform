using BuildEstate.Domain.Enums;
using FluentValidation;

namespace BuildEstate.Application.Features.LegalCompliance.Contracts.Commands.TransitionContractStatus;

/// <summary>
/// Validates the TransitionContractStatusCommand input.
/// Enforces status-specific field requirements:
/// - Executed: ExecutionDate (≤ UTC now) + SignatoryNames (≥5 chars)
/// - Terminated: TerminationReason (≥20 chars) + TerminationDate (≤ UTC now)
/// - Approved: ApprovalNotes optional (no additional validation)
/// </summary>
public sealed class TransitionContractStatusCommandValidator
    : AbstractValidator<TransitionContractStatusCommand>
{
    public TransitionContractStatusCommandValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty()
            .WithMessage("Id is required.");

        RuleFor(x => x.NewStatus)
            .IsInEnum()
            .WithMessage("NewStatus must be a valid LegalContractStatus value.");

        // WHEN NewStatus = Executed
        When(x => x.NewStatus == LegalContractStatus.Executed, () =>
        {
            RuleFor(x => x.ExecutionDate)
                .NotEmpty()
                .WithMessage("ExecutionDate is required when transitioning to Executed.")
                .LessThanOrEqualTo(DateTime.UtcNow)
                .WithMessage("ExecutionDate must not be in the future.");

            RuleFor(x => x.SignatoryNames)
                .NotEmpty()
                .WithMessage("SignatoryNames is required when transitioning to Executed.")
                .MinimumLength(5)
                .WithMessage("SignatoryNames must be at least 5 characters.");
        });

        // WHEN NewStatus = Terminated
        When(x => x.NewStatus == LegalContractStatus.Terminated, () =>
        {
            RuleFor(x => x.TerminationReason)
                .NotEmpty()
                .WithMessage("TerminationReason is required when transitioning to Terminated.")
                .MinimumLength(20)
                .WithMessage("TerminationReason must be at least 20 characters.");

            RuleFor(x => x.TerminationDate)
                .NotEmpty()
                .WithMessage("TerminationDate is required when transitioning to Terminated.")
                .LessThanOrEqualTo(DateTime.UtcNow)
                .WithMessage("TerminationDate must not be in the future.");
        });
    }
}
