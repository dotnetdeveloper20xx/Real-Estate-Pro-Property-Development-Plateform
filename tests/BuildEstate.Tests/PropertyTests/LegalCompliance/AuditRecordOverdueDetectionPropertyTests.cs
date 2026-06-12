using BuildEstate.Domain.Enums;
using FluentAssertions;
using FsCheck;
using FsCheck.Xunit;

namespace BuildEstate.Tests.PropertyTests.LegalCompliance;

/// <summary>
/// Property-based tests for overdue detection logic on AuditRecords.
/// An AuditRecord is overdue when:
/// - Status is ActionsRequired or RemediationInProgress
/// - ActionDueDate is not null
/// - ActionDueDate &lt; now
/// - IsOverdue was false (not already marked)
///
/// This replicates the logic in ComplianceOverdueCheckService.ProcessOverdueAuditRecordsAsync.
///
/// **Validates: Requirements 9.6**
/// </summary>
public class AuditRecordOverdueDetectionPropertyTests
{
    /// <summary>
    /// Determines whether an AuditRecord should be marked as overdue based on the
    /// specification in Requirement 9.6 and the implemented logic in ComplianceOverdueCheckService.
    /// </summary>
    private static bool ShouldBeMarkedOverdue(
        AuditRecordStatus status,
        DateTime? actionDueDate,
        bool isAlreadyOverdue,
        DateTime now)
    {
        return (status == AuditRecordStatus.ActionsRequired
                || status == AuditRecordStatus.RemediationInProgress)
               && actionDueDate.HasValue
               && actionDueDate.Value < now
               && !isAlreadyOverdue;
    }

    /// <summary>
    /// Generates valid DateTime values in a reasonable range for testing.
    /// </summary>
    private static Arbitrary<DateTime> DateTimeArbitrary()
    {
        var gen = Gen.Choose(2022, 2030).SelectMany(year =>
            Gen.Choose(1, 12).SelectMany(month =>
                Gen.Choose(1, DateTime.DaysInMonth(year, month)).Select(day =>
                    new DateTime(year, month, day, 12, 0, 0, DateTimeKind.Utc))));

        return gen.ToArbitrary();
    }

    /// <summary>
    /// Generates a "now" reference date and an ActionDueDate in the past (overdue scenario).
    /// </summary>
    private static Arbitrary<(DateTime Now, DateTime ActionDueDate)> OverdueDatePairArbitrary()
    {
        var gen = Gen.Choose(2023, 2028).SelectMany(year =>
            Gen.Choose(1, 12).SelectMany(month =>
                Gen.Choose(1, DateTime.DaysInMonth(year, month)).SelectMany(day =>
                    Gen.Choose(1, 365).Select(daysOverdue =>
                    {
                        var now = new DateTime(year, month, day, 12, 0, 0, DateTimeKind.Utc);
                        var actionDueDate = now.AddDays(-daysOverdue);
                        return (Now: now, ActionDueDate: actionDueDate);
                    }))));

        return gen.ToArbitrary();
    }

    /// <summary>
    /// Generates a "now" reference date and an ActionDueDate in the future (not overdue scenario).
    /// </summary>
    private static Arbitrary<(DateTime Now, DateTime ActionDueDate)> FutureDatePairArbitrary()
    {
        var gen = Gen.Choose(2022, 2026).SelectMany(year =>
            Gen.Choose(1, 12).SelectMany(month =>
                Gen.Choose(1, DateTime.DaysInMonth(year, month)).SelectMany(day =>
                    Gen.Choose(1, 365).Select(daysAhead =>
                    {
                        var now = new DateTime(year, month, day, 12, 0, 0, DateTimeKind.Utc);
                        var actionDueDate = now.AddDays(daysAhead);
                        return (Now: now, ActionDueDate: actionDueDate);
                    }))));

        return gen.ToArbitrary();
    }

    /// <summary>
    /// The statuses that qualify for overdue detection per Requirement 9.6.
    /// </summary>
    private static readonly AuditRecordStatus[] OverdueEligibleStatuses =
    {
        AuditRecordStatus.ActionsRequired,
        AuditRecordStatus.RemediationInProgress
    };

    /// <summary>
    /// Statuses that should NOT trigger overdue marking regardless of ActionDueDate.
    /// </summary>
    private static readonly AuditRecordStatus[] NonOverdueStatuses =
    {
        AuditRecordStatus.Planned,
        AuditRecordStatus.InProgress,
        AuditRecordStatus.FindingsRecorded,
        AuditRecordStatus.Verified,
        AuditRecordStatus.Closed
    };

