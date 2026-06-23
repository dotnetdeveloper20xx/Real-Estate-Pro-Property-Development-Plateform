using BuildEstate.Application.Features.Search.Commands.AddRecentSearch;
using BuildEstate.Application.Features.Search.Commands.DeleteSavedSearch;
using BuildEstate.Application.Features.Search.Commands.PinItem;
using BuildEstate.Application.Features.Search.Commands.SaveSearch;
using BuildEstate.Application.Features.Search.Commands.UnpinItem;
using BuildEstate.Application.Features.Search.Queries.ExecuteSearch;
using BuildEstate.Application.Features.Search.Queries.GetPinnedItems;
using BuildEstate.Application.Features.Search.Queries.GetRecentSearches;
using BuildEstate.Application.Features.Search.Queries.GetSavedSearches;
using BuildEstate.Application.Features.Search.Queries.GetSuggestions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace BuildEstate.API.Controllers;

/// <summary>
/// Provides global search endpoints including full-text search, autocomplete suggestions,
/// recent searches, pinned items, and saved searches. All endpoints require authentication.
/// Rate limited to 10 requests per second per authenticated user.
/// </summary>
[Route("api/v1/search")]
[Authorize]
[EnableRateLimiting("SearchRateLimit")]
public class SearchController : BaseApiController
{
    /// <summary>
    /// Executes a global search across all registered modules with optional filtering.
    /// Results are grouped by category, scored by relevancy, and permission-filtered.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Search(
        [FromQuery] string? q,
        [FromQuery] string? modules,
        [FromQuery] string? statuses,
        [FromQuery] DateTime? dateFrom,
        [FromQuery] DateTime? dateTo,
        [FromQuery] string? createdBy,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] int maxPerCategory = 50,
        CancellationToken cancellationToken = default)
    {
        var query = new ExecuteSearchQuery
        {
            Query = q ?? string.Empty,
            Modules = ParseCommaSeparated(modules),
            Statuses = ParseCommaSeparated(statuses),
            DateFrom = dateFrom,
            DateTo = dateTo,
            CreatedBy = createdBy,
            Page = page,
            PageSize = pageSize,
            MaxPerCategory = maxPerCategory
        };

        var result = await Mediator.Send(query, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Returns autocomplete suggestions based on a prefix string.
    /// </summary>
    [HttpGet("suggestions")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetSuggestions(
        [FromQuery] string prefix = "",
        [FromQuery] int limit = 8,
        CancellationToken cancellationToken = default)
    {
        var query = new GetSuggestionsQuery
        {
            Prefix = prefix,
            Limit = limit
        };

        var result = await Mediator.Send(query, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Retrieves the current user's recent searches ordered by most recent first.
    /// </summary>
    [HttpGet("recent")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetRecentSearches(CancellationToken cancellationToken = default)
    {
        var result = await Mediator.Send(new GetRecentSearchesQuery(), cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Persists a search query as a recent search entry for the current user.
    /// </summary>
    [HttpPost("recent")]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> AddRecentSearch(
        [FromBody] AddRecentSearchCommand command,
        CancellationToken cancellationToken = default)
    {
        await Mediator.Send(command, cancellationToken);
        return CreatedAtAction(nameof(GetRecentSearches), null);
    }

    /// <summary>
    /// Retrieves the current user's pinned items ordered by most recently pinned first.
    /// </summary>
    [HttpGet("pinned")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPinnedItems(CancellationToken cancellationToken = default)
    {
        var result = await Mediator.Send(new GetPinnedItemsQuery(), cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Pins a search result entity for quick access.
    /// </summary>
    [HttpPost("pinned")]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> PinItem(
        [FromBody] PinItemCommand command,
        CancellationToken cancellationToken = default)
    {
        var result = await Mediator.Send(command, cancellationToken);
        return CreatedAtAction(nameof(GetPinnedItems), result);
    }

    /// <summary>
    /// Unpins an item by its ID.
    /// </summary>
    [HttpDelete("pinned/{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UnpinItem(Guid id, CancellationToken cancellationToken = default)
    {
        await Mediator.Send(new UnpinItemCommand { Id = id }, cancellationToken);
        return NoContent();
    }

    /// <summary>
    /// Retrieves the current user's saved searches ordered by most recently saved first.
    /// </summary>
    [HttpGet("saved")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetSavedSearches(CancellationToken cancellationToken = default)
    {
        var result = await Mediator.Send(new GetSavedSearchesQuery(), cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Saves a search preset with query text, filters, and a user-provided name.
    /// </summary>
    [HttpPost("saved")]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> SaveSearch(
        [FromBody] SaveSearchCommand command,
        CancellationToken cancellationToken = default)
    {
        var result = await Mediator.Send(command, cancellationToken);
        return CreatedAtAction(nameof(GetSavedSearches), result);
    }

    /// <summary>
    /// Deletes a saved search by its ID.
    /// </summary>
    [HttpDelete("saved/{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteSavedSearch(Guid id, CancellationToken cancellationToken = default)
    {
        await Mediator.Send(new DeleteSavedSearchCommand { Id = id }, cancellationToken);
        return NoContent();
    }

    /// <summary>
    /// Parses a comma-separated string into a list of trimmed, non-empty values.
    /// Returns null if the input is null or empty.
    /// </summary>
    private static List<string>? ParseCommaSeparated(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return null;

        var items = value.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Where(s => !string.IsNullOrWhiteSpace(s))
            .ToList();

        return items.Count > 0 ? items : null;
    }
}
