using System.Security.Claims;
using BuildEstate.Application.Features.Search.Models;

namespace BuildEstate.Application.Features.Search.Interfaces;

/// <summary>
/// Core contract for module-specific search providers. Each module registers one or more
/// providers that search their domain entities with permission-aware filtering.
/// </summary>
public interface ISearchProvider
{
    /// <summary>Unique module identifier (e.g., "land-acquisition").</summary>
    string ModuleId { get; }

    /// <summary>Display name of the searchable entity (e.g., "Land Opportunity").</summary>
    string EntityName { get; }

    /// <summary>Category for grouping results in tabs (e.g., "Land Acquisition").</summary>
    string CategoryName { get; }

    /// <summary>Material Symbols Outlined icon name for this provider's results.</summary>
    string Icon { get; }

    /// <summary>Priority for tab ordering. 1 = highest, 100 = lowest.</summary>
    int Priority { get; }

    /// <summary>
    /// Executes a search with permission filtering applied server-side.
    /// </summary>
    Task<SearchProviderResult> SearchAsync(
        SearchRequest request,
        ClaimsPrincipal user,
        CancellationToken cancellationToken);

    /// <summary>
    /// Returns the count of results matching the query for this provider (permission-filtered).
    /// </summary>
    Task<int> CountAsync(
        string query,
        ClaimsPrincipal user,
        CancellationToken cancellationToken);
}
