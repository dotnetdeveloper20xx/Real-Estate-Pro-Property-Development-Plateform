using System.Text.Json;
using BuildEstate.Application.Interfaces;
using BuildEstate.Domain.Common;
using BuildEstate.Domain.Entities.PlanningApprovals;
using BuildEstate.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace BuildEstate.Application.Features.PlanningApprovals.Dashboard.Queries.GetDashboardMetrics;

/// <summary>
/// Handles the GetDashboardMetricsQuery by aggregating KPI data from planning applications,
/// conditions, milestones, appeals, and audit logs.
/// Uses AsNoTracking for all read queries to maximize performance.
/// Minimizes database round trips by executing queries in parallel where possible.
/// </summary>
public sealed class GetDashboardMetricsQueryHandler
    : IRequestHandler<GetDashboardMetricsQuery, DashboardMetricsDto>
{
    private readonly IRepository<PlanningApplication> _applicationRepository;
    private readonly IRepository<PlanningCondition> _conditionRepository;
    private readonly IRepository<PlanningMilestone> _milestoneRepository;
    private readonly IRepository<PlanningAppeal> _appealRepository;
    private readonly IAuditLogQueryService _auditLogQueryService;

    public GetDashboardMetricsQueryHandler(
        IRepository<PlanningApplication> applicationRepository,
        IRepository<PlanningCondition> conditionRepository,
        IRepository<PlanningMilestone> milestoneRepository,
        IRepository<PlanningAppeal> appealRepository,
        IAuditLogQueryService auditLogQueryService)
    {
        _applicationRepository = applicationRepository;
        _conditionRepository = conditionRepository;
        _milestoneRepository = milestoneRepository;
        _appealRepository = appealRepository;
        _auditLogQueryService = auditLogQueryService;
    }

    public async Task<DashboardMetricsDto> Handle(
        GetDashboardMetricsQuery request,
        CancellationToken cancellationToken)
    {
        // Execute independent queries in parallel for efficiency
        var statusCountsTask = GetStatusCountsAsync(cancellationToken);
        var decisionTimeTask = GetAverageDecisionTimeAsync(cancellationToken);
        var approvalRateTask = GetApprovalRateAsync(cancellationToken);
        var appealSuccessRateTask = GetAppealSuccessRateAsync(cancellationToken);
        var outstandingConditionsTask = GetOutstandingConditionsCountAsync(cancellationToken);
        var overdueMilestonesTask = GetOverdueMilestonesCountAsync(cancellationToken);
        var recentActivityTask = GetRecentActivityAsync(cancellationToken);
        var approachingDeadlinesTask = GetApproachingDeadlinesAsync(cancellationToken);

        await Task.WhenAll(
            statusCountsTask,
            decisionTimeTask,
            approvalRateTask,
            appealSuccessRateTask,
            outstandingConditionsTask,
            overdueMilestonesTask,
            recentActivityTask,
            approachingDeadlinesTask);

        return new DashboardMetricsDto
        {
            StatusCounts = await statusCountsTask,
            AverageDecisionTimeDays = await decisionTimeTask,
            ApprovalRatePercent = await approvalRateTask,
            AppealSuccessRatePercent = await appealSuccessRateTask,
            OutstandingConditionsCount = await outstandingConditionsTask,
            OverdueMilestonesCount = await overdueMilestonesTask,
            RecentActivity = await recentActivityTask,
            ApproachingDeadlines = await approachingDeadlinesTask
        };
    }

    /// <summary>
    /// Returns application counts grouped by their current status.
    /// </summary>
    private async Task<Dictionary<string, int>> GetStatusCountsAsync(CancellationToken cancellationToken)
    {
        var counts = await _applicationRepository.Query()
            .AsNoTracking()
            .GroupBy(a => a.Status)
            .Select(g => new { Status = g.Key, Count = g.Count() })
            .ToListAsync(cancellationToken);

        return counts.ToDictionary(x => x.Status.ToString(), x => x.Count);
    }

    /// <summary>
    /// Calculates the average number of days between SubmissionDate and ActualDecisionDate
    /// for applications that have both dates recorded.
    /// </summary>
    private async Task<double?> GetAverageDecisionTimeAsync(CancellationToken cancellationToken)
    {
        var decisionData = await _applicationRepository.Query()
            .AsNoTracking()
            .Where(a => a.SubmissionDate != null && a.ActualDecisionDate != null)
            .Select(a => new
            {
                a.SubmissionDate,
                a.ActualDecisionDate
            })
            .ToListAsync(cancellationToken);

        if (decisionData.Count == 0)
        {
            return null;
        }

        var totalDays = decisionData
            .Sum(a => (a.ActualDecisionDate!.Value - a.SubmissionDate!.Value).TotalDays);

        return Math.Round(totalDays / decisionData.Count, 1);
    }

    /// <summary>
    /// Calculates the approval rate:
    /// (Approved + ApprovedWithConditions) / (Approved + ApprovedWithConditions + Refused) * 100.
    /// Returns 0 when no decided applications exist.
    /// </summary>
    private async Task<double> GetApprovalRateAsync(CancellationToken cancellationToken)
    {
        var finalStatuses = new[]
        {
            PlanningApplicationStatus.Approved,
            PlanningApplicationStatus.ApprovedWithConditions,
            PlanningApplicationStatus.Refused
        };

        var decisions = await _applicationRepository.Query()
            .AsNoTracking()
            .Where(a => finalStatuses.Contains(a.Status))
            .GroupBy(a => a.Status)
            .Select(g => new { Status = g.Key, Count = g.Count() })
            .ToListAsync(cancellationToken);

        var approvedCount = decisions
            .Where(d => d.Status == PlanningApplicationStatus.Approved
                        || d.Status == PlanningApplicationStatus.ApprovedWithConditions)
            .Sum(d => d.Count);

        var totalDecided = decisions.Sum(d => d.Count);

        if (totalDecided == 0)
        {
            return 0;
        }

        return Math.Round((double)approvedCount / totalDecided * 100, 1);
    }

    /// <summary>
    /// Calculates the appeal success rate:
    /// Allowed / (Allowed + Dismissed) * 100.
    /// Returns 0 when no decided appeals exist.
    /// </summary>
    private async Task<double> GetAppealSuccessRateAsync(CancellationToken cancellationToken)
    {
        var finalAppealStatuses = new[]
        {
            AppealStatus.Allowed,
            AppealStatus.Dismissed
        };

        var decisions = await _appealRepository.Query()
            .AsNoTracking()
            .Where(a => finalAppealStatuses.Contains(a.Status))
            .GroupBy(a => a.Status)
            .Select(g => new { Status = g.Key, Count = g.Count() })
            .ToListAsync(cancellationToken);

        var allowedCount = decisions
            .Where(d => d.Status == AppealStatus.Allowed)
            .Sum(d => d.Count);

        var totalDecided = decisions.Sum(d => d.Count);

        if (totalDecided == 0)
        {
            return 0;
        }

        return Math.Round((double)allowedCount / totalDecided * 100, 1);
    }

    /// <summary>
    /// Returns the count of planning conditions with Status = Outstanding.
    /// </summary>
    private async Task<int> GetOutstandingConditionsCountAsync(CancellationToken cancellationToken)
    {
        return await _conditionRepository.Query()
            .AsNoTracking()
            .CountAsync(c => c.Status == ConditionStatus.Outstanding, cancellationToken);
    }

    /// <summary>
    /// Returns the count of planning milestones with Status = Overdue.
    /// </summary>
    private async Task<int> GetOverdueMilestonesCountAsync(CancellationToken cancellationToken)
    {
        return await _milestoneRepository.Query()
            .AsNoTracking()
            .CountAsync(m => m.Status == MilestoneStatus.Overdue, cancellationToken);
    }

    /// <summary>
    /// Retrieves the last 10 status changes from the audit log and maps them to RecentActivityDto.
    /// Joins back to PlanningApplication to get the Description.
    /// </summary>
    private async Task<List<RecentActivityDto>> GetRecentActivityAsync(CancellationToken cancellationToken)
    {
        var auditEntries = await _auditLogQueryService.GetRecentChangesAsync(
            entityName: nameof(PlanningApplication),
            affectedColumn: "Status",
            count: 10,
            cancellationToken);

        if (auditEntries.Count == 0)
        {
            return new List<RecentActivityDto>();
        }

        // Fetch application descriptions for the referenced IDs
        var applicationIds = auditEntries
            .Select(a => Guid.TryParse(a.EntityId, out var id) ? id : Guid.Empty)
            .Where(id => id != Guid.Empty)
            .Distinct()
            .ToList();

        var applicationDescriptions = await _applicationRepository.Query()
            .AsNoTracking()
            .Where(a => applicationIds.Contains(a.Id))
            .Select(a => new { a.Id, a.Description })
            .ToDictionaryAsync(a => a.Id, a => a.Description, cancellationToken);

        return auditEntries.Select(entry =>
        {
            var applicationId = Guid.TryParse(entry.EntityId, out var id) ? id : Guid.Empty;
            var description = applicationDescriptions.GetValueOrDefault(applicationId, "Unknown Application");
            var (previousStatus, newStatus) = ExtractStatusChange(entry.OldValues, entry.NewValues);

            return new RecentActivityDto
            {
                ApplicationId = applicationId,
                Description = description,
                PreviousStatus = previousStatus,
                NewStatus = newStatus,
                ChangedBy = entry.UserName,
                ChangedAt = entry.Timestamp
            };
        }).ToList();
    }

    /// <summary>
    /// Retrieves applications whose TargetDecisionDate falls within the next 14 days.
    /// </summary>
    private async Task<List<ApproachingDeadlineDto>> GetApproachingDeadlinesAsync(CancellationToken cancellationToken)
    {
        var today = DateTime.UtcNow.Date;
        var deadline = today.AddDays(14);

        return await _applicationRepository.Query()
            .AsNoTracking()
            .Where(a => a.TargetDecisionDate != null
                        && a.TargetDecisionDate.Value >= today
                        && a.TargetDecisionDate.Value <= deadline)
            .OrderBy(a => a.TargetDecisionDate)
            .Select(a => new ApproachingDeadlineDto
            {
                ApplicationId = a.Id,
                Description = a.Description,
                TargetDecisionDate = a.TargetDecisionDate!.Value,
                DaysRemaining = (a.TargetDecisionDate!.Value - today).Days
            })
            .ToListAsync(cancellationToken);
    }

    /// <summary>
    /// Extracts the previous and new status strings from the audit log JSON values.
    /// </summary>
    private static (string PreviousStatus, string NewStatus) ExtractStatusChange(
        string? oldValues,
        string? newValues)
    {
        var previousStatus = ExtractStatusFromJson(oldValues);
        var newStatus = ExtractStatusFromJson(newValues);

        return (previousStatus, newStatus);
    }

    /// <summary>
    /// Parses the "Status" field from the audit log JSON.
    /// The JSON contains property names as keys with their values.
    /// Status is stored as an integer enum value.
    /// </summary>
    private static string ExtractStatusFromJson(string? json)
    {
        if (string.IsNullOrWhiteSpace(json))
        {
            return "Unknown";
        }

        try
        {
            using var document = JsonDocument.Parse(json);
            if (document.RootElement.TryGetProperty("Status", out var statusElement))
            {
                // Status is stored as integer enum value
                if (statusElement.ValueKind == JsonValueKind.Number
                    && statusElement.TryGetInt32(out var statusInt)
                    && Enum.IsDefined(typeof(PlanningApplicationStatus), statusInt))
                {
                    return ((PlanningApplicationStatus)statusInt).ToString();
                }

                // Fallback: it may be stored as a string
                if (statusElement.ValueKind == JsonValueKind.String)
                {
                    return statusElement.GetString() ?? "Unknown";
                }
            }
        }
        catch (JsonException)
        {
            // Gracefully handle malformed JSON
        }

        return "Unknown";
    }
}
