using FluentValidation;

namespace BuildEstate.Application.Features.Search.Queries.GetSuggestions;

/// <summary>
/// Validates GetSuggestionsQuery: prefix min 2 chars, max 100 chars; limit 1–20.
/// </summary>
public sealed class GetSuggestionsQueryValidator : AbstractValidator<GetSuggestionsQuery>
{
    public GetSuggestionsQueryValidator()
    {
        RuleFor(x => x.Prefix)
            .NotEmpty()
            .WithMessage("Prefix is required.")
            .MinimumLength(2)
            .WithMessage("Prefix must be at least 2 characters.")
            .MaximumLength(100)
            .WithMessage("Prefix must not exceed 100 characters.");

        RuleFor(x => x.Limit)
            .InclusiveBetween(1, 20)
            .WithMessage("Limit must be between 1 and 20.");
    }
}
