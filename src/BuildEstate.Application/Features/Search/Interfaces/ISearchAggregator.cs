using System.Security.Claims;
using BuildEstate.Application.Features.Search.Models;

namespace BuildEstate.Application.Features.Search.Interfaces;

/// <summary>
/// Orchestrates parallel search across all registered providers, applies scoring,
/// groups results by category, and enforces per-category and total result limits.
/// </summary>
public interface ISearchAggregator
{
    /// <summary>
    /// Executes search across all applicable providers in parallel, aggregates and scores results.
    /// </summary>
    Task<AggregatedSearchResponse> ExecuteSearchAsync(
        SearchRequest request,
        ClaimsPrincipal user,
        CancellationToken cancellationToken);
}
