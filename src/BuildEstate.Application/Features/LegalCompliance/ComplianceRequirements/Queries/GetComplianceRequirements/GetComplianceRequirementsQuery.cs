using BuildEstate.Application.Common;
using BuildEstate.Application.Features.LegalCompliance.ComplianceRequirements.DTOs;
using BuildEstate.Domain.Enums;
using MediatR;

namespace BuildEstate.Application.Features.LegalCompliance.ComplianceRequirements.Queries.GetComplianceRequirements;

/// <summary>
/// Query to retrieve a paginated, filtered, sorted, and searchable list of compliance requirements.
/// Supports filtering by Category, Status, Frequency, ResponsibleRole, and free-text search across Name and Description.
/// </summary>
public sealed record GetComplianceRequirementsQuery : IRequest<PagedResult<ComplianceRequirementDto>>
{
    /// <summary>Optional filter by compliance category.</summary>
    public ComplianceCategory? Category { get; init; }

    /// <summary>Optional filter by requirement status.</summary>
    public ComplianceRequirementStatus? Status { get; init; }

    /// <summary>Optional filter by check frequency.</summary>
    public ComplianceFrequency? Frequency { get; init; }

    /// <summary>Optional filter by responsible role (exact match).</summary>
    public string? ResponsibleRole { get; init; }

    /// <summary>Optional free-text search across Name and Description.</summary>
    public string? SearchTerm { get; init; }

    /// <summary>Page number (1-based). Defaults to 1.</summary>
    public int PageNumber { get; init; } = 1;

    /// <summary>Number of items per page. Defaults to 10.</summary>
    public int PageSize { get; init; } = 10;

    /// <summary>Optional sort field: Name, Category, CreatedAt.</summary>
    public string? SortBy { get; init; }

    /// <summary>Sort direction: "asc" or "desc". Defaults to "desc" (newest first) if SortBy is not specified.</summary>
    public string? SortDirection { get; init; }
}
