using MediatR;

namespace BuildEstate.Application.Features.Search.Commands.UnpinItem;

/// <summary>
/// Command to unpin (soft-delete) a pinned item by ID.
/// </summary>
public sealed record UnpinItemCommand : IRequest<Unit>
{
    public Guid Id { get; init; }
}
