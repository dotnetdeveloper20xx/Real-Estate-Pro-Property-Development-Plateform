using BuildEstate.Application.Features.Search.DTOs;
using MediatR;

namespace BuildEstate.Application.Features.Search.Commands.SaveSearch;

/// <summary>
/// Command to save a search preset with query, filters, and a user-provided name.
/// </summary>
public sealed record SaveSearchCommand : IRequest<SavedSearchDto>
{
    public string Name { get; init; } = string.Empty;
    public string Query { get; init; } = string.Empty;
    public string FiltersJson { get; init; } = "{}";
}
