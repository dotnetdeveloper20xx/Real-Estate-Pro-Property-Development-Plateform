using MediatR;

namespace BuildEstate.Application.Features.Search.Commands.DeleteSavedSearch;

/// <summary>
/// Command to delete a saved search by ID.
/// </summary>
public sealed record DeleteSavedSearchCommand : IRequest<Unit>
{
    public Guid Id { get; init; }
}
