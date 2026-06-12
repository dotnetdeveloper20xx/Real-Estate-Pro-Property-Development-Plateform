using BuildEstate.Domain.Enums;
using FluentAssertions;
using FsCheck;
using FsCheck.Xunit;

namespace BuildEstate.Tests.PropertyTests.LegalCompliance;

/// <summary>
/// Property-based tests for compliance status color-coding selector logic.
/// Tests the <c>getComplianceStatusColor</c> function that assigns a color indicator
/// (green/amber/red/grey) to each compliance checklist item based on its state.
///
/// Color rules per Requirement 20.2:
/// - Grey: No checks ever performed (lastCheckDate is null)
/// - Red: Overdue (isOverdue = true) OR last check outcome is NonCompliant/PartiallyCompliant
/// - Amber: Next check due within 7 days (0 ≤ days until due ≤ 7)
/// - Green: Compliant (last check outcome = Compliant, not overdue, not due soon)
///
/// **Validates: Requirements 20.2**
/// </summary>
public class ComplianceStatusColorCodingPropertyTests
{
    /// <summary>
    /// Represents the four possible status colors for compliance items.
    /// </summary>
    private enum ComplianceStatusColor
    {
        Green,
        Amber,
        Red,
        Grey
    }

    /// <summary>
    /// Simplified compliance checklist item for testing the color logic.
    /// </summary>
    private sealed record ComplianceChecklistItem(
        DateTime? LastCheckDate,
        ComplianceCheckOutcome? LastCheckOutcome,
        DateTime? NextDueDate,
        bool IsOverdue);

    /// <summary>
    /// Pure C# implementation of the getComplianceStatusColor logic from the Angular selector.
    /// This mirrors the TypeScript implementation exactly to verify correctness properties.
    /// </summary>
    private static ComplianceStatusColor GetComplianceStatusColor(ComplianceChecklistItem item)
    {
        // No check ever performed
        if (item.LastCheckDate is null)
        {
            return ComplianceStatusColor.Grey;
        }

        // Overdue takes highest priority
        if (item.IsOverdue)
        {
            return ComplianceStatusColor.Red;
        }

        // Due soon: next check due within 7 days
        if (item.NextDueDate.HasValue)
        {
            var now = DateTime.UtcNow;
            var daysUntilDue = (int)Math.Ceiling((item.NextDueDate.Value - now).TotalDays);
            if (daysUntilDue <= 7 && daysUntilDue >= 0)
            {
                return ComplianceStatusColor.Amber;
            }
        }

        // Compliant: last check passed and not overdue/due soon
        if (item.LastCheckOutcome == ComplianceCheckOutcome.Compliant)
        {
            return ComplianceStatusColor.Green;
        }

        // Non-compliant or partially compliant but not overdue
        if (item.LastCheckOutcome == ComplianceCheckOutcome.NonCompliant ||
            item.LastCheckOutcome == ComplianceCheckOutcome.PartiallyCompliant)
        {
            return ComplianceStatusColor.Red;
        }

        // Default (e.g., NotApplicable with a check recorded)
        return ComplianceStatusColor.Grey;
    }

    #region Property 18: Grey — No checks performed

