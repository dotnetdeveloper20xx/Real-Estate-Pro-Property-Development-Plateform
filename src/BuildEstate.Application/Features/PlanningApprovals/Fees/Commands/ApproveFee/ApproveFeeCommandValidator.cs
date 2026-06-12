using FluentValidation;

namespace BuildEstate.Application.Features.PlanningApprovals.Fees.Commands.ApproveFee;

/// <summary>
/// Validates the ApproveFeeCommand input fields.
/// FeeId is required; ApprovalNotes is optional but limited in length when provided.
/// </summary>
public sealed class ApproveFeeCommandValidator : AbstractValidator<ApproveFeeCommand>
{
    public ApproveFeeCommandValidator()
    {
        RuleFor(x => x.FeeId)
            .NotEmpty()
            .WithMessage("FeeId is required.");

        RuleFor(x => x.ApprovalNotes)
            .MaximumLength(1000)
            .WithMessage("ApprovalNotes must not exceed 1000 characters.")
            .When(x => x.ApprovalNotes is not null);
    }
}
