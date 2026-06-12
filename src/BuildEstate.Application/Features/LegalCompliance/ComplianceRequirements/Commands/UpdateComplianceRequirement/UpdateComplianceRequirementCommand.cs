using BuildEstate.Application.Features.LegalCompliance.ComplianceRequirements.DTOs;
using BuildEstate.Domain.Enums;
using MediatR;

namespace BuildEstate.Application.Features.LegalCompliance.ComplianceRequirements.Commands.UpdateComplianceRequirement;

/// <summary>
/// Command to update an existing compliance requirement's editable fields.
/// Only non-null fields are applied (partial update pattern).
/// </summary>
public sealed record UpdateComplianceRequirementCommand : IRequest<ComplianceRequirementDto>
{
    public Guid Id { get; init; }
    public string? Name { get; init; }
    public string? Description { get; init; }
    public string? SourceRegulation { get; init; }
    public ComplianceFrequency? Frequency { get; init; }
    public string? ResponsibleRole { get; init; }
}
