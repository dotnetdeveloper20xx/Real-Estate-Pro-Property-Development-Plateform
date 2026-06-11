using BuildEstate.Domain.Enums;
using FluentValidation;

namespace BuildEstate.Application.Features.LandAcquisition.Opportunities.Commands.TransitionOpportunityStatus;

/// <summary>
/// Validates the TransitionOpportunityStatusCommand input.
/// OpportunityId must be non-empty; WithdrawalReason is required (min 10 chars) when target is Withdrawn.
/// </summary>
public sealed class TransitionOpportunityStatusCommandValidator : AbstractValidator<TransitionOpportunityStatusCommand>
{
    public TransitionOpportunityStatusCommandValidator()
    {
        RuleFor(x => x.OpportunityId)
            .NotEmpty()
            .WithMessage("OpportunityId is required.");

        RuleFor(x => x.TargetStatus)
            .IsInEnum()
            .WithMessage("TargetStatus must be a valid OpportunityStatus value.");

        RuleFor(x => x.WithdrawalReason)
            .NotEmpty()
            .WithMessage("WithdrawalReason is required when transitioning to Withdrawn.")
            .MinimumLength(10)
            .WithMessage("WithdrawalReason must be at least 10 characters.")
            .When(x => x.TargetStatus == OpportunityStatus.Withdrawn);
    }
}
