using BuildEstate.Application.Features.LegalCompliance.Insurance.DTOs;
using BuildEstate.Domain.Enums;
using MediatR;

namespace BuildEstate.Application.Features.LegalCompliance.Insurance.Commands.CreateInsuranceRecord;

/// <summary>
/// Command to create a new insurance record.
/// Captures policy details, coverage, premium, date range, and optional integration links.
/// </summary>
public sealed record CreateInsuranceRecordCommand : IRequest<InsuranceRecordDto>
{
    public string PolicyNumber { get; init; } = string.Empty;
    public string Insurer { get; init; } = string.Empty;
    public CoverageType CoverageType { get; init; }
    public decimal CoverAmount { get; init; }
    public decimal Premium { get; init; }
    public string Currency { get; init; } = string.Empty;
    public DateTime StartDate { get; init; }
    public DateTime ExpiryDate { get; init; }
    public Guid? OpportunityId { get; init; }
    public Guid? LegalCaseId { get; init; }
}
