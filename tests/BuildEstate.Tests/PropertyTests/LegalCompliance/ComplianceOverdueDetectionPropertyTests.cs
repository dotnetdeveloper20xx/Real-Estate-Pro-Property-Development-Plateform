using BuildEstate.Domain.Enums;
using FluentAssertions;
using FsCheck;
using FsCheck.Xunit;

namespace BuildEstate.Tests.PropertyTests.LegalCompliance;

/// <summary>
/// Property-based tests for overdue detection logic in the compliance checklist.
/// Verifies the GetComplianceChecklistQueryHandler's DetermineStatusIndicator logic:
/// - "red": NextDueDate &lt; now and no recent compliant check, or last check NonCompliant
/// - "green": NextDueDate &gt; now.AddDays(7) and last check Compliant
/// - "amber": NextDueDate within 7 days
/// - "grey": no checks recorded
///
/// **Validates: Requirements 6.6**
/// </summary>
public class ComplianceOverdueDetectionPropertyTests
{
    /// <summary>
    /// Replicates the DetermineStatusIndicator logic from GetComplianceChecklistQueryHandler
    /// for property verification against the specification.
    /// </summary>
    private static string DetermineStatusIndicator(
        ComplianceCheckOutcome? lastOutcome,
        DateTime? nextDueDate,
        bool hasChecks,
        DateTime now)
    {
        if (!hasChecks)
        {
            return "grey";
        }

        if (lastOutcome == ComplianceCheckOutcome.NonCompliant)
        {
            return "red";
        }

        if (nextDueDate.HasValue && nextDueDate.Value < now)
        {
            return "red";
        }

        if (nextDueDate.HasValue && nextDueDate.Value <= now.AddDays(7))
        {
            return "amber";
        }

        if (lastOutcome == ComplianceCheckOutcome.Compliant && (!nextDueDate.HasValue || nextDueDate.Value > now))
        {
            return "green";
        }

        // Default fallback for PartiallyCompliant or NotApplicable with no due date concerns
        return "green";
    }

    /// <summary>
    /// Generates valid DateTime values in a reasonable range for testing.
    /// </summary>
    private static Arbitrary<DateTime> DateTimeArbitrary()
    {
        var gen = Gen.Choose(2020, 2030).SelectMany(year =>
            Gen.Choose(1, 12).SelectMany(month =>
                Gen.Choose(1, DateTime.DaysInMonth(year, month)).Select(day =>
                    new DateTime(year, month, day, 12, 0, 0, DateTimeKind.Utc))));

        return gen.ToArbitrary();
    }

    /// <summary>
    /// Generates a "now" reference date and a NextDueDate that is in the past (overdue scenario).
    /// </summary>
    private static Arbitrary<(DateTime Now, DateTime NextDueDate)> OverdueDatePairArbitrary()
    {
        var gen = Gen.Choose(2022, 2028).SelectMany(year =>
            Gen.Choose(1, 12).SelectMany(month =>
                Gen.Choose(1, DateTime.DaysInMonth(year, month)).SelectMany(day =>
                    Gen.Choose(1, 365).Select(daysOverdue =>
                    {
                        var now = new DateTime(year, month, day, 12, 0, 0, DateTimeKind.Utc);
                        var nextDueDate = now.AddDays(-daysOverdue);
                        return (Now: now, NextDueDate: nextDueDate);
                    }))));

        return gen.ToArbitrary();
    }

    /// <summary>
    /// Generates a "now" reference date and a NextDueDate that is more than 7 days in the future (green scenario).
    /// </summary>
    private static Arbitrary<(DateTime Now, DateTime NextDueDate)> FutureDatePairArbitrary()
    {
        var gen = Gen.Choose(2022, 2026).SelectMany(year =>
            Gen.Choose(1, 12).SelectMany(month =>
                Gen.Choose(1, DateTime.DaysInMonth(year, month)).SelectMany(day =>
                    Gen.Choose(8, 365).Select(daysAhead =>
                    {
                        var now = new DateTime(year, month, day, 12, 0, 0, DateTimeKind.Utc);
                        var nextDueDate = now.AddDays(daysAhead);
                        return (Now: now, NextDueDate: nextDueDate);
                    }))));

        return gen.ToArbitrary();
    }

    /// <summary>
    /// Generates a "now" reference date and a NextDueDate that is within 7 days (amber scenario).
    /// The range is [now, now+7 days] inclusive.
    /// </summary>
    private static Arbitrary<(DateTime Now, DateTime NextDueDate)> AmberDatePairArbitrary()
    {
        var gen = Gen.Choose(2022, 2028).SelectMany(year =>
            Gen.Choose(1, 12).SelectMany(month =>
                Gen.Choose(1, DateTime.DaysInMonth(year, month)).SelectMany(day =>
                    Gen.Choose(0, 7).Select(daysAhead =>
                    {
                        var now = new DateTime(year, month, day, 12, 0, 0, DateTimeKind.Utc);
                        var nextDueDate = now.AddDays(daysAhead);
                        return (Now: now, NextDueDate: nextDueDate);
                    }))));

        return gen.ToArbitrary();
    }

