using FluentValidation;

namespace BuildEstate.Application.Features.LegalCompliance.ComplianceRequirements.Commands.CreateComplianceRequirement;

/// <summary>
/// Validates the CreateComplianceRequirementCommand input fields.
/// Enforces field lengths, valid enum values, and required fields.
/// </summary>
public sealed class CreateComplianceRequirementCommandValidator : AbstractValidator<CreateComplianceRequirementCommand>
{
    public CreateComplianceRequirementCommandValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty()
            .WithMessage("Name is required.")
            .MinimumLength(5)
            .WithMessage("Name must be at least 5 characters.")
            .MaximumLength(200)
            .WithMessage("Name must not exceed 200 characters.");

        RuleFor(x => x.Category)
            .IsInEnum()
            .WithMessage("Category must be a valid compliance category.");

        RuleFor(x => x.Description)
            .NotEmpty()
            .WithMessage("Description is required.")
            .MinimumLength(10)
            .WithMessage("Description must be at least 10 characters.")
            .MaximumLength(2000)
            .WithMessage("Description must not exceed 2000 characters.");

        RuleFor(x => x.SourceRegulation)
            .NotEmpty()
            .WithMessage("SourceRegulation is required.")
            .MinimumLength(3)
            .WithMessage("SourceRegulation must be at least 3 characters.")
            .MaximumLength(300)
            .WithMessage("SourceRegulation must not exceed 300 characters.");

        RuleFor(x => x.Frequency)
            .IsInEnum()
            .WithMessage("Frequency must be a valid compliance frequency.");

        RuleFor(x => x.ResponsibleRole)
            .NotEmpty()
            .WithMessage("ResponsibleRole is required.")
            .MaximumLength(100)
            .WithMessage("ResponsibleRole must not exceed 100 characters.");
    }
}