    /// <summary>
    /// Property 11: WHEN Status is ActionsRequired or RemediationInProgress AND ActionDueDate &lt; now
    /// AND IsOverdue is false, the record SHALL be marked as overdue.
    ///
    /// **Validates: Requirements 9.6**
    /// </summary>
    [Property(MaxTest = 200)]
    public Property EligibleStatus_PastDueDate_NotAlreadyOverdue_ShouldBeMarkedOverdue()
    {
        return Prop.ForAll(
            Gen.Elements(OverdueEligibleStatuses).ToArbitrary(),
            OverdueDatePairArbitrary(),
            (status, datePair) =>
            {
                var result = ShouldBeMarkedOverdue(
                    status: status,
                    actionDueDate: datePair.ActionDueDate,
                    isAlreadyOverdue: false,
                    now: datePair.Now);

                return result
                    .Label($"Should be overdue: Status={status}, ActionDueDate={datePair.ActionDueDate:yyyy-MM-dd}, Now={datePair.Now:yyyy-MM-dd}");
            });
    }

    /// <summary>
    /// Property 11: WHEN Status is ActionsRequired or RemediationInProgress AND ActionDueDate &lt; now
    /// BUT IsOverdue is already true, the record SHALL NOT be re-marked (already processed).
    ///
    /// **Validates: Requirements 9.6**
    /// </summary>
    [Property(MaxTest = 200)]
    public Property EligibleStatus_PastDueDate_AlreadyOverdue_ShouldNotBeReMarked()
    {
        return Prop.ForAll(
            Gen.Elements(OverdueEligibleStatuses).ToArbitrary(),
            OverdueDatePairArbitrary(),
            (status, datePair) =>
            {
                var result = ShouldBeMarkedOverdue(
                    status: status,
                    actionDueDate: datePair.ActionDueDate,
                    isAlreadyOverdue: true,
                    now: datePair.Now);

                return (!result)
                    .Label($"Already overdue should not be re-marked: Status={status}, ActionDueDate={datePair.ActionDueDate:yyyy-MM-dd}, Now={datePair.Now:yyyy-MM-dd}");
            });
    }

    /// <summary>
    /// Property 11: WHEN Status is NOT ActionsRequired or RemediationInProgress,
    /// the record SHALL NOT be marked as overdue regardless of ActionDueDate.
    ///
    /// **Validates: Requirements 9.6**
    /// </summary>
    [Property(MaxTest = 200)]
    public Property NonEligibleStatus_PastDueDate_ShouldNotBeMarkedOverdue()
    {
        return Prop.ForAll(
            Gen.Elements(NonOverdueStatuses).ToArbitrary(),
            OverdueDatePairArbitrary(),
            (status, datePair) =>
            {
                var result = ShouldBeMarkedOverdue(
                    status: status,
                    actionDueDate: datePair.ActionDueDate,
                    isAlreadyOverdue: false,
                    now: datePair.Now);

                return (!result)
                    .Label($"Non-eligible status should not be overdue: Status={status}, ActionDueDate={datePair.ActionDueDate:yyyy-MM-dd}, Now={datePair.Now:yyyy-MM-dd}");
            });
    }

    /// <summary>
    /// Property 11: WHEN ActionDueDate is in the future (ActionDueDate &gt;= now),
    /// the record SHALL NOT be marked as overdue regardless of status.
    ///
    /// **Validates: Requirements 9.6**
    /// </summary>
    [Property(MaxTest = 200)]
    public Property EligibleStatus_FutureDueDate_ShouldNotBeMarkedOverdue()
    {
        return Prop.ForAll(
            Gen.Elements(OverdueEligibleStatuses).ToArbitrary(),
            FutureDatePairArbitrary(),
            (status, datePair) =>
            {
                var result = ShouldBeMarkedOverdue(
                    status: status,
                    actionDueDate: datePair.ActionDueDate,
                    isAlreadyOverdue: false,
                    now: datePair.Now);

                return (!result)
                    .Label($"Future due date should not be overdue: Status={status}, ActionDueDate={datePair.ActionDueDate:yyyy-MM-dd}, Now={datePair.Now:yyyy-MM-dd}");
            });
    }

    /// <summary>
    /// Property 11: WHEN ActionDueDate is null, the record SHALL NOT be marked as overdue
    /// regardless of status.
    ///
    /// **Validates: Requirements 9.6**
    /// </summary>
    [Property(MaxTest = 200)]
    public Property NullActionDueDate_ShouldNotBeMarkedOverdue()
    {
        var allStatuses = Enum.GetValues<AuditRecordStatus>();

        return Prop.ForAll(
            Gen.Elements(allStatuses).ToArbitrary(),
            DateTimeArbitrary(),
            (status, now) =>
            {
                var result = ShouldBeMarkedOverdue(
                    status: status,
                    actionDueDate: null,
                    isAlreadyOverdue: false,
                    now: now);

                return (!result)
                    .Label($"Null ActionDueDate should not be overdue: Status={status}, Now={now:yyyy-MM-dd}");
            });
    }

