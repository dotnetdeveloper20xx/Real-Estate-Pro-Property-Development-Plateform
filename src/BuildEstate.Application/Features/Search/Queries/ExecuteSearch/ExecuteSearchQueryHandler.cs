using System.Security.Claims;
using BuildEstate.Application.Features.Search.DTOs;
using BuildEstate.Application.Features.Search.Interfaces;
using BuildEstate.Application.Features.Search.Models;
using BuildEstate.Application.Features.Search.Services;
using BuildEstate.Application.Interfaces;
using BuildEstate.Domain.Common;
using BuildEstate.Domain.Entities.Search;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace BuildEstate.Application.Features.Search.Queries.ExecuteSearch;

/// <summary>
/// Handles ExecuteSearchQuery by normalizing the query, calling the search aggregator,
/// recording the search as a recent search (non-blocking), and returning the response DTO.
/// </summary>
public sealed class ExecuteSearchQueryHandler : IRequestHandler<ExecuteSearchQuery, SearchResponseDto>
{
    private readonly ISearchAggregator _aggregator;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly IRepository<RecentSearch> _recentSearchRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUserService;
    private readonly ILogger<ExecuteSearchQueryHandler> _logger;

    public ExecuteSearchQueryHandler(
        ISearchAggregator aggregator,
        IHttpContextAccessor httpContextAccessor,
        IRepository<RecentSearch> recentSearchRepository,
        IUnitOfWork unitOfWork,
        ICurrentUserService currentUserService,
        ILogger<ExecuteSearchQueryHandler> logger)
    {
        _aggregator = aggregator;
        _httpContextAccessor = httpContextAccessor;
        _recentSearchRepository = recentSearchRepository;
        _unitOfWork = unitOfWork;
        _currentUserService = currentUserService;
        _logger = logger;
    }

    public async Task<SearchResponseDto> Handle(
        ExecuteSearchQuery request,
        CancellationToken cancellationToken)
    {
        // Normalize the query
        var normalizedQuery = SearchNormalizationService.Normalize(request.Query);

        // Build the search request from query properties
        var searchRequest = new SearchRequest
        {
            Query = normalizedQuery,
            Modules = request.Modules?.AsReadOnly(),
            Statuses = request.Statuses?.AsReadOnly(),
            DateFrom = request.DateFrom,
            DateTo = request.DateTo,
            CreatedBy = request.CreatedBy,
            Page = request.Page,
            PageSize = request.PageSize,
            MaxPerCategory = request.MaxPerCategory
        };

        // Get the current user's ClaimsPrincipal for permission-aware search
        var currentUser = _httpContextAccessor.HttpContext?.User
                          ?? new ClaimsPrincipal(new ClaimsIdentity());

        // Execute the search via the aggregator
        var aggregatedResponse = await _aggregator.ExecuteSearchAsync(
            searchRequest, currentUser, cancellationToken);

        // Map aggregated response to the DTO
        var totalPages = request.PageSize > 0
            ? (int)Math.Ceiling((double)aggregatedResponse.TotalCount / request.PageSize)
            : 0;

        var responseDto = new SearchResponseDto
        {
            Categories = aggregatedResponse.Categories,
            TotalCount = aggregatedResponse.TotalCount,
            TimedOutModules = aggregatedResponse.TimedOutModules,
            Query = request.Query,
            Pagination = new PaginationMeta
            {
                Page = request.Page,
                PageSize = request.PageSize,
                TotalCount = aggregatedResponse.TotalCount,
                TotalPages = totalPages
            }
        };

        // Record the search as a recent search (within the same scope — safe with scoped services)
        await RecordRecentSearchAsync(
            request.Query, aggregatedResponse.TotalCount, cancellationToken);

        return responseDto;
    }

    /// <summary>
    /// Persists the search query as a recent search entry. Non-blocking — failures are logged but do not affect response.
    /// </summary>
    private async Task RecordRecentSearchAsync(
        string query, int resultCount, CancellationToken cancellationToken)
    {
        try
        {
            var userId = _currentUserService.UserId;
            if (string.IsNullOrEmpty(userId))
                return;

            var recentSearch = new RecentSearch
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Query = query,
                ResultCount = resultCount,
                SearchedAt = DateTime.UtcNow
            };

            await _recentSearchRepository.AddAsync(recentSearch, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to record recent search for query '{Query}'", query);
        }
    }
}
