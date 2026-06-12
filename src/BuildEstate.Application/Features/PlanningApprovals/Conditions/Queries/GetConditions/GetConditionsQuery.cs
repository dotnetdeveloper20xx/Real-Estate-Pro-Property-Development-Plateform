using BuildEstate.Application.Common;
using BuildEstate.Application.Features.PlanningApprovals.Conditions.DTOs;
using BuildEstate.Domain.Enums;
using MediatR;

namespace BuildEstate.Application.Features.PlanningApprovals.Conditions.Queries.GetConditions;

/// <summary>
/// Query to retrieve a paginated list of planning conditions for a given application,
/// with optional filtering by Status and ConditionType.
/// </summary>
public sealed record GetConditionsQuery : IRequest<PagedResult<ConditionDto>>
{
    /// <summary>The planning application to retrieve conditions for.</summary>
    public Guid ApplicationId { get; init; }

    /// <summary>Optional filter by condition status.</summary>
    public ConditionStatus? Status { get; init; }

    /// <summary>Optional filter by condition type.</summary>
    public ConditionType? ConditionType { get; init; }

    /// <summary>Page number (1-based). Defaults to 1.</summary>
    public int PageNumber { get; init; } = 1;

    /// <summary>Number of items per page. Defaults to 10.</summary>
    public int PageSize { get; init; } = 10;
}
