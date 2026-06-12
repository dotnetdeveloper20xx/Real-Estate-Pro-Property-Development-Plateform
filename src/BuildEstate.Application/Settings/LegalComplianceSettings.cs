namespace BuildEstate.Application.Settings;

/// <summary>
/// Configuration settings for Legal & Compliance module thresholds.
/// Contracts exceeding the HighValueContractThreshold require Finance_Director
/// approval when transitioning from Draft to UnderReview.
/// </summary>
public class LegalComplianceSettings
{
    public const string SectionName = "LegalComplianceSettings";

    /// <summary>
    /// The contract value threshold above which Finance Director approval is required
    /// for Draft → UnderReview transitions. Default is £50,000.
    /// </summary>
    public decimal HighValueContractThreshold { get; set; } = 50000m;
}
