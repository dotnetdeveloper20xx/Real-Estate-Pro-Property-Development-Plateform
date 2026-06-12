using FluentValidation;

namespace BuildEstate.Application.Features.PlanningApprovals.CouncilContacts.Commands.UpdateCouncilContact;

/// <summary>
/// Validates the UpdateCouncilContactCommand input fields.
/// </summary>
public sealed class UpdateCouncilContactCommandValidator : AbstractValidator<UpdateCouncilContactCommand>
{
    public UpdateCouncilContactCommandValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty()
            .WithMessage("Council contact ID is required.");

        RuleFor(x => x.CouncilName)
            .NotEmpty()
            .WithMessage("Council name is required.")
            .MinimumLength(3)
            .WithMessage("Council name must be at least 3 characters.")
            .MaximumLength(200)
            .WithMessage("Council name must not exceed 200 characters.");

        RuleFor(x => x.PlanningOfficerName)
            .NotEmpty()
            .WithMessage("Planning officer name is required.")
            .MinimumLength(2)
            .WithMessage("Planning officer name must be at least 2 characters.")
            .MaximumLength(150)
            .WithMessage("Planning officer name must not exceed 150 characters.");

        RuleFor(x => x.Email)
            .NotEmpty()
            .WithMessage("Email is required.")
            .EmailAddress()
            .WithMessage("A valid email address is required.");

        RuleFor(x => x.Phone)
            .NotEmpty()
            .WithMessage("Phone number is required.")
            .MinimumLength(7)
            .WithMessage("Phone number must be at least 7 characters.")
            .MaximumLength(20)
            .WithMessage("Phone number must not exceed 20 characters.");

        RuleFor(x => x.Address)
            .NotEmpty()
            .WithMessage("Address is required.")
            .MinimumLength(10)
            .WithMessage("Address must be at least 10 characters.")
            .MaximumLength(500)
            .WithMessage("Address must not exceed 500 characters.");
    }
}
