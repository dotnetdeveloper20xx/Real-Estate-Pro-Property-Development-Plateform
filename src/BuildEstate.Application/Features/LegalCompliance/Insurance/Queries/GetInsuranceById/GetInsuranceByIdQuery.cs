using BuildEstate.Application.Features.LegalCompliance.Insurance.DTOs;
using MediatR;

namespace BuildEstate.Application.Features.LegalCompliance.Insurance.Queries.GetInsuranceById;

/// <summary>
/// Query to retrieve a single insurance record by its unique identifier,
/// including the linked legal case reference, calculated days until expiry,
/// and permitted status transitions from the state machine.
/// </summary>
public sealed record GetInsuranceByIdQuery : IRequest<InsuranceRecordDetailDto>
{
    public Guid Id { get; init; }
}
