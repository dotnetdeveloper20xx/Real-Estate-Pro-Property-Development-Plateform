using BuildEstate.Application.Features.LegalCompliance.ComplianceRequirements.DTOs;
using MediatR;

namespace BuildEstate.Application.Features.LegalCompliance.ComplianceRequirements.Queries.GetComplianceStatusSummary;

/// <summary>
/// Query to retrieve compliance status summary totals grouped by category.
/// Returns total requirements, compliant count, non-compliant count, and overdue count per category.
/// </summary>
public sealed record GetComplianceStatusSummaryQuery : IRequest<List<ComplianceStatusSummaryDto>>;
