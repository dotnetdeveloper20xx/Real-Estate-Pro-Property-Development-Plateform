using BuildEstate.Application.Common;
using BuildEstate.Application.Features.LegalCompliance.LegalCases.DTOs;
using BuildEstate.Domain.Enums;
using MediatR;

namespace BuildEstate.Application.Features.LegalCompliance.LegalCases.Queries.GetLegalCases;

/// <summary>
/// Query to retrieve a paginated, filtered, sorted, and searchable list of legal cases.
/// Supports filtering by Status, CaseType, Priority, and free-text search across
/// Title, CaseReference, and AssignedSolicitor fields.
/// </summary>
public sealed record GetLegalCasesQuery : IRequest<PagedResult<LegalCaseListItemDto>>
{
    /// <summary>Optional filter by case status.</summary>
    public LegalCaseStatus? Status { get; init; }

    /// <summary>Optional filter by case type.</summary>
    public LegalCaseType? CaseType { get; init; }

    /// <summary>Optional filter by priority level.</summary>
    public LegalCasePriority? Priority { get; init; }

    /// <summary>Optional free-text search across Title, CaseReference, and AssignedSolicitor.</summary>
    public string? SearchTerm { get; init; }

    /// <summary>Page number (1-based). Defaults to 1.</summary>
    public int PageNumber { get; init; } = 1;

    /// <summary>Number of items per page. Defaults to 10.</summary>
    public int PageSize { get; init; } = 10;

    /// <summary>Optional sort field: Title, CaseReference, CreatedAt, Priority, Status, CaseType.</summary>
    public string? SortBy { get; init; }

    /// <summary>Sort direction: "asc" or "desc". Defaults to "desc" (newest first) if SortBy is not specified.</summary>
    public string? SortDirection { get; init; }
}
