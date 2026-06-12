using BuildEstate.Application.Features.LegalCompliance.LegalCases.DTOs;
using BuildEstate.Domain.Enums;
using MediatR;

namespace BuildEstate.Application.Features.LegalCompliance.LegalCases.Commands.UpdateLegalCase;

/// <summary>
/// Command to update an existing legal case's editable fields.
/// Only non-null fields are applied (partial update pattern).
/// </summary>
public sealed record UpdateLegalCaseCommand : IRequest<LegalCaseDto>
{
    public Guid Id { get; init; }
    public string? Title { get; init; }
    public string? Description { get; init; }
    public LegalCasePriority? Priority { get; init; }
    public string? AssignedSolicitor { get; init; }
    public string? SolicitorFirm { get; init; }
    public string? SolicitorEmail { get; init; }
    public string? SolicitorPhone { get; init; }
    public string? Notes { get; init; }
}
