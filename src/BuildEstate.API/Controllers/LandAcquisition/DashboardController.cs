using BuildEstate.Application.Features.LandAcquisition.Dashboard.Queries.GetDashboardMetrics;
using BuildEstate.Application.Features.LandAcquisition.Dashboard.Queries.GetRecentActivity;
using Microsoft.AspNetCore.Mvc;

namespace BuildEstate.API.Controllers.LandAcquisition;

/// <summary>
/// Provides dashboard KPI metrics and recent activity data for the
/// land acquisition module. All endpoints are accessible by any
/// authenticated user (base [Authorize] from BaseApiController).
/// </summary>
[Route("api/v1/dashboard")]
public class DashboardController : BaseApiController
{
    /// <summary>
    /// Returns aggregated KPI metrics including opportunities by status,
    /// average acquisition cycle, conversion rate, due diligence pass rate,
    /// and total evaluated count.
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
