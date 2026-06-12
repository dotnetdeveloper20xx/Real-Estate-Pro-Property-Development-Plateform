using BuildEstate.Application.Features.LegalCompliance.ComplianceRequirements.DTOs;
using BuildEstate.Domain.Enums;
using MediatR;

namespace BuildEstate.Application.Features.LegalCompliance.ComplianceRequirements.Commands.CreateComplianceRequirement;

/// <summary>
/// Command to create a new compliance requirement with the specified regulatory details.
/// </summary>
public sealed record CreateComplianceRequirementCommand : IRequest<ComplianceRequirementDto>
{
    public string Name { get; init; } = string.Empty;
    public ComplianceCategory Category { get; init; }
    public string Description { get; init; } = string.Empty;
    public string SourceRegulation { get; init; } = string.Empty;
    public ComplianceFrequency Frequency { get; init; }
    public string ResponsibleRole { get; init; } = string.Empty;
}
