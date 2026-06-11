using BuildEstate.Application.Common;
using BuildEstate.Application.Features.LandAcquisition.Opportunities.DTOs;
using BuildEstate.Domain.Enums;
using MediatR;

namespace BuildEstate.Application.Features.LandAcquisition.Opportunities.Queries.GetOpportunities;

/// <summary>
/// Query to retrieve a paginated, filtered, sorted, and searchable list of land opportunities.
/// Supports pagination (PageNumber, PageSize), filtering by Status/Location/Source/date range,
/// sorting by Name/CreatedAt/LandSize/ExpectedAcquisition/Status, and free-text search
/// across Name, Location, and Source fields.
/// </summary>
public sealed record GetOpportunitiesQuery : IRequest<PagedResult<OpportunityListItemDto>>
{
    /// <summary>Page number (1-based). Defaults to 1.</summary>
    public int PageNumber { get; init; } = 1;

    /// <summary>Number of items per page. Defaults to 10.</summary>
    public int PageSize { get; init; } = 10;

    /// <summary>Optional filter by opportunity status.</summary>
    public OpportunityStatus? Status { get; init; }

    /// <summary>Optional filter by location (contains match).</summary>
    public string? Location { get; init; }

    /// <summary>Optional filter by source (contains match).</summary>
    public string? Source { get; init; }

    /// <summary>Optional filter: expected acquisition date from (inclusive).</summary>
    public DateTime? ExpectedAcquisitionFrom { get; init; }

    /// <summary>Optional filter: expected acquisition date to (inclusive).</summary>
    public DateTime? ExpectedAcquisitionTo { get; init; }

    /// <summary>Optional sort field: Name, CreatedAt, LandSize, ExpectedAcquisition, Status.</summary>
    public string? SortBy { get; init; }

    /// <summary>Sort direction: "asc" or "desc". Defaults to "asc" if SortBy is specified.</summary>
    public string? SortDirection { get; init; }

    /// <summary>Optional free-text search across Name, Location, and Source fields.</summary>
    public string? SearchTerm { get; init; }
}
