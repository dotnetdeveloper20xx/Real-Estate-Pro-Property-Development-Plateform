using FluentValidation;

namespace BuildEstate.Application.Features.Search.Queries.ExecuteSearch;

/// <summary>
/// FluentValidation validator for ExecuteSearchQuery.
/// Enforces query length constraints, pagination bounds, and date range logic.
/// </summary>
public sealed class ExecuteSearchQueryValidator : AbstractValidator<ExecuteSearchQuery>
{
    public ExecuteSearchQueryValidator()
    {
        RuleFor(x => x.Query)
            .NotEmpty()
                .WithMessage("Search query is required.")
            .MinimumLength(1)
                .WithMessage("Search query must be at least 1 character.")
            .MaximumLength(200)
                .WithMessage("Search query must not exceed 200 characters.");

        RuleFor(x => x.Page)
            .GreaterThanOrEqualTo(1)
                .WithMessage("Page number must be at least 1.");

        RuleFor(x => x.PageSize)
            .InclusiveBetween(1, 50)
                .WithMessage("Page size must be between 1 and 50.");

        RuleFor(x => x.DateTo)
            .GreaterThanOrEqualTo(x => x.DateFrom)
                .When(x => x.DateFrom.HasValue && x.DateTo.HasValue)
                .WithMessage("Date To must be greater than or equal to Date From.");
    }
}
