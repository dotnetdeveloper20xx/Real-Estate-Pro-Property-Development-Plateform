using BuildEstate.Application.Features.LegalCompliance.Insurance.DTOs;
using MediatR;

namespace BuildEstate.Application.Features.LegalCompliance.Insurance.Commands.RenewInsuranceRecord;

/// <summary>
/// Command to renew an existing insurance record that is ExpiringSoon or Expired.
/// Creates a new InsuranceRecord linked via PreviousPolicyId, carrying forward
/// PolicyNumber, Insurer, CoverageType, OpportunityId, and LegalCaseId from the original.
/// </summary>
public sealed record RenewInsuranceRecordCommand : IRequest<InsuranceRecordDto>
{
    /// <summary>
    /// The Id of the existing insurance record to renew.
    /// </summary>
    public Guid Id { get; init; }

    /// <summary>
    /// New cover amount for the renewed policy.
    /// </summary>
    public decimal NewCoverAmount { get; init; }

    /// <summary>
    /// New premium for the renewed policy.
    /// </summary>
    public decimal NewPremium { get; init; }

    /// <summary>
    /// ISO 4217 currency code for the renewed policy.
    /// </summary>
    public string Currency { get; init; } = string.Empty;

    /// <summary>
    /// Start date of the renewed policy period.
    /// </summary>
    public DateTime NewStartDate { get; init; }

    /// <summary>
    /// Expiry date of the renewed policy period.
    /// </summary>
    public DateTime NewExpiryDate { get; init; }
}
