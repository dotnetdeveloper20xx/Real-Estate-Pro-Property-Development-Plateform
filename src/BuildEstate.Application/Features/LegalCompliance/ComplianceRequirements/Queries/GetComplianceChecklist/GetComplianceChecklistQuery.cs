using BuildEstate.Application.Features.LegalCompliance.ComplianceRequirements.DTOs;
using MediatR;

namespace BuildEstate.Application.Features.LegalCompliance.ComplianceRequirements.Queries.GetComplianceChecklist;

/// <summary>
/// Query to retrieve a compliance checklist view showing all active requirements with their last check,
/// next due date, and a color-coded status indicator (green, amber, red, grey).
/// </summary>
public sealed record GetComplianceChecklistQuery : IRequest<List<ComplianceChecklistDto>>;
