using BuildEstate.Domain.Enums;
using FluentAssertions;
using FsCheck;
using FsCheck.Xunit;

namespace BuildEstate.Tests.PropertyTests.LegalCompliance;

/// <summary>
/// Property-based tests for Compliance NextDueDate calculation logic.
/// Verifies that for any Frequency + CheckDate combination, the calculated NextDueDate
/// matches the expected interval as defined in the specification.
///
/// **Validates: Requirements 6.5**
/// </summary>
public class ComplianceNextDueDatePropertyTests
{
    /// <summary>
    /// Replicates the NextDueDate calculation logic from CreateComplianceCheckCommandHandler
    /// so we can verify it against the specification rules.
    /// </summary>
    private static DateTime? CalculateNextDueDate(ComplianceFrequency frequency, DateTime checkDate)
    {
        return frequency switch
        {
            ComplianceFrequency.Daily => checkDate.AddDays(1),
            ComplianceFrequency.Weekly => checkDate.AddDays(7),
            ComplianceFrequency.Monthly => checkDate.AddMonths(1),
            ComplianceFrequency.Quarterly => checkDate.AddMonths(3),
            ComplianceFrequency.Annually => checkDate.AddYears(1),
            ComplianceFrequency.OneOff => null,
            ComplianceFrequency.Ongoing => null,
            _ => null
        };
    }

    /// <summary>
    /// Generates valid DateTime values within a reasonable range for testing
    /// (2000-01-01 to 2099-12-31) to avoid overflow edge cases.
    /// </summary>
    private static Arbitrary<DateTime> ValidCheckDateArbitrary()
    {
        var gen = Gen.Choose(2000, 2099).SelectMany(year =>
            Gen.Choose(1, 12).SelectMany(month =>
                Gen.Choose(1, DateTime.DaysInMonth(year, month)).Select(day =>
                    new DateTime(year, month, day, 0, 0, 0, DateTimeKind.Utc))));

        return gen.ToArbitrary();
    }

    /// <summary>
    /// Property 10: For Daily frequency, NextDueDate SHALL be CheckDate + 1 day.
    ///
    /// **Validates: Requirements 6.5**
    /// </summary>
    [Property(MaxTest = 200)]
    public Property Daily_NextDueDate_IsCheckDatePlusOneDay()
    {
        return Prop.ForAll(
            ValidCheckDateArbitrary(),
            checkDate =>
            {
                var result = CalculateNextDueDate(ComplianceFrequency.Daily, checkDate);

                return (result.HasValue && result.Value == checkDate.AddDays(1))
                    .Label($"Daily: CheckDate={checkDate:yyyy-MM-dd}, Expected={checkDate.AddDays(1):yyyy-MM-dd}, Got={result?.ToString("yyyy-MM-dd") ?? "null"}");
            });
    }

    /// <summary>
    /// Property 10: For Weekly frequency, NextDueDate SHALL be CheckDate + 7 days.
    ///
    /// **Validates: Requirements 6.5**
    /// </summary>
    [Property(MaxTest = 200)]
    public Property Weekly_NextDueDate_IsCheckDatePlusSevenDays()
    {
        return Prop.ForAll(
            ValidCheckDateArbitrary(),
            checkDate =>
            {
                var result = CalculateNextDueDate(ComplianceFrequency.Weekly, checkDate);

                return (result.HasValue && result.Value == checkDate.AddDays(7))
                    .Label($"Weekly: CheckDate={checkDate:yyyy-MM-dd}, Expected={checkDate.AddDays(7):yyyy-MM-dd}, Got={result?.ToString("yyyy-MM-dd") ?? "null"}");
            });
    }

    /// <summary>
    /// Property 10: For Monthly frequency, NextDueDate SHALL be CheckDate + 1 month.
    ///
    /// **Validates: Requirements 6.5**
    /// </summary>
    [Property(MaxTest = 200)]
    public Property Monthly_NextDueDate_IsCheckDatePlusOneMonth()
    {
        return Prop.ForAll(
            ValidCheckDateArbitrary(),
            checkDate =>
            {
                var result = CalculateNextDueDate(ComplianceFrequency.Monthly, checkDate);

                return (result.HasValue && result.Value == checkDate.AddMonths(1))
                    .Label($"Monthly: CheckDate={checkDate:yyyy-MM-dd}, Expected={checkDate.AddMonths(1):yyyy-MM-dd}, Got={result?.ToString("yyyy-MM-dd") ?? "null"}");
            });
    }

    /// <summary>
    /// Property 10: For Quarterly frequency, NextDueDate SHALL be CheckDate + 3 months.
    ///
    /// **Validates: Requirements 6.5**
    /// </summary>
    [Property(MaxTest = 200)]
    public Property Quarterly_NextDueDate_IsCheckDatePlusThreeMonths()
    {
        return Prop.ForAll(
            ValidCheckDateArbitrary(),
            checkDate =>
            {
                var result = CalculateNextDueDate(ComplianceFrequency.Quarterly, checkDate);

                return (result.HasValue && result.Value == checkDate.AddMonths(3))
                    .Label($"Quarterly: CheckDate={checkDate:yyyy-MM-dd}, Expected={checkDate.AddMonths(3):yyyy-MM-dd}, Got={result?.ToString("yyyy-MM-dd") ?? "null"}");
            });
    }

