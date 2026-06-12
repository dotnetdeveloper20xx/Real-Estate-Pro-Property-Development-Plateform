using BuildEstate.Domain.Enums;
using FluentAssertions;
using FsCheck;
using FsCheck.Xunit;

namespace BuildEstate.Tests.PropertyTests.LegalCompliance;

/// <summary>
/// Property-based tests for dashboard KPI calculation correctness.
/// Tests the core computation logic for case groupings, average resolution time,
/// and compliance rate percentage — ensuring mathematical correctness for any random dataset.
///
/// **Validates: Requirements 11.1, 11.2, 11.3, 11.4, 11.5**
/// </summary>
public class DashboardKpiCalculationPropertyTests
{
    private static readonly LegalCaseStatus[] AllStatuses = Enum.GetValues<LegalCaseStatus>();
    private static readonly LegalCasePriority[] AllPriorities = Enum.GetValues<LegalCasePriority>();
    private static readonly ComplianceCheckOutcome[] AllOutcomes = Enum.GetValues<ComplianceCheckOutcome>();
    private static readonly InsuranceStatus[] AllInsuranceStatuses = Enum.GetValues<InsuranceStatus>();
    private static readonly LegalContractType[] AllContractTypes = Enum.GetValues<LegalContractType>();

    #region Helper computation methods (mirror dashboard handler logic)

    /// <summary>
    /// Groups case status indices and returns a dictionary of status → count.
    /// Mirrors the GetCaseCountsByStatusAsync logic.
    /// </summary>
    private static Dictionary<LegalCaseStatus, int> GroupByStatus(int[] statusIndices)
    {
        return statusIndices
            .Select(i => AllStatuses[Math.Abs(i) % AllStatuses.Length])
            .GroupBy(s => s)
            .ToDictionary(g => g.Key, g => g.Count());
    }

    /// <summary>
    /// Groups priority indices and returns a dictionary of priority → count.
    /// Mirrors the GetCaseCountsByPriorityAsync logic.
    /// </summary>
    private static Dictionary<LegalCasePriority, int> GroupByPriority(int[] priorityIndices)
    {
        return priorityIndices
            .Select(i => AllPriorities[Math.Abs(i) % AllPriorities.Length])
            .GroupBy(p => p)
            .ToDictionary(g => g.Key, g => g.Count());
    }

    /// <summary>
    /// Calculates average resolution time in days.
    /// Mirrors GetAverageResolutionTimeAsync logic.
    /// </summary>
    private static double CalculateAverageResolutionTime(int[] durationDays)
    {
        if (durationDays.Length == 0)
            return 0;

        var positiveDurations = durationDays.Select(d => (double)Math.Abs(d) + 1).ToList();
        var totalDays = positiveDurations.Sum();

        return Math.Round(totalDays / positiveDurations.Count, 2);
    }

    /// <summary>
    /// Calculates compliance rate as percentage of Compliant checks out of total checks.
    /// Mirrors GetComplianceRateAsync logic.
    /// </summary>
    private static double CalculateComplianceRate(int[] outcomeIndices)
    {
        if (outcomeIndices.Length == 0)
            return 0;

        var outcomes = outcomeIndices
            .Select(i => AllOutcomes[Math.Abs(i) % AllOutcomes.Length])
            .ToList();

        var compliantCount = outcomes.Count(o => o == ComplianceCheckOutcome.Compliant);

        return Math.Round((double)compliantCount / outcomes.Count * 100, 2);
    }

    #endregion

    #region Property 17: Case Groupings by Status

    /// <summary>
    /// Property 17: For any random set of cases, grouping by status produces counts that
    /// sum to the total number of cases. No cases are lost or duplicated in grouping.
    ///
    /// **Validates: Requirements 11.1**
    /// </summary>
    [Property(MaxTest = 200)]
    public Property CaseGroupByStatus_SumOfGroupCounts_EqualsTotalCases()
    {
        var indicesGen = Gen.ArrayOf(Gen.Choose(0, 100));

        return Prop.ForAll(
            indicesGen.ToArbitrary(),
            statusIndices =>
            {
                var grouped = GroupByStatus(statusIndices);
                var sumOfCounts = grouped.Values.Sum();

                return (sumOfCounts == statusIndices.Length)
                    .Label($"Sum of grouped counts ({sumOfCounts}) should equal total cases ({statusIndices.Length})");
            });
    }

