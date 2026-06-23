using BuildEstate.Application.Features.Search.DTOs;
using MediatR;

namespace BuildEstate.Application.Features.Search.Commands.PinItem;

/// <summary>
/// Command to pin a search result entity for quick access.
/// </summary>
public sealed record PinItemCommand : IRequest<PinnedItemDto>
{
    public Guid EntityId { get; init; }
    public string EntityType { get; init; } = string.Empty;
    public string Title { get; init; } = string.Empty;
    public string? Subtitle { get; init; }
    public string Icon { get; init; } = string.Empty;
    public string Category { get; init; } = string.Empty;
    public string NavigationRoute { get; init; } = string.Empty;
}
