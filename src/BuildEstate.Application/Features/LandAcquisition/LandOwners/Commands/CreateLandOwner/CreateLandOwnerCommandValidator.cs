using BuildEstate.Domain.Enums;
using FluentValidation;

namespace BuildEstate.Application.Features.LandAcquisition.LandOwners.Commands.CreateLandOwner;

/// <summary>
/// Validates the CreateLandOwnerCommand input fields.
/// </summary>
public sealed class CreateLandOwnerCommandValidator : AbstractValidator<CreateLandOwnerCommand>
{
    public CreateLandOwnerCommandValidator()
    {
        RuleFor(x => x.OpportunityId)
            .NotEmpty()
            .WithMessage("OpportunityId is required.");

        RuleFor(x => x.Name)
            .NotEmpty()
            .WithMessage("Name is required.")
            .MinimumLength(2)
            .WithMessage("Name must be at least 2 characters.")
            .MaximumLength(200)
            .WithMessage("Name must not exceed 200 characters.");

        RuleFor(x => x.ContactDetails)
            .NotEmpty()
            .WithMessage("Contact details are required.")
            .MinimumLength(5)
            .WithMessage("Contact details must be at least 5 characters.")
            .MaximumLength(500)
            .WithMessage("Contact details must not exceed 500 characters.");

        RuleFor(x => x.OwnershipType)
            .IsInEnum()
            .WithMessage("OwnershipType must be a valid value (Freehold or Leasehold).");
    }
}
