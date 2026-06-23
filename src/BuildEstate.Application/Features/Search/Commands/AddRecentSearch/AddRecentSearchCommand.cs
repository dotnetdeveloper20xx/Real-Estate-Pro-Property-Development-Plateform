using MediatR;

namespace BuildEstate.Application.Features.Search.Commands.AddRecentSearch;

/// <summary>
/// Command to persist a search query as a recent search for the current user.
/// </summary>
public sealed record AddRecentSearchCommand : IRequest<Unit>
{
    public string Query { get; init; } = string.Empty;
    public int ResultCount { get; init; }
}
