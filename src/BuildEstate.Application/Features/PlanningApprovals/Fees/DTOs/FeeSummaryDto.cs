namespace BuildEstate.Application.Features.PlanningApprovals.Fees.DTOs;

/// <summary>
/// DTO representing aggregated fee totals grouped by FeeType and PaymentStatus.
/// Used by the GetFeeSummaryQuery to return financial summaries for a planning application.
/// </summary>
public sealed record FeeSummaryDto
{
    /// <summary>The fee type for this group (e.g., ApplicationFee, AppealFee).</summary>
    public string FeeType { get; init; } = string.Empty;

    /// <summary>The payment status for this group (e.g., Pending, Paid).</summary>
    public string PaymentStatus { get; init; } = string.Empty;

    /// <summary>Total amount (sum) for fees matching this FeeType and PaymentStatus combination.</summary>
    public decimal TotalAmount { get; init; }

    /// <summary>Count of fees matching this FeeType and PaymentStatus combination.</summary>
    public int Count { get; init; }
}