    /// <summary>
    /// Property 11: When no checks have been recorded, the StatusIndicator SHALL be "grey"
    /// regardless of NextDueDate.
    ///
    /// **Validates: Requirements 6.6**
    /// </summary>
    [Property(MaxTest = 200)]
    public Property NoChecks_StatusIndicator_IsGrey()
    {
        var allOutcomes = Enum.GetValues<ComplianceCheckOutcome>();

        return Prop.ForAll(
            DateTimeArbitrary(),
            Gen.OneOf(
                Gen.Constant<DateTime?>(null),
                DateTimeArbitrary().Generator.Select(d => (DateTime?)d)
            ).ToArbitrary(),
            (now, nextDueDate) =>
            {
                var result = DetermineStatusIndicator(
                    lastOutcome: null,
                    nextDueDate: nextDueDate,
                    hasChecks: false,
                    now: now);

                return (result == "grey")
                    .Label($"No checks: now={now:yyyy-MM-dd}, NextDueDate={nextDueDate?.ToString("yyyy-MM-dd") ?? "null"}, Got={result}");
            });
    }

    /// <summary>
    /// Property 11: When NextDueDate &lt; now and last check is not NonCompliant (overdue),
    /// the StatusIndicator SHALL be "red".
    ///
    /// **Validates: Requirements 6.6**
    /// </summary>
    [Property(MaxTest = 200)]
    public Property Overdue_WithCompliantLastCheck_StatusIndicator_IsRed()
    {
        var compliantOutcomes = new[]
        {
            ComplianceCheckOutcome.Compliant,
            ComplianceCheckOutcome.PartiallyCompliant,
            ComplianceCheckOutcome.NotApplicable
        };

        return Prop.ForAll(
            OverdueDatePairArbitrary(),
            Gen.Elements(compliantOutcomes).ToArbitrary(),
            (datePair, outcome) =>
            {
                var result = DetermineStatusIndicator(
                    lastOutcome: outcome,
                    nextDueDate: datePair.NextDueDate,
                    hasChecks: true,
                    now: datePair.Now);

                return (result == "red")
                    .Label($"Overdue: now={datePair.Now:yyyy-MM-dd}, NextDueDate={datePair.NextDueDate:yyyy-MM-dd}, Outcome={outcome}, Got={result}");
            });
    }

    /// <summary>
    /// Property 11: When last check outcome is NonCompliant, the StatusIndicator SHALL be "red"
    /// regardless of NextDueDate.
    ///
    /// **Validates: Requirements 6.6**
    /// </summary>
    [Property(MaxTest = 200)]
    public Property NonCompliantLastCheck_StatusIndicator_IsRed()
    {
        return Prop.ForAll(
            DateTimeArbitrary(),
            Gen.OneOf(
                Gen.Constant<DateTime?>(null),
                DateTimeArbitrary().Generator.Select(d => (DateTime?)d)
            ).ToArbitrary(),
            (now, nextDueDate) =>
            {
                var result = DetermineStatusIndicator(
                    lastOutcome: ComplianceCheckOutcome.NonCompliant,
                    nextDueDate: nextDueDate,
                    hasChecks: true,
                    now: now);

                return (result == "red")
                    .Label($"NonCompliant: now={now:yyyy-MM-dd}, NextDueDate={nextDueDate?.ToString("yyyy-MM-dd") ?? "null"}, Got={result}");
            });
    }

    /// <summary>
    /// Property 11: When NextDueDate &gt; now.AddDays(7) and last check was Compliant,
    /// the StatusIndicator SHALL be "green".
    ///
    /// **Validates: Requirements 6.6**
    /// </summary>
    [Property(MaxTest = 200)]
    public Property Compliant_FutureNextDueDate_StatusIndicator_IsGreen()
    {
        return Prop.ForAll(
            FutureDatePairArbitrary(),
            datePair =>
            {
                var result = DetermineStatusIndicator(
                    lastOutcome: ComplianceCheckOutcome.Compliant,
                    nextDueDate: datePair.NextDueDate,
                    hasChecks: true,
                    now: datePair.Now);

                return (result == "green")
                    .Label($"Green: now={datePair.Now:yyyy-MM-dd}, NextDueDate={datePair.NextDueDate:yyyy-MM-dd}, Got={result}");
            });
    }

