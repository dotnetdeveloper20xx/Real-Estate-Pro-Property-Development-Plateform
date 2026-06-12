using BuildEstate.Application.Features.LegalCompliance.Insurance.DTOs;
using MediatR;

namespace BuildEstate.Application.Features.LegalCompliance.Insurance.Commands.UpdateInsuranceRecord;

/// <summary>
/// Command to update an existing insurance record's editable fields.
/// Only non-null fields are applied (partial update pattern).
/// </summary>
public sealed record UpdateInsuranceRecordCommand : IRequest<InsuranceRecordDto>
{
    public Guid Id { get; init; }
    public string? PolicyNumber { get; init; }
    public string? Insurer { get; init; }
    public decimal? CoverAmount { get; init; }
    public decimal? Premium { get; init; }
    public string? Currency { get; init; }
    public DateTime? ExpiryDate { get; init; }
}
