using BuildEstate.Application.Features.LandAcquisition.Dashboard.Queries.GetDashboardMetrics;
using BuildEstate.Application.Features.LandAcquisition.Dashboard.Queries.GetRecentActivity;
using Microsoft.AspNetCore.Mvc;

namespace BuildEstate.API.Controllers.LandAcquisition;

/// <summary>
/// Provides comprehensive dashboard data for the land acquisition module.
/// Returns KPI metrics, alerts, top opportunities, recent activity,
/// and activity-by-type breakdown in a single endpoint.
/// </summary>
[Route("api/v1/dashboard")]
public class DashboardController : BaseApiController
{
    /// <summary>
    /// Returns the full dashboard data including KPI metrics, pipeline status,
    /// alerts, top opportunities, recent activity, and activity breakdown.
    /// </summary>
    [HttpGet("metrics")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMetrics(CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(new GetDashboardMetricsQuery(), cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Returns the last 10 status changes across all opportunities,
    /// ordered by most recent activity first.
    /// </summary>
    [HttpGet("activity")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetActivity(CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(new GetRecentActivityQuery(), cancellationToken);
        return Ok(result);
    }
}
