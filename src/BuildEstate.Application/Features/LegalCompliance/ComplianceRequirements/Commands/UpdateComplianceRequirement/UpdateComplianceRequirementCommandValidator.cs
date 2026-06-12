using BuildEstate.Domain.Enums;
using FluentValidation;

namespace BuildEstate.Application.Features.LegalCompliance.ComplianceRequirements.Commands.UpdateComplianceRequirement;

/// <summary>
/// Validates the UpdateComplianceRequirementCommand input fields.
/// Id is always required; optional fields are only validated when provided (non-null).
/// </summary>
public sealed class UpdateComplianceRequirementCommandValidator : AbstractValidator<UpdateComplianceRequirementCommand>
{
    public UpdateComplianceRequirementCommandValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty()
            .WithMessage("Compliance requirement Id is required.");

        RuleFor(x => x.Name)
            .MinimumLength(5)
            .WithMessage("Name must be at least 5 characters.")
            .MaximumLength(200)
            .WithMessage("Name must not exceed 200 characters.")
            .When(x => x.Name is not null);

        RuleFor(x => x.Description)
            .MinimumLength(10)
            .WithMessage("Description must be at least 10 characters.")
            .MaximumLength(2000)
            .WithMessage("Description must not exceed 2000 characters.")
            .When(x => x.Description is not null);

        RuleFor(x => x.SourceRegulation)
            .MinimumLength(3)
            .WithMessage("SourceRegulation must be at least 3 characters.")
            .MaximumLength(300)
            .WithMessage("SourceRegulation must not exceed 300 characters.")
            .When(x => x.SourceRegulation is not null);

        RuleFor(x => x.Frequency)
            .IsInEnum()
            .WithMessage("Frequency must be a valid compliance frequency.")
            .When(x => x.Frequency.HasValue);

        RuleFor(x => x.ResponsibleRole)
            .MaximumLength(100)
            .WithMessage("ResponsibleRole must not exceed 100 characters.")
            .When(x => x.ResponsibleRole is not null);
    }
}
