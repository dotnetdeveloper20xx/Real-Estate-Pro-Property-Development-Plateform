using BuildEstate.Domain.Enums;
using FluentValidation;

namespace BuildEstate.Application.Features.PlanningApprovals.Applications.Commands.CreateApplication;

/// <summary>
/// Validates the CreateApplicationCommand input fields.
/// </summary>
public sealed class CreateApplicationCommandValidator : AbstractValidator<CreateApplicationCommand>
{
    public CreateApplicationCommandValidator()
    {
        RuleFor(x => x.OpportunityId)
            .NotEmpty()
            .WithMessage("OpportunityId is required.");

        RuleFor(x => x.Description)
            .NotEmpty()
            .WithMessage("Description is required.")
            .MinimumLength(10)
            .WithMessage("Description must be at least 10 characters.")
            .MaximumLength(2000)
            .WithMessage("Description must not exceed 2000 characters.");

        RuleFor(x => x.ApplicationType)
            .IsInEnum()
            .WithMessage("ApplicationType must be a valid planning application type.");

        RuleFor(x => x.CouncilName)
            .NotEmpty()
            .WithMessage("CouncilName is required.")
            .MinimumLength(3)
            .WithMessage("CouncilName must be at least 3 characters.")
            .MaximumLength(200)
            .WithMessage("CouncilName must not exceed 200 characters.");
    }
}
