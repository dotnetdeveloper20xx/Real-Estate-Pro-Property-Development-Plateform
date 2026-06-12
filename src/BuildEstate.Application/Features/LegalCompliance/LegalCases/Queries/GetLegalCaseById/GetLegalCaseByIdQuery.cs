using BuildEstate.Application.Features.LegalCompliance.LegalCases.DTOs;
using MediatR;

namespace BuildEstate.Application.Features.LegalCompliance.LegalCases.Queries.GetLegalCaseById;

/// <summary>
/// Query to retrieve a single legal case by its unique identifier,
/// including related contracts, documents, insurance records,
/// and permitted status transitions from the state machine.
/// </summary>
public sealed record GetLegalCaseByIdQuery : IRequest<LegalCaseDetailDto>
{
    public Guid Id { get; init; }
}
