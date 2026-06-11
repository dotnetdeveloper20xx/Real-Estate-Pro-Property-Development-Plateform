using FluentValidation;

namespace BuildEstate.Application.Features.LandAcquisition.Approvals.Commands.ApproveOrReject;

/// <summary>
/// Validates the ApproveOrRejectCommand ensuring ApprovalRequestId is not empty
/// and when IsApproved is false, a RejectionReason of at least 5 characters is required.
/// </summary>
public sealed class ApproveOrRejectCommandValidator : AbstractValidator<ApproveOrRejectCommand>
{
    public ApproveOrRejectCommandValidator()
    {
        RuleFor(x => x.ApprovalRequestId)
            .NotEmpty()
            .WithMessage("ApprovalRequestId is required.");

        RuleFor(x => x.RejectionReason)
            .NotEmpty()
            .WithMessage("RejectionReason is required when rejecting an approval request.")
            .MinimumLength(5)
            .WithMessage("RejectionReason must be at least 5 characters.")
            .When(x => !x.IsApproved);
    }
}