    /// <summary>
    /// Property 17: For any random set of cases, each status group count matches the
    /// actual number of cases with that status in the input.
    ///
    /// **Validates: Requirements 11.1**
    /// </summary>
    [Property(MaxTest = 200)]
    public Property CaseGroupByStatus_EachGroupCount_MatchesFilteredCount()
    {
        var indicesGen = Gen.ArrayOf(Gen.Choose(0, 100));

        return Prop.ForAll(
            indicesGen.ToArbitrary(),
            statusIndices =>
            {
                var statuses = statusIndices
                    .Select(i => AllStatuses[Math.Abs(i) % AllStatuses.Length])
                    .ToList();

                var grouped = GroupByStatus(statusIndices);

                var allCorrect = grouped.All(kvp =>
                    kvp.Value == statuses.Count(s => s == kvp.Key));

                return allCorrect
                    .Label("Each group count should match the number of cases with that status");
            });
    }

    /// <summary>
    /// Property 17: For any random set of cases, grouping by priority produces counts that
    /// sum to the total number of cases.
    ///
    /// **Validates: Requirements 11.1**
    /// </summary>
    [Property(MaxTest = 200)]
    public Property CaseGroupByPriority_SumOfGroupCounts_EqualsTotalCases()
    {
        var indicesGen = Gen.ArrayOf(Gen.Choose(0, 100));

        return Prop.ForAll(
            indicesGen.ToArbitrary(),
            priorityIndices =>
            {
                var grouped = GroupByPriority(priorityIndices);
                var sumOfCounts = grouped.Values.Sum();

                return (sumOfCounts == priorityIndices.Length)
                    .Label($"Sum of priority group counts ({sumOfCounts}) should equal total cases ({priorityIndices.Length})");
            });
    }

    #endregion

    #region Property 17: Average Resolution Time

    /// <summary>
    /// Property 17: For any random set of resolved/closed cases with resolution dates,
    /// the average resolution time equals the sum of individual resolution times divided
    /// by the count of resolved cases. Verified to 2 decimal places.
    ///
    /// **Validates: Requirements 11.2**
    /// </summary>
    [Property(MaxTest = 200)]
    public Property AverageResolutionTime_EqualsManualCalculation()
    {
        var durationsGen = Gen.NonEmptyListOf(Gen.Choose(0, 365))
            .Select(list => list.ToArray());

        return Prop.ForAll(
            durationsGen.ToArbitrary(),
            durationDays =>
            {
                var computed = CalculateAverageResolutionTime(durationDays);

                // Manual calculation
                var positiveDurations = durationDays.Select(d => (double)Math.Abs(d) + 1).ToList();
                var expectedAverage = Math.Round(positiveDurations.Sum() / positiveDurations.Count, 2);

                return (computed == expectedAverage)
                    .Label($"Computed avg {computed} should equal expected {expectedAverage}");
            });
    }

    /// <summary>
    /// Property 17: When there are no resolved/closed cases, the average resolution time is 0.
    ///
    /// **Validates: Requirements 11.2**
    /// </summary>
    [Fact]
    public void AverageResolutionTime_NoCases_ReturnsZero()
    {
        var result = CalculateAverageResolutionTime(Array.Empty<int>());
        result.Should().Be(0);
    }

    /// <summary>
    /// Property 17: Average resolution time is always non-negative.
    ///
    /// **Validates: Requirements 11.2**
    /// </summary>
    [Property(MaxTest = 200)]
    public Property AverageResolutionTime_IsAlwaysNonNegative()
    {
        var durationsGen = Gen.ArrayOf(Gen.Choose(0, 1000));

        return Prop.ForAll(
            durationsGen.ToArbitrary(),
            durationDays =>
            {
                var computed = CalculateAverageResolutionTime(durationDays);

                return (computed >= 0)
                    .Label($"Average resolution time should be non-negative, got {computed}");
            });
    }

