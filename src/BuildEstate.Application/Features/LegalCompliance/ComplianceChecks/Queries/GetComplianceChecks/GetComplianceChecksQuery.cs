using BuildEstate.Application.Common;
using BuildEstate.Application.Features.LegalCompliance.ComplianceChecks.DTOs;
using BuildEstate.Domain.Enums;
using MediatR;

namespace BuildEstate.Application.Features.LegalCompliance.ComplianceChecks.Queries.GetComplianceChecks;

/// <summary>
/// Query to retrieve a paginated list of compliance checks for a given requirement.
/// Supports filtering by Outcome and date range, ordered by CheckDate descending.
/// </summary>
public sealed record GetComplianceChecksQuery : IRequest<PagedResult<ComplianceCheckDto>>
{
    /// <summary>The compliance requirement to list checks for (required).</summary>
    public Guid ComplianceRequirementId { get; init; }

    /// <summary>Optional filter by check outcome.</summary>
    public ComplianceCheckOutcome? Outcome { get; init; }

    /// <summary>Optional filter: include checks on or after this date.</summary>
    public DateTime? DateFrom { get; init; }

    /// <summary>Optional filter: include checks on or before this date.</summary>
    public DateTime? DateTo { get; init; }

    /// <summary>Page number (1-based). Defaults to 1.</summary>
    public int PageNumber { get; init; } = 1;

    /// <summary>Number of items per page. Defaults to 10.</summary>
    public int PageSize { get; init; } = 10;
}