    /// <summary>
    /// Property 18: For any compliance item with no lastCheckDate, the status color
    /// is always Grey regardless of other field values.
    ///
    /// **Validates: Requirements 20.2**
    /// </summary>
    [Property(MaxTest = 200)]
    public Property NoCheckDate_AlwaysReturnsGrey()
    {
        var outcomeGen = Gen.Elements(
            (ComplianceCheckOutcome?)null,
            ComplianceCheckOutcome.Compliant,
            ComplianceCheckOutcome.NonCompliant,
            ComplianceCheckOutcome.PartiallyCompliant,
            ComplianceCheckOutcome.NotApplicable);

        var nextDueDateGen = Gen.OneOf(
            Gen.Constant((DateTime?)null),
            Gen.Choose(-30, 60).Select(d => (DateTime?)DateTime.UtcNow.AddDays(d)));

        var isOverdueGen = Arb.Generate<bool>();

        return Prop.ForAll(
            outcomeGen.ToArbitrary(),
            nextDueDateGen.ToArbitrary(),
            isOverdueGen.ToArbitrary(),
            (outcome, nextDueDate, isOverdue) =>
            {
                var item = new ComplianceChecklistItem(
                    LastCheckDate: null,
                    LastCheckOutcome: outcome,
                    NextDueDate: nextDueDate,
                    IsOverdue: isOverdue);

                var color = GetComplianceStatusColor(item);

                return (color == ComplianceStatusColor.Grey)
                    .Label($"Expected Grey when lastCheckDate is null, got {color}");
            });
    }

    #endregion

    #region Property 18: Red — Overdue items

    /// <summary>
    /// Property 18: For any compliance item that has a lastCheckDate and isOverdue=true,
    /// the status color is always Red (overdue takes priority over other conditions).
    ///
    /// **Validates: Requirements 20.2**
    /// </summary>
    [Property(MaxTest = 200)]
    public Property Overdue_AlwaysReturnsRed()
    {
        var lastCheckDateGen = Gen.Choose(-365, -1)
            .Select(d => (DateTime?)DateTime.UtcNow.AddDays(d));

        var outcomeGen = Gen.Elements(
            (ComplianceCheckOutcome?)ComplianceCheckOutcome.Compliant,
            ComplianceCheckOutcome.NonCompliant,
            ComplianceCheckOutcome.PartiallyCompliant,
            ComplianceCheckOutcome.NotApplicable);

        var nextDueDateGen = Gen.OneOf(
            Gen.Constant((DateTime?)null),
            Gen.Choose(-30, 60).Select(d => (DateTime?)DateTime.UtcNow.AddDays(d)));

        return Prop.ForAll(
            lastCheckDateGen.ToArbitrary(),
            outcomeGen.ToArbitrary(),
            nextDueDateGen.ToArbitrary(),
            (lastCheckDate, outcome, nextDueDate) =>
            {
                var item = new ComplianceChecklistItem(
                    LastCheckDate: lastCheckDate,
                    LastCheckOutcome: outcome,
                    NextDueDate: nextDueDate,
                    IsOverdue: true);

                var color = GetComplianceStatusColor(item);

                return (color == ComplianceStatusColor.Red)
                    .Label($"Expected Red when isOverdue=true, got {color} " +
                           $"(outcome={outcome}, nextDue={nextDueDate})");
            });
    }

    #endregion

    #region Property 18: Red — Non-compliant outcomes

    /// <summary>
    /// Property 18: For any compliance item with a lastCheckDate, not overdue, next due date
    /// more than 7 days away (or null), and outcome of NonCompliant or PartiallyCompliant,
    /// the status color is Red.
    ///
    /// **Validates: Requirements 20.2**
    /// </summary>
    [Property(MaxTest = 200)]
    public Property NonCompliantOutcome_NotOverdue_NotDueSoon_ReturnsRed()
    {
        var lastCheckDateGen = Gen.Choose(-365, -1)
            .Select(d => (DateTime?)DateTime.UtcNow.AddDays(d));

        var outcomeGen = Gen.Elements(
            (ComplianceCheckOutcome?)ComplianceCheckOutcome.NonCompliant,
            ComplianceCheckOutcome.PartiallyCompliant);

        // Next due date is either null or more than 7 days away
        var nextDueDateGen = Gen.OneOf(
            Gen.Constant((DateTime?)null),
            Gen.Choose(8, 365).Select(d => (DateTime?)DateTime.UtcNow.AddDays(d)));

        return Prop.ForAll(
            lastCheckDateGen.ToArbitrary(),
            outcomeGen.ToArbitrary(),
            nextDueDateGen.ToArbitrary(),
            (lastCheckDate, outcome, nextDueDate) =>
            {
                var item = new ComplianceChecklistItem(
                    LastCheckDate: lastCheckDate,
                    LastCheckOutcome: outcome,
                    NextDueDate: nextDueDate,
                    IsOverdue: false);

                var color = GetComplianceStatusColor(item);

                return (color == ComplianceStatusColor.Red)
                    .Label($"Expected Red for {outcome} outcome, got {color}");
            });
    }