    /// <summary>
    /// Property 17: For a single case, the average equals that single case's duration.
    ///
    /// **Validates: Requirements 11.2**
    /// </summary>
    [Property(MaxTest = 200)]
    public Property AverageResolutionTime_SingleCase_EqualsItsDuration()
    {
        var durationGen = Gen.Choose(0, 1000);

        return Prop.ForAll(
            durationGen.ToArbitrary(),
            duration =>
            {
                var computed = CalculateAverageResolutionTime(new[] { duration });
                var expected = Math.Round((double)(Math.Abs(duration) + 1), 2);

                return (computed == expected)
                    .Label($"Single case avg {computed} should equal duration {expected}");
            });
    }

    #endregion

    #region Property 17: Compliance Rate Percentage

    /// <summary>
    /// Property 17: The compliance rate is always between 0 and 100 inclusive for any
    /// non-empty set of outcomes.
    ///
    /// **Validates: Requirements 11.3**
    /// </summary>
    [Property(MaxTest = 200)]
    public Property ComplianceRate_IsAlwaysBetween0And100()
    {
        var outcomesGen = Gen.NonEmptyListOf(Gen.Choose(0, 100))
            .Select(list => list.ToArray());

        return Prop.ForAll(
            outcomesGen.ToArbitrary(),
            outcomeIndices =>
            {
                var rate = CalculateComplianceRate(outcomeIndices);

                return (rate >= 0 && rate <= 100)
                    .Label($"Compliance rate {rate} should be between 0 and 100");
            });
    }

    /// <summary>
    /// Property 17: When all outcomes are Compliant (index mod 4 == 0), the compliance rate is exactly 100%.
    ///
    /// **Validates: Requirements 11.3**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property ComplianceRate_AllCompliant_Returns100()
    {
        var countGen = Gen.Choose(1, 100);

        return Prop.ForAll(
            countGen.ToArbitrary(),
            count =>
            {
                // ComplianceCheckOutcome.Compliant has value 0, so index % 4 == 0 gives Compliant
                var outcomes = Enumerable.Repeat(0, count).ToArray();
                var rate = CalculateComplianceRate(outcomes);

                return (rate == 100.0)
                    .Label($"Rate should be 100% when all {count} outcomes are Compliant, got {rate}");
            });
    }

    /// <summary>
    /// Property 17: When no outcomes are Compliant, the compliance rate is exactly 0%.
    ///
    /// **Validates: Requirements 11.3**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property ComplianceRate_NoneCompliant_Returns0()
    {
        // Generate indices that map to non-Compliant outcomes (1, 2, 3 mod 4)
        var nonCompliantGen = Gen.NonEmptyListOf(Gen.Elements(1, 2, 3))
            .Select(list => list.ToArray());

        return Prop.ForAll(
            nonCompliantGen.ToArbitrary(),
            outcomeIndices =>
            {
                var rate = CalculateComplianceRate(outcomeIndices);

                return (rate == 0.0)
                    .Label($"Rate should be 0% when no outcomes are Compliant, got {rate}");
            });
    }

    /// <summary>
    /// Property 17: The compliance rate equals (compliant count / total count) * 100 rounded to 2dp
    /// for any random mix of outcomes.
    ///
    /// **Validates: Requirements 11.3**
    /// </summary>
    [Property(MaxTest = 200)]
    public Property ComplianceRate_EqualsManualPercentageCalculation()
    {
        var outcomesGen = Gen.NonEmptyListOf(Gen.Choose(0, 100))
            .Select(list => list.ToArray());

        return Prop.ForAll(
            outcomesGen.ToArbitrary(),
            outcomeIndices =>
            {
                var rate = CalculateComplianceRate(outcomeIndices);

                var outcomes = outcomeIndices
                    .Select(i => AllOutcomes[Math.Abs(i) % AllOutcomes.Length])
                    .ToList();
                var compliantCount = outcomes.Count(o => o == ComplianceCheckOutcome.Compliant);
                var expected = Math.Round((double)compliantCount / outcomes.Count * 100, 2);

                return (rate == expected)
                    .Label($"Rate {rate} should equal manual calc {expected} " +
                           $"({compliantCount}/{outcomes.Count} compliant)");
            });
    }

