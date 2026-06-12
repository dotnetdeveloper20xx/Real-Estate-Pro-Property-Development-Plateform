using BuildEstate.Application.Features.LegalCompliance.Dashboard.DTOs;
using BuildEstate.Application.Interfaces;
using BuildEstate.Domain.Common;
using BuildEstate.Domain.Entities.LegalCompliance;
using BuildEstate.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace BuildEstate.Application.Features.LegalCompliance.Dashboard.Queries.GetLegalDashboard;

/// <summary>
/// Handles the GetLegalDashboardQuery by computing all legal module KPIs
/// from current data. All queries use AsNoTracking for read-only performance.
/// </summary>
public sealed class GetLegalDashboardQueryHandler
    : IRequestHandler<GetLegalDashboardQuery, LegalDashboardDto>
{
    private readonly IRepository<LegalCase> _legalCaseRepository;
    private readonly IRepository<Contract> _contractRepository;
    private readonly IRepository<ComplianceRequirement> _complianceRequirementRepository;
    private readonly IRepository<ComplianceCheck> _complianceCheckRepository;
    private readonly IRepository<InsuranceRecord> _insuranceRepository;
    private readonly IRepository<AuditRecord> _auditRecordRepository;
    private readonly IAuditLogQueryService _auditLogQueryService;

    public GetLegalDashboardQueryHandler(
        IRepository<LegalCase> legalCaseRepository,
        IRepository<Contract> contractRepository,
        IRepository<ComplianceRequirement> complianceRequirementRepository,
        IRepository<ComplianceCheck> complianceCheckRepository,
        IRepository<InsuranceRecord> insuranceRepository,
        IRepository<AuditRecord> auditRecordRepository,
        IAuditLogQueryService auditLogQueryService)
    {
        _legalCaseRepository = legalCaseRepository;
        _contractRepository = contractRepository;
        _complianceRequirementRepository = complianceRequirementRepository;
        _complianceCheckRepository = complianceCheckRepository;
        _insuranceRepository = insuranceRepository;
        _auditRecordRepository = auditRecordRepository;
        _auditLogQueryService = auditLogQueryService;
    }

    public async Task<LegalDashboardDto> Handle(
        GetLegalDashboardQuery request,
        CancellationToken cancellationToken)
    {
        var caseCountsByStatus = await GetCaseCountsByStatusAsync(cancellationToken);
        var caseCountsByPriority = await GetCaseCountsByPriorityAsync(cancellationToken);
        var averageResolutionTime = await GetAverageResolutionTimeAsync(cancellationToken);
        var complianceRate = await GetComplianceRateAsync(cancellationToken);
        var (expiringSoonCount, expiredCount) = await GetInsuranceAlertCountsAsync(cancellationToken);
        var activeContractValueByType = await GetActiveContractValueByTypeAsync(cancellationToken);
        var contractsAwaitingApproval = await GetContractsAwaitingApprovalCountAsync(cancellationToken);
        var overdueComplianceItems = await GetOverdueComplianceItemsAsync(cancellationToken);
        var overdueAuditItems = await GetOverdueAuditItemsAsync(cancellationToken);
        var recentActivities = await GetRecentActivitiesAsync(cancellationToken);
        var riskSummary = await GetRiskSummaryAsync(cancellationToken);

        return new LegalDashboardDto
        {
            CaseCountsByStatus = caseCountsByStatus,
            CaseCountsByPriority = caseCountsByPriority,
            AverageResolutionTimeDays = averageResolutionTime,
            ComplianceRatePercentage = complianceRate,
            ExpiringSoonInsuranceCount = expiringSoonCount,
            ExpiredInsuranceCount = expiredCount,
            ActiveContractValueByType = activeContractValueByType,
            ContractsAwaitingApprovalCount = contractsAwaitingApproval,
            OverdueComplianceItems = overdueComplianceItems,
            OverdueAuditItems = overdueAuditItems,
            RecentActivities = recentActivities,
            RiskSummary = riskSummary
        };
    }

    /// <summary>
    /// Requirement 11.1: Case counts grouped by Status.
    /// </summary>
    private async Task<List<CaseCountByStatusDto>> GetCaseCountsByStatusAsync(
        CancellationToken cancellationToken)
    {
        return await _legalCaseRepository
            .Query()
            .AsNoTracking()
            .GroupBy(c => c.Status)
            .Select(g => new CaseCountByStatusDto
            {
                Status = g.Key,
                Count = g.Count()
            })
            .ToListAsync(cancellationToken);
    }

    /// <summary>
    /// Requirement 11.1: Case counts grouped by Priority.
    /// </summary>
    private async Task<List<CaseCountByPriorityDto>> GetCaseCountsByPriorityAsync(
        CancellationToken cancellationToken)
    {
        return await _legalCaseRepository
            .Query()
            .AsNoTracking()
            .GroupBy(c => c.Priority)
            .Select(g => new CaseCountByPriorityDto
            {
                Priority = g.Key,
                Count = g.Count()
            })
            .ToListAsync(cancellationToken);
    }

    /// <summary>
    /// Requirement 11.2: Average resolution time in days
    /// for cases with Status Resolved or Closed that have a ResolutionDate.
    /// </summary>
    private async Task<double> GetAverageResolutionTimeAsync(
        CancellationToken cancellationToken)
    {
        var resolvedCases = await _legalCaseRepository
            .Query()
            .AsNoTracking()
            .Where(c => (c.Status == LegalCaseStatus.Resolved || c.Status == LegalCaseStatus.Closed)
                        && c.ResolutionDate != null)
            .Select(c => new { c.CreatedAt, c.ResolutionDate })
            .ToListAsync(cancellationToken);

        if (resolvedCases.Count == 0)
            return 0;

        var totalDays = resolvedCases
            .Sum(c => (c.ResolutionDate!.Value - c.CreatedAt).TotalDays);

        return Math.Round(totalDays / resolvedCases.Count, 2);
    }

    /// <summary>
    /// Requirement 11.3: Compliance rate as percentage of Compliant checks
    /// out of total checks in the current reporting period (current calendar year).
    /// </summary>
    private async Task<double> GetComplianceRateAsync(
        CancellationToken cancellationToken)
    {
        var currentYearStart = new DateTime(DateTime.UtcNow.Year, 1, 1, 0, 0, 0, DateTimeKind.Utc);

        var totalChecks = await _complianceCheckRepository
            .Query()
            .AsNoTracking()
            .CountAsync(c => c.CheckDate >= currentYearStart, cancellationToken);

        if (totalChecks == 0)
            return 0;

        var compliantChecks = await _complianceCheckRepository
            .Query()
            .AsNoTracking()
            .CountAsync(c => c.CheckDate >= currentYearStart
                             && c.Outcome == ComplianceCheckOutcome.Compliant,
                cancellationToken);

        return Math.Round((double)compliantChecks / totalChecks * 100, 2);
    }

    /// <summary>
    /// Requirement 11.4: Count of InsuranceRecords with Status ExpiringSoon or Expired.
    /// </summary>
    private async Task<(int ExpiringSoon, int Expired)> GetInsuranceAlertCountsAsync(
        CancellationToken cancellationToken)
    {
        var expiringSoon = await _insuranceRepository
            .Query()
            .AsNoTracking()
            .CountAsync(i => i.Status == InsuranceStatus.ExpiringSoon, cancellationToken);

        var expired = await _insuranceRepository
            .Query()
            .AsNoTracking()
            .CountAsync(i => i.Status == InsuranceStatus.Expired, cancellationToken);

        return (expiringSoon, expired);
    }

    /// <summary>
    /// Requirement 11.5: Active contract value grouped by ContractType
    /// and count of contracts awaiting approval (UnderReview status).
    /// </summary>
    private async Task<List<ContractValueByTypeDto>> GetActiveContractValueByTypeAsync(
        CancellationToken cancellationToken)
    {
        return await _contractRepository
            .Query()
            .AsNoTracking()
            .Where(c => c.Status == LegalContractStatus.Active)
            .GroupBy(c => c.ContractType)
            .Select(g => new ContractValueByTypeDto
            {
                ContractType = g.Key,
                TotalValue = g.Sum(c => c.ContractValue)
            })
            .ToListAsync(cancellationToken);
    }

    /// <summary>
    /// Requirement 11.5: Count of contracts awaiting approval.
    /// </summary>
    private async Task<int> GetContractsAwaitingApprovalCountAsync(
        CancellationToken cancellationToken)
    {
        return await _contractRepository
            .Query()
            .AsNoTracking()
            .CountAsync(c => c.Status == LegalContractStatus.UnderReview, cancellationToken);
    }

    /// <summary>
    /// Requirement 11.6: Overdue compliance requirements
    /// (NextDueDate in the past and status is Active).
    /// </summary>
    private async Task<List<OverdueComplianceItemDto>> GetOverdueComplianceItemsAsync(
        CancellationToken cancellationToken)
    {
        var utcNow = DateTime.UtcNow;

        return await _complianceRequirementRepository
            .Query()
            .AsNoTracking()
            .Where(cr => cr.Status == ComplianceRequirementStatus.Active
                         && cr.NextDueDate != null
                         && cr.NextDueDate < utcNow)
            .Select(cr => new OverdueComplianceItemDto
            {
                Id = cr.Id,
                Name = cr.Name,
                Category = cr.Category,
                NextDueDate = cr.NextDueDate,
                ResponsibleRole = cr.ResponsibleRole
            })
            .ToListAsync(cancellationToken);
    }

    /// <summary>
    /// Requirement 11.6: Overdue audit record actions
    /// (ActionDueDate in the past and status is ActionsRequired or RemediationInProgress).
    /// </summary>
    private async Task<List<OverdueAuditItemDto>> GetOverdueAuditItemsAsync(
        CancellationToken cancellationToken)
    {
        var utcNow = DateTime.UtcNow;

        return await _auditRecordRepository
            .Query()
            .AsNoTracking()
            .Where(ar => ar.ActionDueDate != null
                         && ar.ActionDueDate < utcNow
                         && (ar.Status == AuditRecordStatus.ActionsRequired
                             || ar.Status == AuditRecordStatus.RemediationInProgress))
            .Select(ar => new OverdueAuditItemDto
            {
                Id = ar.Id,
                AuditType = ar.AuditType,
                Scope = ar.Scope,
                ActionDueDate = ar.ActionDueDate,
                Status = ar.Status
            })
            .ToListAsync(cancellationToken);
    }

    /// <summary>
    /// Requirement 11.7: Recent 10 activities across all legal entities.
    /// </summary>
    private async Task<List<RecentActivityDto>> GetRecentActivitiesAsync(
        CancellationToken cancellationToken)
    {
        var legalEntityNames = new List<string>
        {
            nameof(LegalCase),
            nameof(Contract),
            nameof(ComplianceRequirement),
            nameof(ComplianceCheck),
            nameof(InsuranceRecord),
            nameof(AuditRecord),
            nameof(LegalDocument)
        };

        var recentEntries = await _auditLogQueryService.GetRecentActivitiesAsync(
            legalEntityNames,
            10,
            cancellationToken);

        return recentEntries
            .Select(e => new RecentActivityDto
            {
                EntityId = Guid.TryParse(e.EntityId, out var id) ? id : Guid.Empty,
                EntityType = e.EntityName,
                Description = $"{e.Action} {e.EntityName}",
                Timestamp = e.Timestamp,
                UserName = e.UserName
            })
            .ToList();
    }

    /// <summary>
    /// Requirement 11.8: Risk summary — High/Critical cases and audit records.
    /// </summary>
    private async Task<RiskSummaryDto> GetRiskSummaryAsync(
        CancellationToken cancellationToken)
    {
        var highPriorityCases = await _legalCaseRepository
            .Query()
            .AsNoTracking()
            .CountAsync(c => c.Priority == LegalCasePriority.High
                             && c.Status != LegalCaseStatus.Closed
                             && c.Status != LegalCaseStatus.Resolved,
                cancellationToken);

        var criticalPriorityCases = await _legalCaseRepository
            .Query()
            .AsNoTracking()
            .CountAsync(c => c.Priority == LegalCasePriority.Critical
                             && c.Status != LegalCaseStatus.Closed
                             && c.Status != LegalCaseStatus.Resolved,
                cancellationToken);

        var highRiskAudits = await _auditRecordRepository
            .Query()
            .AsNoTracking()
            .CountAsync(ar => ar.RiskRating == RiskRating.High
                              && ar.Status != AuditRecordStatus.Closed,
                cancellationToken);

        var criticalRiskAudits = await _auditRecordRepository
            .Query()
            .AsNoTracking()
            .CountAsync(ar => ar.RiskRating == RiskRating.Critical
                              && ar.Status != AuditRecordStatus.Closed,
                cancellationToken);

        return new RiskSummaryDto
        {
            HighPriorityCaseCount = highPriorityCases,
            CriticalPriorityCaseCount = criticalPriorityCases,
            HighRiskAuditCount = highRiskAudits,
            CriticalRiskAuditCount = criticalRiskAudits
        };
    }
}
