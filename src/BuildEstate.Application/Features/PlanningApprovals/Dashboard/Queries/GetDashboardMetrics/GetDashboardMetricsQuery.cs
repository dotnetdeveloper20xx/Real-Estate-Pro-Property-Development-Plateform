using MediatR;

namespace BuildEstate.Application.Features.PlanningApprovals.Dashboard.Queries.GetDashboardMetrics;

/// <summary>
/// Query to retrieve the planning module dashboard KPI metrics.
/// Returns application counts by status, average decision time, approval rate,
/// appeal success rate, outstanding conditions, overdue milestones,
/// recent activity, and applications approaching their target decision date.
/// </summary>
public sealed record GetDashboardMetricsQuery : IRequest<DashboardMetricsDto>;
