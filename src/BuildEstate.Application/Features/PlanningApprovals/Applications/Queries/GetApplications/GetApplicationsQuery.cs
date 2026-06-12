using BuildEstate.Application.Common;
using BuildEstate.Application.Features.PlanningApprovals.Applications.DTOs;
using BuildEstate.Domain.Enums;
using MediatR;

namespace BuildEstate.Application.Features.PlanningApprovals.Applications.Queries.GetApplications;

/// <summary>
/// Query to retrieve a paginated list of planning applications with support for
/// filtering by Status, ApplicationType, CouncilName, and SubmissionDate range;
/// sorting by Description, CreatedAt, SubmissionDate, TargetDecisionDate, Status;
/// and free-text search across Description, ApplicationReference, CouncilName,
/// and linked LandOpportunity Name.
/// </summary>
public sealed record GetApplicationsQuery : IRequest<PagedResult<ApplicationListItemDto>>
{
    /// <summary>Optional filter by planning application status.</summary>
    public PlanningApplicationStatus? Status { get; init; }

    /// <summary>Optional filter by application type.</summary>
    public PlanningApplicationType? ApplicationType { get; init; }

    /// <summary>Optional filter by council name (exact match).</summary>
    public string? CouncilName { get; init; }

    /// <summary>Optional filter: submission date from (inclusive).</summary>
    public DateTime? SubmissionDateFrom { get; init; }

    /// <summary>Optional filter: submission date to (inclusive).</summary>
    public DateTime? SubmissionDateTo { get; init; }

    /// <summary>
    /// Optional free-text search term applied across Description, ApplicationReference,
    /// CouncilName, and linked LandOpportunity Name.
    /// </summary>
    public string? SearchTerm { get; init; }

    /// <summary>
    /// Sort field. Valid values: Description, CreatedAt, SubmissionDate, TargetDecisionDate, Status.
    /// Defaults to CreatedAt.
    /// </summary>
    public string? SortBy { get; init; }

    /// <summary>
    /// Sort direction: "asc" or "desc". Defaults to "desc".
    /// </summary>
    public string? SortDirection { get; init; }

    /// <summary>Page number (1-based). Defaults to 1.</summary>
    public int PageNumber { get; init; } = 1;

    /// <summary>Number of items per page. Defaults to 10.</summary>
    public int PageSize { get; init; } = 10;
}
