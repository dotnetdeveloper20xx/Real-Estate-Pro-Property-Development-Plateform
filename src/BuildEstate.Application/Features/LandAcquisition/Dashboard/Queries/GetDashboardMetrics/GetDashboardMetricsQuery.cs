using BuildEstate.Application.Features.LandAcquisition.Dashboard.DTOs;
using MediatR;

namespace BuildEstate.Application.Features.LandAcquisition.Dashboard.Queries.GetDashboardMetrics;

/// <summary>
/// Query to retrieve dashboard KPI metrics for the land acquisition module.
/// Returns aggregated statistics across all opportunities and due diligence records.
/// </summary>
public sealed record GetDashboardMetricsQuery : IRequest<DashboardMetricsDto>;
