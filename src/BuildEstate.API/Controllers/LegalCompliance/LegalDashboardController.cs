using BuildEstate.Application.Features.LegalCompliance.Dashboard.Queries.GetLegalDashboard;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BuildEstate.API.Controllers.LegalCompliance;

/// <summary>
/// Provides the Legal &amp; Compliance dashboard KPI endpoint.
/// Returns aggregated metrics including case counts by status/priority, compliance rate,
/// insurance alerts, contract values, overdue items, recent activity, and risk summary.
/// Restricted to Legal_Compliance_Officer role.
/// </summary>
[Route("api/v1/legal-dashboard")]
public class LegalDashboardController : BaseApiController
{
    /// <summary>
    /// Returns the full Legal &amp; Compliance dashboard data including:
    /// - LegalCase counts grouped by Status and Priority
    /// - Average Case Resolution Time (days)
    /// - Compliance Rate (percentage of Compliant checks in the current period)
    /// - InsuranceRecord counts with Expiring Soon or Expired status
    /// - Active ContractValue grouped by ContractType and contracts awaiting approval
    /// - Overdue ComplianceRequirements and AuditRecord actions
    /// - Last 10 recent activities across all legal entities
    /// - Risk summary (High/Critical priority cases and audit records)
    /// </summary>
    [HttpGet]
    [Authorize(Policy = "legal.read")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetDashboard(CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(new GetLegalDashboardQuery(), cancellationToken);
        return Ok(result);
    }
}