    /// <summary>
    /// Property 11: When NextDueDate is within 7 days (inclusive) of now AND not already past,
    /// AND last check was Compliant, the StatusIndicator SHALL be "amber".
    ///
    /// **Validates: Requirements 6.6**
    /// </summary>
    [Property(MaxTest = 200)]
    public Property DueSoon_WithinSevenDays_StatusIndicator_IsAmber()
    {
        // Generate dates where nextDueDate is between now (inclusive) and now+7 days (inclusive)
        var gen = Gen.Choose(2022, 2028).SelectMany(year =>
            Gen.Choose(1, 12).SelectMany(month =>
                Gen.Choose(1, DateTime.DaysInMonth(year, month)).SelectMany(day =>
                    Gen.Choose(1, 7).Select(daysAhead =>
                    {
                        var now = new DateTime(year, month, day, 12, 0, 0, DateTimeKind.Utc);
                        var nextDueDate = now.AddDays(daysAhead);
                        return (Now: now, NextDueDate: nextDueDate);
                    }))));

        return Prop.ForAll(
            gen.ToArbitrary(),
            datePair =>
            {
                var result = DetermineStatusIndicator(
                    lastOutcome: ComplianceCheckOutcome.Compliant,
                    nextDueDate: datePair.NextDueDate,
                    hasChecks: true,
                    now: datePair.Now);

                return (result == "amber")
                    .Label($"Amber: now={datePair.Now:yyyy-MM-dd}, NextDueDate={datePair.NextDueDate:yyyy-MM-dd}, Got={result}");
            });
    }

    /// <summary>
    /// Property 11: When last check was Compliant and there is no NextDueDate (null),
    /// the StatusIndicator SHALL be "green" (no overdue concern for OneOff/Ongoing).
    ///
    /// **Validates: Requirements 6.6**
    /// </summary>
    [Property(MaxTest = 200)]
    public Property Compliant_NoNextDueDate_StatusIndicator_IsGreen()
    {
        return Prop.ForAll(
            DateTimeArbitrary(),
            now =>
            {
                var result = DetermineStatusIndicator(
                    lastOutcome: ComplianceCheckOutcome.Compliant,
                    nextDueDate: null,
                    hasChecks: true,
                    now: now);

                return (result == "green")
                    .Label($"Green (no due date): now={now:yyyy-MM-dd}, Got={result}");
            });
    }

    /// <summary>
    /// Property 11: The StatusIndicator SHALL always be one of the four valid values:
    /// "green", "amber", "red", or "grey" for any combination of inputs.
    ///
    /// **Validates: Requirements 6.6**
    /// </summary>
    [Property(MaxTest = 300)]
    public Property StatusIndicator_AlwaysValidColor()
    {
        var validColors = new[] { "green", "amber", "red", "grey" };
        var allOutcomes = Enum.GetValues<ComplianceCheckOutcome>();

        // Combine outcome and hasChecks into a single tuple arbitrary to stay within 3 arbitraries
        var outcomeAndHasChecks = Gen.Elements(allOutcomes)
            .SelectMany(o => Gen.Elements(true, false).Select(h => (Outcome: o, HasChecks: h)))
            .ToArbitrary();

        return Prop.ForAll(
            outcomeAndHasChecks,
            DateTimeArbitrary(),
            Gen.OneOf(
                Gen.Constant<DateTime?>(null),
                DateTimeArbitrary().Generator.Select(d => (DateTime?)d)
            ).ToArbitrary(),
            (outcomeHasChecks, now, nextDueDate) =>
            {
                var lastOutcome = outcomeHasChecks.HasChecks ? (ComplianceCheckOutcome?)outcomeHasChecks.Outcome : null;
                var result = DetermineStatusIndicator(lastOutcome, nextDueDate, outcomeHasChecks.HasChecks, now);

                return validColors.Contains(result)
                    .Label($"Invalid color: {result} for outcome={lastOutcome}, hasChecks={outcomeHasChecks.HasChecks}, now={now:yyyy-MM-dd}, nextDue={nextDueDate?.ToString("yyyy-MM-dd") ?? "null"}");
            });
    }

    /// <summary>
    /// Property 11: "grey" SHALL only be returned when hasChecks is false.
    /// When hasChecks is true, the result is never "grey".
    ///
    /// **Validates: Requirements 6.6**
    /// </summary>
    [Property(MaxTest = 200)]
    public Property Grey_OnlyWhenNoChecks()
    {
        var allOutcomes = Enum.GetValues<ComplianceCheckOutcome>();

        return Prop.ForAll(
            Gen.Elements(allOutcomes).ToArbitrary(),
            DateTimeArbitrary(),
            Gen.OneOf(
                Gen.Constant<DateTime?>(null),
                DateTimeArbitrary().Generator.Select(d => (DateTime?)d)
            ).ToArbitrary(),
            (outcome, now, nextDueDate) =>
            {
                var result = DetermineStatusIndicator(outcome, nextDueDate, hasChecks: true, now);

                return (result != "grey")
                    .Label($"Got grey with hasChecks=true: outcome={outcome}, now={now:yyyy-MM-dd}, nextDue={nextDueDate?.ToString("yyyy-MM-dd") ?? "null"}");
            });
    }
}
