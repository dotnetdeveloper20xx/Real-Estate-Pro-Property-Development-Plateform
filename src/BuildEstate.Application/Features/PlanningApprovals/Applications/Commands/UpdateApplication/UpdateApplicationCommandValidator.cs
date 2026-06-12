using BuildEstate.Domain.Enums;
using FluentValidation;

namespace BuildEstate.Application.Features.PlanningApprovals.Applications.Commands.UpdateApplication;

/// <summary>
/// Validates the UpdateApplicationCommand input fields.
/// Applies the same field rules as creation for Description, ApplicationType, and CouncilName.
/// </summary>
public sealed class UpdateApplicationCommandValidator : AbstractValidator<UpdateApplicationCommand>
{
    public UpdateApplicationCommandValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty()
            .WithMessage("Id is required.");

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
