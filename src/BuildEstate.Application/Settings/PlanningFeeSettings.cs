namespace BuildEstate.Application.Settings;

/// <summary>
/// Configuration settings for planning fee approval thresholds.
/// Fees exceeding the ApprovalThreshold require Finance Director approval.
/// </summary>
public class PlanningFeeSettings
{
    public const string SectionName = "PlanningFeeSettings";

    /// <summary>
    /// The fee amount threshold above which Finance Director approval is required.
    /// Default is 10,000 in base currency.
    /// </summary>
    public decimal ApprovalThreshold { get; set; } = 10000m;
}
