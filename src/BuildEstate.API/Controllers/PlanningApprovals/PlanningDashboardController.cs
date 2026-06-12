using BuildEstate.Application.Features.PlanningApprovals.Dashboard.Queries.GetDashboardMetrics;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BuildEstate.API.Controllers.PlanningApprovals;

/// <summary>
/// Provides planning module dashboard KPI metrics.
/// Restricted to PlanningManager role for strategic oversight of planning performance.
/// </summary>
[Route("api/v1/planning-dashboard")]
[Authorize(Roles = "PlanningManager")]
public class PlanningDashboardController : BaseApiController
{
    /// <summary>
    /// Returns dashboard metrics including application counts by status,
    /// average decision time, approval rate, appeal success rate,
    /// outstanding conditions count, overdue milestones count,
    /// recent activity (last 10 status changes), and applications
    /// approaching their target decision date within 14 days.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetDashboardMetrics(CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(new GetDashboardMetricsQuery(), cancellationToken);
        return Ok(result);
    }
}