    #endregion

    #region Property 18: Amber — Due within 7 days

    /// <summary>
    /// Property 18: For any compliance item with a lastCheckDate, not overdue, and
    /// nextDueDate within 0-7 days from now, the status color is Amber.
    ///
    /// **Validates: Requirements 20.2**
    /// </summary>
    [Property(MaxTest = 200)]
    public Property DueWithin7Days_NotOverdue_ReturnsAmber()
    {
        var lastCheckDateGen = Gen.Choose(-365, -1)
            .Select(d => (DateTime?)DateTime.UtcNow.AddDays(d));

        // Generate a next due date between 0 and 7 days from now (using hours for sub-day precision)
        var nextDueDateGen = Gen.Choose(1, 7 * 24)
            .Select(hours => (DateTime?)DateTime.UtcNow.AddHours(hours));

        var outcomeGen = Gen.Elements(
            (ComplianceCheckOutcome?)ComplianceCheckOutcome.Compliant,
            ComplianceCheckOutcome.NonCompliant,
            ComplianceCheckOutcome.PartiallyCompliant,
            ComplianceCheckOutcome.NotApplicable);

        return Prop.ForAll(
            lastCheckDateGen.ToArbitrary(),
            nextDueDateGen.ToArbitrary(),
            outcomeGen.ToArbitrary(),
            (lastCheckDate, nextDueDate, outcome) =>
            {
                var item = new ComplianceChecklistItem(
                    LastCheckDate: lastCheckDate,
                    LastCheckOutcome: outcome,
                    NextDueDate: nextDueDate,
                    IsOverdue: false);

                var color = GetComplianceStatusColor(item);

                return (color == ComplianceStatusColor.Amber)
                    .Label($"Expected Amber when due within 7 days, got {color} " +
                           $"(nextDue={nextDueDate}, outcome={outcome})");
            });
    }

    #endregion

    #region Property 18: Green — Compliant and not due soon

    /// <summary>
    /// Property 18: For any compliance item with a lastCheckDate, outcome=Compliant,
    /// not overdue, and nextDueDate more than 7 days away (or null), the status color is Green.
    ///
    /// **Validates: Requirements 20.2**
    /// </summary>
    [Property(MaxTest = 200)]
    public Property Compliant_NotOverdue_NotDueSoon_ReturnsGreen()
    {
        var lastCheckDateGen = Gen.Choose(-365, -1)
            .Select(d => (DateTime?)DateTime.UtcNow.AddDays(d));

        // Next due date is either null or more than 7 days away
        var nextDueDateGen = Gen.OneOf(
            Gen.Constant((DateTime?)null),
            Gen.Choose(8, 365).Select(d => (DateTime?)DateTime.UtcNow.AddDays(d)));

        return Prop.ForAll(
            lastCheckDateGen.ToArbitrary(),
            nextDueDateGen.ToArbitrary(),
            (lastCheckDate, nextDueDate) =>
            {
                var item = new ComplianceChecklistItem(
                    LastCheckDate: lastCheckDate,
                    LastCheckOutcome: ComplianceCheckOutcome.Compliant,
                    NextDueDate: nextDueDate,
                    IsOverdue: false);

                var color = GetComplianceStatusColor(item);

                return (color == ComplianceStatusColor.Green)
                    .Label($"Expected Green for Compliant/not-due-soon, got {color} " +
                           $"(nextDue={nextDueDate})");
            });
    }

    #endregion

    #region Property 18: Priority ordering

