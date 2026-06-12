using BuildEstate.Application.Common;
using BuildEstate.Application.Features.PlanningApprovals.Appeals.DTOs;
using MediatR;

namespace BuildEstate.Application.Features.PlanningApprovals.Appeals.Queries.GetAppeals;

/// <summary>
/// Query to retrieve a paginated list of planning appeals for a given application.
/// Results are ordered by LodgedDate descending (newest first).
/// </summary>
public sealed record GetAppealsQuery : IRequest<PagedResult<AppealDto>>
{
    /// <summary>The planning application to retrieve appeals for.</summary>
    public Guid ApplicationId { get; init; }

    /// <summary>Page number (1-based). Defaults to 1.</summary>
    public int PageNumber { get; init; } = 1;

    /// <summary>Number of items per page. Defaults to 10.</summary>
    public int PageSize { get; init; } = 10;
}
