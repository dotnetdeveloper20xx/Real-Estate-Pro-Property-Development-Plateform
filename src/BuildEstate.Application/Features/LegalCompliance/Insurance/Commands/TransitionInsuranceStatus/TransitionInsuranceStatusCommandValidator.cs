using BuildEstate.Domain.Enums;
using FluentValidation;

namespace BuildEstate.Application.Features.LegalCompliance.Insurance.Commands.TransitionInsuranceStatus;

/// <summary>
/// Validates the TransitionInsuranceStatusCommand input.
/// Ensures Id is present and NewStatus is a valid InsuranceStatus enum value.
/// </summary>
public sealed class TransitionInsuranceStatusCommandValidator
    : AbstractValidator<TransitionInsuranceStatusCommand>
{
    public TransitionInsuranceStatusCommandValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty()
            .WithMessage("Insurance record Id is required.");

        RuleFor(x => x.NewStatus)
            .IsInEnum()
            .WithMessage("NewStatus must be a valid InsuranceStatus value.");
    }
}