    /// <summary>
    /// Property 17: For an empty set of compliance checks, the compliance rate is 0%.
    ///
    /// **Validates: Requirements 11.3**
    /// </summary>
    [Fact]
    public void ComplianceRate_EmptyChecks_ReturnsZero()
    {
        var rate = CalculateComplianceRate(Array.Empty<int>());
        rate.Should().Be(0);
    }

    #endregion

    #region Property 17: Active Contract Value Grouping

    /// <summary>
    /// Property 17: For any random set of contracts, the sum of grouped active contract values
    /// equals the total value of all contracts with Active status.
    /// Uses seed-based approach: each contract is defined by typeIndex, value, statusIndex.
    ///
    /// **Validates: Requirements 11.5**
    /// </summary>
    [Property(MaxTest = 200)]
    public Property ActiveContractValue_SumOfGroups_EqualsTotalActiveValue()
    {
        // Generate arrays of contract data: [typeIndex, valueHundredths, statusIndex] triples
        var contractCountGen = Gen.Choose(0, 30);
        var seedGen = Gen.Choose(1, 100_000);

        return Prop.ForAll(
            contractCountGen.ToArbitrary(),
            seedGen.ToArbitrary(),
            (count, seed) =>
            {
                var random = new System.Random(seed);
                var contracts = Enumerable.Range(0, count).Select(_ =>
                {
                    var contractType = AllContractTypes[random.Next(AllContractTypes.Length)];
                    var value = (decimal)random.Next(100, 10_000_000) / 100m;
                    var isActive = random.Next(6) == 0; // ~1/6 chance of Active
                    var status = isActive ? LegalContractStatus.Active : LegalContractStatus.Draft;
                    return (contractType, value, status);
                }).ToList();

                // Compute grouped active values (mirrors handler logic)
                var grouped = contracts
                    .Where(c => c.status == LegalContractStatus.Active)
                    .GroupBy(c => c.contractType)
                    .ToDictionary(g => g.Key, g => g.Sum(c => c.value));

                var sumOfGroupedValues = grouped.Values.Sum();
                var expectedTotal = contracts
                    .Where(c => c.status == LegalContractStatus.Active)
                    .Sum(c => c.value);

                return (sumOfGroupedValues == expectedTotal)
                    .Label($"Sum of grouped values ({sumOfGroupedValues}) should equal total active value ({expectedTotal})");
            });
    }

    /// <summary>
    /// Property 17: Only contracts with Active status are included in the value grouping.
    /// Non-Active contracts never contribute to the grouped totals.
    ///
    /// **Validates: Requirements 11.5**
    /// </summary>
    [Property(MaxTest = 200)]
    public Property ActiveContractValue_OnlyActiveContractsIncluded()
    {
        var seedGen = Gen.Choose(1, 100_000);
        var countGen = Gen.Choose(1, 20);

        return Prop.ForAll(
            countGen.ToArbitrary(),
            seedGen.ToArbitrary(),
            (count, seed) =>
            {
                var random = new System.Random(seed);
                // Only non-Active statuses
                var nonActiveStatuses = new[]
                {
                    LegalContractStatus.Draft, LegalContractStatus.UnderReview,
                    LegalContractStatus.Completed, LegalContractStatus.Terminated
                };

                var contracts = Enumerable.Range(0, count).Select(_ =>
                {
                    var contractType = AllContractTypes[random.Next(AllContractTypes.Length)];
                    var value = (decimal)random.Next(1000, 5_000_000) / 100m;
                    var status = nonActiveStatuses[random.Next(nonActiveStatuses.Length)];
                    return (contractType, value, status);
                }).ToList();

                var grouped = contracts
                    .Where(c => c.status == LegalContractStatus.Active)
                    .GroupBy(c => c.contractType)
                    .ToDictionary(g => g.Key, g => g.Sum(c => c.value));

                return (grouped.Count == 0)
                    .Label($"Non-active contracts should produce empty grouping, got {grouped.Count} groups");
            });
    }