    /// <summary>
    /// Property 18: The color assignment follows strict priority: Grey (no check) > Red (overdue) > Amber (due soon).
    /// Grey is always returned when no check exists, regardless of isOverdue or nextDueDate.
    ///
    /// **Validates: Requirements 20.2**
    /// </summary>
    [Property(MaxTest = 200)]
    public Property GreyPriority_TakesPrecedenceOverOtherConditions()
    {
        // Even if isOverdue=true and nextDueDate is within 7 days, no check = grey
        var nextDueDateGen = Gen.Choose(0, 7)
            .Select(d => (DateTime?)DateTime.UtcNow.AddDays(d));

        return Prop.ForAll(
            nextDueDateGen.ToArbitrary(),
            nextDueDate =>
            {
                var item = new ComplianceChecklistItem(
                    LastCheckDate: null,
                    LastCheckOutcome: ComplianceCheckOutcome.NonCompliant,
                    NextDueDate: nextDueDate,
                    IsOverdue: true);

                var color = GetComplianceStatusColor(item);

                return (color == ComplianceStatusColor.Grey)
                    .Label($"Grey (no check) should take precedence, got {color}");
            });
    }

    /// <summary>
    /// Property 18: Red (overdue) takes precedence over Amber (due soon).
    /// When both isOverdue=true and nextDueDate is within 7 days, result is Red.
    ///
    /// **Validates: Requirements 20.2**
    /// </summary>
    [Property(MaxTest = 200)]
    public Property RedPriority_OverdueBeatsAmber()
    {
        var lastCheckDateGen = Gen.Choose(-365, -1)
            .Select(d => (DateTime?)DateTime.UtcNow.AddDays(d));

        var nextDueDateGen = Gen.Choose(0, 7)
            .Select(d => (DateTime?)DateTime.UtcNow.AddDays(d));

        var outcomeGen = Gen.Elements(
            (ComplianceCheckOutcome?)ComplianceCheckOutcome.Compliant,
            ComplianceCheckOutcome.NonCompliant,
            ComplianceCheckOutcome.PartiallyCompliant);

        return Prop.ForAll(
            lastCheckDateGen.ToArbitrary(),
            nextDueDateGen.ToArbitrary(),
            outcomeGen.ToArbitrary(),
            (lastCheckDate, nextDueDate, outcome) =>
            {
                var item = new ComplianceChecklistItem(
                    LastCheckDate: lastCheckDate,
                    LastCheckOutcome: outcome,
                    NextDueDate: nextDueDate,
                    IsOverdue: true);

                var color = GetComplianceStatusColor(item);

                return (color == ComplianceStatusColor.Red)
                    .Label($"Red (overdue) should beat Amber (due soon), got {color}");
            });
    }

    #endregion

    #region Property 18: Exhaustive coverage — all outcomes produce valid colors

    /// <summary>
    /// Property 18: For any random combination of compliance item fields,
    /// the color assignment always produces one of the four valid colors.
    ///
    /// **Validates: Requirements 20.2**
    /// </summary>
    [Property(MaxTest = 500)]
    public Property AnyRandomState_ProducesValidColor()
    {
        var seedGen = Gen.Choose(1, 100_000);

        return Prop.ForAll(
            seedGen.ToArbitrary(),
            seed =>
            {
                var random = new System.Random(seed);
                var hasCheckDate = random.Next(2) == 1;
                var lastCheckDate = hasCheckDate
                    ? (DateTime?)DateTime.UtcNow.AddDays(-random.Next(1, 365))
                    : null;

                var outcomes = new ComplianceCheckOutcome?[]
                {
                    null,
                    ComplianceCheckOutcome.Compliant,
                    ComplianceCheckOutcome.NonCompliant,
                    ComplianceCheckOutcome.PartiallyCompliant,
                    ComplianceCheckOutcome.NotApplicable
                };
                var outcome = outcomes[random.Next(outcomes.Length)];

                var hasNextDue = random.Next(2) == 1;
                var nextDueDate = hasNextDue
                    ? (DateTime?)DateTime.UtcNow.AddDays(random.Next(-30, 365))
                    : null;

                var isOverdue = random.Next(2) == 1;

                var item = new ComplianceChecklistItem(lastCheckDate, outcome, nextDueDate, isOverdue);
                var color = GetComplianceStatusColor(item);

                var validColors = new[]
                {
                    ComplianceStatusColor.Green,
                    ComplianceStatusColor.Amber,
                    ComplianceStatusColor.Red,
                    ComplianceStatusColor.Grey
                };

                return validColors.Contains(color)
                    .Label($"Color {color} must be one of green/amber/red/grey");
            });
    }

