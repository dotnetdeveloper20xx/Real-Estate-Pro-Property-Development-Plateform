using FluentValidation;

namespace BuildEstate.Application.Features.LegalCompliance.LegalCases.Commands.UpdateLegalCase;

/// <summary>
/// Validates the UpdateLegalCaseCommand input fields.
/// Id is always required; optional fields are only validated when provided (non-null).
/// </summary>
public sealed class UpdateLegalCaseCommandValidator : AbstractValidator<UpdateLegalCaseCommand>
{
    public UpdateLegalCaseCommandValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty()
            .WithMessage("Legal case Id is required.");

        RuleFor(x => x.Title)
            .MinimumLength(5)
            .WithMessage("Title must be at least 5 characters.")
            .MaximumLength(200)
            .WithMessage("Title must not exceed 200 characters.")
            .When(x => x.Title is not null);

        RuleFor(x => x.Description)
            .MinimumLength(10)
            .WithMessage("Description must be at least 10 characters.")
            .MaximumLength(2000)
            .WithMessage("Description must not exceed 2000 characters.")
            .When(x => x.Description is not null);

        RuleFor(x => x.Priority)
            .IsInEnum()
            .WithMessage("Priority must be a valid legal case priority.")
            .When(x => x.Priority.HasValue);

        RuleFor(x => x.SolicitorEmail)
            .EmailAddress()
            .WithMessage("SolicitorEmail must be a valid email address.")
            .When(x => x.SolicitorEmail is not null);

        RuleFor(x => x.Notes)
            .MaximumLength(2000)
            .WithMessage("Notes must not exceed 2000 characters.")
            .When(x => x.Notes is not null);
    }
}