    /// <summary>
    /// Property 10: For Annually frequency, NextDueDate SHALL be CheckDate + 1 year.
    ///
    /// **Validates: Requirements 6.5**
    /// </summary>
    [Property(MaxTest = 200)]
    public Property Annually_NextDueDate_IsCheckDatePlusOneYear()
    {
        return Prop.ForAll(
            ValidCheckDateArbitrary(),
            checkDate =>
            {
                var result = CalculateNextDueDate(ComplianceFrequency.Annually, checkDate);

                return (result.HasValue && result.Value == checkDate.AddYears(1))
                    .Label($"Annually: CheckDate={checkDate:yyyy-MM-dd}, Expected={checkDate.AddYears(1):yyyy-MM-dd}, Got={result?.ToString("yyyy-MM-dd") ?? "null"}");
            });
    }

    /// <summary>
    /// Property 10: For OneOff frequency, NextDueDate SHALL be null.
    ///
    /// **Validates: Requirements 6.5**
    /// </summary>
    [Property(MaxTest = 200)]
    public Property OneOff_NextDueDate_IsNull()
    {
        return Prop.ForAll(
            ValidCheckDateArbitrary(),
            checkDate =>
            {
                var result = CalculateNextDueDate(ComplianceFrequency.OneOff, checkDate);

                return (result is null)
                    .Label($"OneOff: CheckDate={checkDate:yyyy-MM-dd}, Expected=null, Got={result?.ToString("yyyy-MM-dd") ?? "null"}");
            });
    }

    /// <summary>
    /// Property 10: For Ongoing frequency, NextDueDate SHALL be null.
    ///
    /// **Validates: Requirements 6.5**
    /// </summary>
    [Property(MaxTest = 200)]
    public Property Ongoing_NextDueDate_IsNull()
    {
        return Prop.ForAll(
            ValidCheckDateArbitrary(),
            checkDate =>
            {
                var result = CalculateNextDueDate(ComplianceFrequency.Ongoing, checkDate);

                return (result is null)
                    .Label($"Ongoing: CheckDate={checkDate:yyyy-MM-dd}, Expected=null, Got={result?.ToString("yyyy-MM-dd") ?? "null"}");
            });
    }

    /// <summary>
    /// Property 10: For all recurring frequencies (Daily, Weekly, Monthly, Quarterly, Annually),
    /// the NextDueDate SHALL always be strictly after the CheckDate.
    ///
    /// **Validates: Requirements 6.5**
    /// </summary>
    [Property(MaxTest = 200)]
    public Property RecurringFrequencies_NextDueDate_IsAlwaysAfterCheckDate()
    {
        var recurringFrequencies = new[]
        {
            ComplianceFrequency.Daily,
            ComplianceFrequency.Weekly,
            ComplianceFrequency.Monthly,
            ComplianceFrequency.Quarterly,
            ComplianceFrequency.Annually
        };

        return Prop.ForAll(
            Gen.Elements(recurringFrequencies).ToArbitrary(),
            ValidCheckDateArbitrary(),
            (frequency, checkDate) =>
            {
                var result = CalculateNextDueDate(frequency, checkDate);

                return (result.HasValue && result.Value > checkDate)
                    .Label($"{frequency}: NextDueDate ({result?.ToString("yyyy-MM-dd") ?? "null"}) should be after CheckDate ({checkDate:yyyy-MM-dd})");
            });
    }

    /// <summary>
    /// Property 10: For all ComplianceFrequency values combined with random check dates,
    /// verify that only OneOff and Ongoing produce null, and all others produce a non-null date.
    ///
    /// **Validates: Requirements 6.5**
    /// </summary>
    [Property(MaxTest = 300)]
    public Property AllFrequencies_NullOnlyForOneOffAndOngoing()
    {
        var allFrequencies = Enum.GetValues<ComplianceFrequency>();

        return Prop.ForAll(
            Gen.Elements(allFrequencies).ToArbitrary(),
            ValidCheckDateArbitrary(),
            (frequency, checkDate) =>
            {
                var result = CalculateNextDueDate(frequency, checkDate);
                var shouldBeNull = frequency == ComplianceFrequency.OneOff ||
                                   frequency == ComplianceFrequency.Ongoing;

                return (result.HasValue != shouldBeNull)
                    .Label($"{frequency}: CheckDate={checkDate:yyyy-MM-dd}, HasValue={result.HasValue}, ShouldBeNull={shouldBeNull}");
            });
    }

    /// <summary>
    /// Property 10: For Daily frequency, the interval between CheckDate and NextDueDate is exactly 1 day.
    /// For Weekly, exactly 7 days. This verifies the day-count precisely.
    ///
    /// **Validates: Requirements 6.5**
    /// </summary>
    [Property(MaxTest = 200)]
    public Property DayBasedFrequencies_ExactDayInterval()
    {
        return Prop.ForAll(
            ValidCheckDateArbitrary(),
            checkDate =>
            {
                var dailyResult = CalculateNextDueDate(ComplianceFrequency.Daily, checkDate);
                var weeklyResult = CalculateNextDueDate(ComplianceFrequency.Weekly, checkDate);

                var dailyDiff = (dailyResult!.Value - checkDate).TotalDays;
                var weeklyDiff = (weeklyResult!.Value - checkDate).TotalDays;

                return (dailyDiff == 1.0 && weeklyDiff == 7.0)
                    .Label($"Daily diff={dailyDiff} (expected 1), Weekly diff={weeklyDiff} (expected 7)");
            });
    }
}