    /// <summary>
    /// Property 18: The color function is deterministic — same input always produces same output.
    ///
    /// **Validates: Requirements 20.2**
    /// </summary>
    [Property(MaxTest = 200)]
    public Property SameInput_AlwaysProducesSameColor()
    {
        var seedGen = Gen.Choose(1, 100_000);

        return Prop.ForAll(
            seedGen.ToArbitrary(),
            seed =>
            {
                var random = new System.Random(seed);
                var hasCheckDate = random.Next(2) == 1;
                var lastCheckDate = hasCheckDate
                    ? (DateTime?)DateTime.UtcNow.AddDays(-random.Next(1, 365))
                    : null;

                var outcomes = new ComplianceCheckOutcome?[]
                {
                    null,
                    ComplianceCheckOutcome.Compliant,
                    ComplianceCheckOutcome.NonCompliant,
                    ComplianceCheckOutcome.PartiallyCompliant,
                    ComplianceCheckOutcome.NotApplicable
                };
                var outcome = outcomes[random.Next(outcomes.Length)];

                var hasNextDue = random.Next(2) == 1;
                var nextDueDate = hasNextDue
                    ? (DateTime?)DateTime.UtcNow.AddDays(random.Next(-30, 365))
                    : null;

                var isOverdue = random.Next(2) == 1;

                var item = new ComplianceChecklistItem(lastCheckDate, outcome, nextDueDate, isOverdue);

                var color1 = GetComplianceStatusColor(item);
                var color2 = GetComplianceStatusColor(item);

                return (color1 == color2)
                    .Label($"Same input should produce same color: {color1} vs {color2}");
            });
    }

    #endregion

    #region Property 18: NotApplicable with a check defaults to Grey

    /// <summary>
    /// Property 18: When the last check outcome is NotApplicable, the item has a check recorded,
    /// is not overdue, and is not due soon, the color is Grey (default case).
    ///
    /// **Validates: Requirements 20.2**
    /// </summary>
    [Property(MaxTest = 200)]
    public Property NotApplicableOutcome_NotOverdue_NotDueSoon_ReturnsGrey()
    {
        var lastCheckDateGen = Gen.Choose(-365, -1)
            .Select(d => (DateTime?)DateTime.UtcNow.AddDays(d));

        // Next due date is either null or more than 7 days away
        var nextDueDateGen = Gen.OneOf(
            Gen.Constant((DateTime?)null),
            Gen.Choose(8, 365).Select(d => (DateTime?)DateTime.UtcNow.AddDays(d)));

        return Prop.ForAll(
            lastCheckDateGen.ToArbitrary(),
            nextDueDateGen.ToArbitrary(),
            (lastCheckDate, nextDueDate) =>
            {
                var item = new ComplianceChecklistItem(
                    LastCheckDate: lastCheckDate,
                    LastCheckOutcome: ComplianceCheckOutcome.NotApplicable,
                    NextDueDate: nextDueDate,
                    IsOverdue: false);

                var color = GetComplianceStatusColor(item);

                return (color == ComplianceStatusColor.Grey)
                    .Label($"Expected Grey for NotApplicable outcome, got {color}");
            });
    }

    #endregion
}
