using MediatR;

namespace BuildEstate.Application.Features.LandAcquisition.Dashboard.Queries.GetRecentActivity;

/// <summary>
/// Query to retrieve the last 10 status changes across all land opportunities,
/// ordered by most recent activity first.
/// </summary>
public sealed record GetRecentActivityQuery : IRequest<List<RecentActivityDto>>;
