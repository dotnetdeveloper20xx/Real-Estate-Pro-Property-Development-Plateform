using FluentValidation;

namespace BuildEstate.Application.Features.UserManagement.Roles.Queries.GetRoles;

/// <summary>
/// Validates GetRolesQuery parameters to ensure pagination values are within allowed bounds.
/// </summary>
public sealed class GetRolesQueryValidator : AbstractValidator<GetRolesQuery>
{
    private static readonly int[] AllowedPageSizes = [10, 25, 50];

    public GetRolesQueryValidator()
    {
        RuleFor(x => x.Page)
            .GreaterThanOrEqualTo(1)
            .WithMessage("Page number must be at least 1.");

        RuleFor(x => x.PageSize)
            .Must(size => AllowedPageSizes.Contains(size))
            .WithMessage("Page size must be 10, 25, or 50.");
    }
}
