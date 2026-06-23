using FluentValidation;

namespace BuildEstate.Application.Features.Search.Commands.PinItem;

/// <summary>
/// Validates PinItemCommand: entityId and entityType are required.
/// </summary>
public sealed class PinItemCommandValidator : AbstractValidator<PinItemCommand>
{
    public PinItemCommandValidator()
    {
        RuleFor(x => x.EntityId)
            .NotEmpty()
            .WithMessage("EntityId is required.");

        RuleFor(x => x.EntityType)
            .NotEmpty()
            .WithMessage("EntityType is required.")
            .MaximumLength(100)
            .WithMessage("EntityType must not exceed 100 characters.");

        RuleFor(x => x.Title)
            .NotEmpty()
            .WithMessage("Title is required.")
            .MaximumLength(500)
            .WithMessage("Title must not exceed 500 characters.");

        RuleFor(x => x.NavigationRoute)
            .NotEmpty()
            .WithMessage("NavigationRoute is required.");
    }
}
