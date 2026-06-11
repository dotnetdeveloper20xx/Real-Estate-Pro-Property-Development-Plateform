using FluentValidation;

namespace BuildEstate.Application.Features.LandAcquisition.Approvals.Commands.CreateApprovalRequest;

/// <summary>
/// Validates the CreateApprovalRequestCommand ensuring OpportunityId is not empty
/// and RequestedAmount is greater than zero.
/// </summary>
public sealed class CreateApprovalRequestCommandValidator : AbstractValidator<CreateApprovalRequestCommand>
{
    public CreateApprovalRequestCommandValidator()
    {
        RuleFor(x => x.OpportunityId)
            .NotEmpty()
            .WithMessage("OpportunityId is required.");

        RuleFor(x => x.RequestedAmount)
            .GreaterThan(0)
            .WithMessage("RequestedAmount must be greater than zero.");
    }
}
