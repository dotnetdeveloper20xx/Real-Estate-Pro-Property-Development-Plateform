using FluentValidation;

namespace BuildEstate.Application.Features.LandAcquisition.Acquisitions.Commands.CreateAcquisition;

/// <summary>
/// Validates the CreateAcquisitionCommand ensuring all fields meet business constraints.
/// PurchasePrice must be positive, CompletionDate must be past or present, RegistryRef 3-50 chars.
/// </summary>
public sealed class CreateAcquisitionCommandValidator : AbstractValidator<CreateAcquisitionCommand>
{
    public CreateAcquisitionCommandValidator()
    {
        RuleFor(x => x.OpportunityId)
            .NotEmpty()
            .WithMessage("OpportunityId is required.");

        RuleFor(x => x.PurchasePrice)
            .GreaterThan(0)
            .WithMessage("PurchasePrice must be greater than zero.");

        RuleFor(x => x.CompletionDate)
            .LessThanOrEqualTo(DateTime.UtcNow)
            .WithMessage("CompletionDate must be a past or present date.");

        RuleFor(x => x.RegistryRef)
            .NotEmpty()
            .WithMessage("RegistryRef is required.")
            .MinimumLength(3)
            .WithMessage("RegistryRef must be at least 3 characters.")
            .MaximumLength(50)
            .WithMessage("RegistryRef must not exceed 50 characters.");
    }
}
