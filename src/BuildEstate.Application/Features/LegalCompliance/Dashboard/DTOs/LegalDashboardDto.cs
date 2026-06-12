using BuildEstate.Domain.Enums;

namespace BuildEstate.Application.Features.LegalCompliance.Dashboard.DTOs;

/// <summary>
/// Dashboard DTO containing all KPI metrics for the Legal &amp; Compliance module.
/// Provides a snapshot of legal position, compliance health, and risk exposure.
/// </summary>
public sealed record LegalDashboardDto
{
    /// <summary>
    /// Case counts grouped by status.
    /// </summary>
    public IReadOnlyList<CaseCountByStatusDto> CaseCountsByStatus { get; init; } = [];

    /// <summary>
    /// Case counts grouped by priority.
    /// </summary>
    public IReadOnlyList<CaseCountByPriorityDto> CaseCountsByPriority { get; init; } = [];

    /// <summary>
    /// Average time in days from case creation to resolution
    /// for cases with status Resolved or Closed.
    /// </summary>
    public double AverageResolutionTimeDays { get; init; }

    /// <summary>
    /// Percentage of ComplianceChecks with Outcome = Compliant
    /// out of total checks in the current reporting period.
    /// </summary>
    public double ComplianceRatePercentage { get; init; }

    /// <summary>
    /// Count of insurance records with status ExpiringSoon.
    /// </summary>
    public int ExpiringSoonInsuranceCount { get; init; }

    /// <summary>
    /// Count of insurance records with status Expired.
    /// </summary>
    public int ExpiredInsuranceCount { get; init; }

    /// <summary>
    /// Active contract value grouped by contract type.
    /// </summary>
    public IReadOnlyList<ContractValueByTypeDto> ActiveContractValueByType { get; init; } = [];

    /// <summary>
    /// Count of contracts currently awaiting approval (status = UnderReview).
    /// </summary>
    public int ContractsAwaitingApprovalCount { get; init; }

    /// <summary>
    /// Compliance requirements that are overdue (past NextDueDate with no recent check).
    /// </summary>
    public IReadOnlyList<OverdueComplianceItemDto> OverdueComplianceItems { get; init; } = [];

    /// <summary>
    /// Audit records with overdue action items.
    /// </summary>
    public IReadOnlyList<OverdueAuditItemDto> OverdueAuditItems { get; init; } = [];

    /// <summary>
    /// Last 10 activities across all legal entities.
    /// </summary>
    public IReadOnlyList<RecentActivityDto> RecentActivities { get; init; } = [];

    /// <summary>
    /// Risk summary showing High/Critical legal cases and audit records.
    /// </summary>
    public RiskSummaryDto RiskSummary { get; init; } = new();
}

/// <summary>
/// Case count grouped by a specific status value.
/// </summary>
public sealed record CaseCountByStatusDto
{
    public LegalCaseStatus Status { get; init; }
    public int Count { get; init; }
}

/// <summary>
/// Case count grouped by a specific priority value.
/// </summary>
public sealed record CaseCountByPriorityDto
{
    public LegalCasePriority Priority { get; init; }
    public int Count { get; init; }
}

/// <summary>
/// Total active contract value for a specific contract type.
/// </summary>
public sealed record ContractValueByTypeDto
{
    public LegalContractType ContractType { get; init; }
    public decimal TotalValue { get; init; }
}

/// <summary>
/// Overdue compliance requirement summary for dashboard display.
/// </summary>
public sealed record OverdueComplianceItemDto
{
    public Guid Id { get; init; }
    public string Name { get; init; } = string.Empty;
    public ComplianceCategory Category { get; init; }
    public DateTime? NextDueDate { get; init; }
    public string ResponsibleRole { get; init; } = string.Empty;
}

/// <summary>
/// Overdue audit record action for dashboard display.
/// </summary>
public sealed record OverdueAuditItemDto
{
    public Guid Id { get; init; }
    public AuditType AuditType { get; init; }
    public string Scope { get; init; } = string.Empty;
    public DateTime? ActionDueDate { get; init; }
    public AuditRecordStatus Status { get; init; }
}

/// <summary>
/// Recent activity entry showing the last actions performed across legal entities.
/// </summary>
public sealed record RecentActivityDto
{
    public Guid EntityId { get; init; }
    public string EntityType { get; init; } = string.Empty;
    public string Description { get; init; } = string.Empty;
    public DateTime Timestamp { get; init; }
    public string UserName { get; init; } = string.Empty;
}

/// <summary>
/// Risk summary showing counts of High/Critical cases and audits.
/// </summary>
public sealed record RiskSummaryDto
{
    public int HighPriorityCaseCount { get; init; }
    public int CriticalPriorityCaseCount { get; init; }
    public int HighRiskAuditCount { get; init; }
    public int CriticalRiskAuditCount { get; init; }
}
