using BuildEstate.Application.Interfaces;
using BuildEstate.Domain.Common;
using BuildEstate.Domain.Entities.Search;
using FluentValidation;
using Microsoft.EntityFrameworkCore;

namespace BuildEstate.Application.Features.Search.Commands.SaveSearch;

/// <summary>
/// Validates SaveSearchCommand: name required, max 50 saved searches per user.
/// </summary>
public sealed class SaveSearchCommandValidator : AbstractValidator<SaveSearchCommand>
{
    private const int MaxSavedSearchesPerUser = 50;

    public SaveSearchCommandValidator(
        IRepository<SavedSearch> savedSearchRepository,
        ICurrentUserService currentUserService)
    {
        RuleFor(x => x.Name)
            .NotEmpty()
            .WithMessage("Name is required.")
            .MaximumLength(200)
            .WithMessage("Name must not exceed 200 characters.");

        RuleFor(x => x.Query)
            .NotEmpty()
            .WithMessage("Query is required.")
            .MaximumLength(200)
            .WithMessage("Query must not exceed 200 characters.");

        RuleFor(x => x)
            .MustAsync(async (_, cancellationToken) =>
            {
                var userId = currentUserService.UserId ?? string.Empty;
                var count = await savedSearchRepository.Query()
                    .CountAsync(ss => ss.UserId == userId, cancellationToken);
                return count < MaxSavedSearchesPerUser;
            })
            .WithMessage($"Maximum of {MaxSavedSearchesPerUser} saved searches per user has been reached.");
    }
}
