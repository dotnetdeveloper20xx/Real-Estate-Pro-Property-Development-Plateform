using BuildEstate.Application.Features.LegalCompliance.ComplianceRequirements.DTOs;
using BuildEstate.Domain.Enums;
using MediatR;

namespace BuildEstate.Application.Features.LegalCompliance.ComplianceRequirements.Commands.RetireComplianceRequirement;

/// <summary>
/// Command to retire or supersede an existing compliance requirement.
/// NewStatus must be Superseded or Retired. RetirementReason must be at least 10 characters.
/// </summary>
public sealed record RetireComplianceRequirementCommand : IRequest<ComplianceRequirementDto>
{
    public Guid Id { get; init; }
    public ComplianceRequirementStatus NewStatus { get; init; }
    public string RetirementReason { get; init; } = string.Empty;
}
