using FluentValidation;

namespace BuildEstate.Application.Features.UserManagement.Users.Queries.GetUsers;

/// <summary>
/// Validates GetUsersQuery parameters to ensure pagination values
/// are within acceptable bounds and status filter is a valid enum value.
/// </summary>
public sealed class GetUsersQueryValidator : AbstractValidator<GetUsersQuery>
{
    private static readonly int[] AllowedPageSizes = [10, 25, 50];

    public GetUsersQueryValidator()
    {
        RuleFor(x => x.Page)
            .GreaterThanOrEqualTo(1)
            .WithMessage("Page number must be at least 1.");

        RuleFor(x => x.PageSize)
            .Must(size => AllowedPageSizes.Contains(size))
            .WithMessage("Page size must be 10, 25, or 50.");

        RuleFor(x => x.StatusFilter)
            .IsInEnum()
            .WithMessage("Status filter must be All, Active, or Inactive.");
    }
}