    /// <summary>
    /// Property 17: Each type group's total matches the sum of individual contract values
    /// for that type with Active status.
    ///
    /// **Validates: Requirements 11.5**
    /// </summary>
    [Property(MaxTest = 200)]
    public Property ActiveContractValue_EachGroupTotal_MatchesManualSum()
    {
        var seedGen = Gen.Choose(1, 100_000);
        var countGen = Gen.Choose(0, 40);

        return Prop.ForAll(
            countGen.ToArbitrary(),
            seedGen.ToArbitrary(),
            (count, seed) =>
            {
                var random = new System.Random(seed);
                var allStatuses = new[]
                {
                    LegalContractStatus.Active, LegalContractStatus.Active, LegalContractStatus.Active,
                    LegalContractStatus.Draft, LegalContractStatus.Completed
                };

                var contracts = Enumerable.Range(0, count).Select(_ =>
                {
                    var contractType = AllContractTypes[random.Next(AllContractTypes.Length)];
                    var value = (decimal)random.Next(100, 10_000_000) / 100m;
                    var status = allStatuses[random.Next(allStatuses.Length)];
                    return (contractType, value, status);
                }).ToList();

                var grouped = contracts
                    .Where(c => c.status == LegalContractStatus.Active)
                    .GroupBy(c => c.contractType)
                    .ToDictionary(g => g.Key, g => g.Sum(c => c.value));

                var allCorrect = grouped.All(kvp =>
                {
                    var expectedSum = contracts
                        .Where(c => c.status == LegalContractStatus.Active && c.contractType == kvp.Key)
                        .Sum(c => c.value);
                    return kvp.Value == expectedSum;
                });

                return allCorrect
                    .Label("Each type group total should match manual sum of active contracts for that type");
            });
    }

    #endregion

    #region Property 17: Insurance Alert Counts (Requirement 11.4)

    /// <summary>
    /// Property 17: For any random set of insurance statuses, the count of ExpiringSoon
    /// and Expired records matches manual filtering.
    ///
    /// **Validates: Requirements 11.4**
    /// </summary>
    [Property(MaxTest = 200)]
    public Property InsuranceAlertCounts_MatchManualFiltering()
    {
        var statusIndicesGen = Gen.ArrayOf(Gen.Choose(0, 100));

        return Prop.ForAll(
            statusIndicesGen.ToArbitrary(),
            statusIndices =>
            {
                var statuses = statusIndices
                    .Select(i => AllInsuranceStatuses[Math.Abs(i) % AllInsuranceStatuses.Length])
                    .ToList();

                var expiringSoonCount = statuses.Count(s => s == InsuranceStatus.ExpiringSoon);
                var expiredCount = statuses.Count(s => s == InsuranceStatus.Expired);

                // Verify via manual loop
                var manualExpiringSoon = 0;
                var manualExpired = 0;
                foreach (var s in statuses)
                {
                    if (s == InsuranceStatus.ExpiringSoon) manualExpiringSoon++;
                    if (s == InsuranceStatus.Expired) manualExpired++;
                }

                return (expiringSoonCount == manualExpiringSoon && expiredCount == manualExpired)
                    .Label($"ExpiringSoon: {expiringSoonCount} vs {manualExpiringSoon}, " +
                           $"Expired: {expiredCount} vs {manualExpired}");
            });
    }

    /// <summary>
    /// Property 17: Insurance alert counts sum should not exceed total record count.
    ///
    /// **Validates: Requirements 11.4**
    /// </summary>
    [Property(MaxTest = 200)]
    public Property InsuranceAlertCounts_NeverExceedTotalCount()
    {
        var statusIndicesGen = Gen.ArrayOf(Gen.Choose(0, 100));

        return Prop.ForAll(
            statusIndicesGen.ToArbitrary(),
            statusIndices =>
            {
                var statuses = statusIndices
                    .Select(i => AllInsuranceStatuses[Math.Abs(i) % AllInsuranceStatuses.Length])
                    .ToList();

                var expiringSoonCount = statuses.Count(s => s == InsuranceStatus.ExpiringSoon);
                var expiredCount = statuses.Count(s => s == InsuranceStatus.Expired);

                return (expiringSoonCount + expiredCount <= statuses.Count)
                    .Label($"Alert counts ({expiringSoonCount} + {expiredCount}) should not exceed total ({statuses.Count})");
            });
    }

    #endregion
}
