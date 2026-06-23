using BuildEstate.Application.Features.Search.DTOs;
using MediatR;

namespace BuildEstate.Application.Features.Search.Queries.GetPinnedItems;

/// <summary>
/// Query to retrieve the current user's pinned items ordered by PinnedAt descending.
/// </summary>
public sealed record GetPinnedItemsQuery : IRequest<List<PinnedItemDto>>;
