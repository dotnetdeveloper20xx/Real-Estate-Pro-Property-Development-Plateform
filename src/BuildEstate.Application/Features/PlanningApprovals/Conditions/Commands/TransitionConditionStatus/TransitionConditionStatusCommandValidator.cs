using BuildEstate.Domain.Enums;
using FluentValidation;

namespace BuildEstate.Application.Features.PlanningApprovals.Conditions.Commands.TransitionConditionStatus;

/// <summary>
/// Validates the TransitionConditionStatusCommand input.
/// ConditionId must be non-empty; NewStatus must be a valid enum value.
/// When transitioning to Discharged, DischargeDate (past/present UTC) and DischargeReference (3-50 chars) are required.
/// When provided outside of Discharged transition, DischargeDate and DischargeReference are still validated for format.
/// </summary>
public sealed class TransitionConditionStatusCommandValidator : AbstractValidator<TransitionConditionStatusCommand>
{
    public TransitionConditionStatusCommandValidator()
    {
        RuleFor(x => x.ConditionId)
            .NotEmpty()
            .WithMessage("ConditionId is required.");

        RuleFor(x => x.NewStatus)
            .IsInEnum()
            .WithMessage("NewStatus must be a valid ConditionStatus value.");

        // When transitioning to Discharged, DischargeDate and DischargeReference are mandatory
        RuleFor(x => x.DischargeDate)
            .NotNull()
            .WithMessage("DischargeDate is required when transitioning to Discharged.")
            .When(x => x.NewStatus == ConditionStatus.Discharged);

        // When DischargeDate is provided, it must be a past or present UTC date
        RuleFor(x => x.DischargeDate)
            .LessThanOrEqualTo(DateTime.UtcNow)
            .WithMessage("DischargeDate must be a past or present UTC date.")
            .When(x => x.DischargeDate.HasValue);

        // When transitioning to Discharged, DischargeReference is mandatory
        RuleFor(x => x.DischargeReference)
            .NotEmpty()
            .WithMessage("DischargeReference is required when transitioning to Discharged.")
            .When(x => x.NewStatus == ConditionStatus.Discharged);

        // When DischargeReference is provided, validate length constraints
        RuleFor(x => x.DischargeReference)
            .MinimumLength(3)
            .WithMessage("DischargeReference must be at least 3 characters.")
            .MaximumLength(50)
            .WithMessage("DischargeReference must not exceed 50 characters.")
            .When(x => !string.IsNullOrEmpty(x.DischargeReference));
    }
}
