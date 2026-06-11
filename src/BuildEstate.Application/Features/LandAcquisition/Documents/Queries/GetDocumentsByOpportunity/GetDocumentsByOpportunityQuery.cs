using BuildEstate.Application.Features.LandAcquisition.Documents.DTOs;
using BuildEstate.Domain.Enums;
using MediatR;

namespace BuildEstate.Application.Features.LandAcquisition.Documents.Queries.GetDocumentsByOpportunity;

/// <summary>
/// Query to retrieve documents for a specific opportunity,
/// with optional filtering by DocType.
/// </summary>
public sealed record GetDocumentsByOpportunityQuery : IRequest<List<DocumentDto>>
{
    public Guid OpportunityId { get; init; }
    public DocumentType? DocType { get; init; }
}
