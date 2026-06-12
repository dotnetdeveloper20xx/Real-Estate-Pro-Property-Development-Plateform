using BuildEstate.Application.Features.PlanningApprovals.Fees.DTOs;
using MediatR;

namespace BuildEstate.Application.Features.PlanningApprovals.Fees.Queries.GetFeeSummary;

/// <summary>
/// Query to retrieve fee totals for a given planning application,
/// grouped by FeeType and PaymentStatus.
/// </summary>
public sealed record GetFeeSummaryQuery : IRequest<List<FeeSummaryDto>>
{
    /// <summary>The planning application to retrieve the fee summary for.</summary>
    public Guid ApplicationId { get; init; }
}
