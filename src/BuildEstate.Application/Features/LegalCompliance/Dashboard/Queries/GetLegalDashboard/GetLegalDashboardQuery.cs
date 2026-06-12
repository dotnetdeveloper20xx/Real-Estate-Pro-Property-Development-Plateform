using BuildEstate.Application.Features.LegalCompliance.Dashboard.DTOs;
using MediatR;

namespace BuildEstate.Application.Features.LegalCompliance.Dashboard.Queries.GetLegalDashboard;

/// <summary>
/// Query to retrieve the Legal &amp; Compliance dashboard KPI data.
/// Returns case metrics, compliance rate, insurance alerts, contract values,
/// overdue items, recent activity, and risk summary.
/// </summary>
public sealed record GetLegalDashboardQuery : IRequest<LegalDashboardDto>;