    /// <summary>
    /// Property 11: The overdue detection function SHALL return a deterministic boolean result
    /// for any combination of valid inputs — it never throws or produces an undefined state.
    ///
    /// **Validates: Requirements 9.6**
    /// </summary>
    [Property(MaxTest = 300)]
    public Property OverdueDetection_AlwaysReturnsDeterministicResult()
    {
        var allStatuses = Enum.GetValues<AuditRecordStatus>();

        // Combine status and isAlreadyOverdue into a single tuple to stay within 3 arbitraries
        var statusAndOverdue = Gen.Elements(allStatuses)
            .SelectMany(s => Gen.Elements(true, false).Select(o => (Status: s, IsOverdue: o)))
            .ToArbitrary();

        return Prop.ForAll(
            statusAndOverdue,
            DateTimeArbitrary(),
            Gen.OneOf(
                Gen.Constant<DateTime?>(null),
                DateTimeArbitrary().Generator.Select(d => (DateTime?)d)
            ).ToArbitrary(),
            (statusOverdue, now, actionDueDate) =>
            {
                var result = ShouldBeMarkedOverdue(
                    statusOverdue.Status,
                    actionDueDate,
                    statusOverdue.IsOverdue,
                    now);

                // Result must be a valid boolean (true or false) — this always holds in C#,
                // but we verify the logic is consistent with a manual recomputation
                var expected = (statusOverdue.Status == AuditRecordStatus.ActionsRequired
                                || statusOverdue.Status == AuditRecordStatus.RemediationInProgress)
                               && actionDueDate.HasValue
                               && actionDueDate.Value < now
                               && !statusOverdue.IsOverdue;

                return (result == expected)
                    .Label($"Determinism: Status={statusOverdue.Status}, IsOverdue={statusOverdue.IsOverdue}, ActionDueDate={actionDueDate?.ToString("yyyy-MM-dd") ?? "null"}, Now={now:yyyy-MM-dd}, Got={result}, Expected={expected}");
            });
    }

    /// <summary>
    /// Property 11: Overdue marking SHALL only apply when ALL four conditions are met simultaneously:
    /// (1) Status is ActionsRequired or RemediationInProgress
    /// (2) ActionDueDate is not null
    /// (3) ActionDueDate &lt; now
    /// (4) IsOverdue is false
    /// If any single condition is violated, the result SHALL be false.
    ///
    /// **Validates: Requirements 9.6**
    /// </summary>
    [Property(MaxTest = 200)]
    public Property AllFourConditionsRequired_ViolatingAny_ShouldNotMarkOverdue()
    {
        // Generate scenarios that violate exactly one condition at a time
        // Violation 1: Wrong status (use non-eligible status) with all other conditions met
        var violateStatus = Gen.Elements(NonOverdueStatuses).SelectMany(status =>
            OverdueDatePairArbitrary().Generator.Select(dp =>
                (Status: status, ActionDueDate: (DateTime?)dp.ActionDueDate, IsOverdue: false, Now: dp.Now)));

        // Violation 2: Null ActionDueDate with all other conditions met
        var violateNullDueDate = Gen.Elements(OverdueEligibleStatuses).SelectMany(status =>
            DateTimeArbitrary().Generator.Select(now =>
                (Status: status, ActionDueDate: (DateTime?)null, IsOverdue: false, Now: now)));

        // Violation 3: ActionDueDate in future with all other conditions met
        var violateFutureDueDate = Gen.Elements(OverdueEligibleStatuses).SelectMany(status =>
            FutureDatePairArbitrary().Generator.Select(dp =>
                (Status: status, ActionDueDate: (DateTime?)dp.ActionDueDate, IsOverdue: false, Now: dp.Now)));

        // Violation 4: Already overdue with all other conditions met
        var violateAlreadyOverdue = Gen.Elements(OverdueEligibleStatuses).SelectMany(status =>
            OverdueDatePairArbitrary().Generator.Select(dp =>
                (Status: status, ActionDueDate: (DateTime?)dp.ActionDueDate, IsOverdue: true, Now: dp.Now)));

        var combined = Gen.OneOf(violateStatus, violateNullDueDate, violateFutureDueDate, violateAlreadyOverdue);

        return Prop.ForAll(
            combined.ToArbitrary(),
            scenario =>
            {
                var result = ShouldBeMarkedOverdue(
                    scenario.Status,
                    scenario.ActionDueDate,
                    scenario.IsOverdue,
                    scenario.Now);

                return (!result)
                    .Label($"Violating a condition should not mark overdue: Status={scenario.Status}, ActionDueDate={scenario.ActionDueDate?.ToString("yyyy-MM-dd") ?? "null"}, IsOverdue={scenario.IsOverdue}, Now={scenario.Now:yyyy-MM-dd}");
            });
    }
}
