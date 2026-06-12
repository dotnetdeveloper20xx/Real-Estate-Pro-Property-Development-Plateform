using BuildEstate.Application.Common;
using BuildEstate.Application.Features.PlanningApprovals.Fees.DTOs;
using BuildEstate.Domain.Enums;
using MediatR;

namespace BuildEstate.Application.Features.PlanningApprovals.Fees.Queries.GetFees;

/// <summary>
/// Query to retrieve a paginated list of planning fees for a given application,
/// with optional filtering by FeeType and PaymentStatus.
/// </summary>
public sealed record GetFeesQuery : IRequest<PagedResult<FeeDto>>
{
    /// <summary>The planning application to retrieve fees for.</summary>
    public Guid ApplicationId { get; init; }

    /// <summary>Optional filter by fee type.</summary>
    public FeeType? FeeType { get; init; }

    /// <summary>Optional filter by payment status.</summary>
    public PaymentStatus? PaymentStatus { get; init; }

    /// <summary>Page number (1-based). Defaults to 1.</summary>
    public int PageNumber { get; init; } = 1;

    /// <summary>Number of items per page. Defaults to 10.</summary>
    public int PageSize { get; init; } = 10;
}
