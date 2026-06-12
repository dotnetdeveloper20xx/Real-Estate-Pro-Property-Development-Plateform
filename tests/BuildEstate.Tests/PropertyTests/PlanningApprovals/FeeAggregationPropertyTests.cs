using BuildEstate.Application.Features.PlanningApprovals.Fees.Queries.GetFeeSummary;
using BuildEstate.Domain.Common;
using BuildEstate.Domain.Entities.PlanningApprovals;
using BuildEstate.Domain.Enums;
using BuildEstate.Tests.Helpers;
using FluentAssertions;
using FsCheck;
using FsCheck.Xunit;
using Moq;

namespace BuildEstate.Tests.PropertyTests.PlanningApprovals;

/// <summary>
/// Property-based tests for fee aggregation correctness validating that
/// the GetFeeSummaryQueryHandler returns group sums that equal the mathematical
/// sum of matching fee amounts, and counts that equal the number of matching fees,
/// for every (FeeType, PaymentStatus) combination present in the data.
///
/// **Validates: Requirements 8.6**
/// </summary>
public class FeeAggregationPropertyTests
{
    private static readonly Guid TestApplicationId = Guid.NewGuid();

    /// <summary>
    /// Property 15: Fee Aggregation Correctness — Group Sums Equal Mathematical Sums
    ///
    /// For any set of PlanningFees associated with a PlanningApplication, the fee summary
    /// SHALL return totals where each group's TotalAmount equals the mathematical sum of
    /// Amount values for fees matching that (FeeType, PaymentStatus) combination, and
    /// each group's Count equals the number of matching fees.
    ///
    /// **Validates: Requirements 8.6**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property GroupSums_EqualMathematicalSum_ForAllFeeTypesAndStatuses()
    {
        var feeListGen = GenerateFeeList();

        return Prop.ForAll(
            feeListGen.ToArbitrary(),
            fees =>
            {
                // Arrange
                var handler = CreateHandler(fees);
                var query = new GetFeeSummaryQuery { ApplicationId = TestApplicationId };

                // Act
                var result = handler.Handle(query, CancellationToken.None).GetAwaiter().GetResult();

                // Assert — compute expected groups from the raw list
                var expectedGroups = fees
                    .GroupBy(f => new { f.FeeType, f.PaymentStatus })
                    .Select(g => new
                    {
                        FeeType = g.Key.FeeType.ToString(),
                        PaymentStatus = g.Key.PaymentStatus.ToString(),
                        TotalAmount = g.Sum(f => f.Amount),
                        Count = g.Count()
                    })
                    .ToList();

                // Verify that the number of groups matches
                result.Should().HaveCount(expectedGroups.Count);

                // Verify each group's TotalAmount and Count match
                foreach (var expected in expectedGroups)
                {
                    var actual = result.SingleOrDefault(r =>
                        r.FeeType == expected.FeeType &&
                        r.PaymentStatus == expected.PaymentStatus);

                    actual.Should().NotBeNull(
                        $"Expected group ({expected.FeeType}, {expected.PaymentStatus}) to exist in results");

                    actual!.TotalAmount.Should().Be(expected.TotalAmount,
                        $"TotalAmount for group ({expected.FeeType}, {expected.PaymentStatus}) " +
                        $"should equal mathematical sum {expected.TotalAmount}");

                    actual.Count.Should().Be(expected.Count,
                        $"Count for group ({expected.FeeType}, {expected.PaymentStatus}) " +
                        $"should equal {expected.Count}");
                }

                return true;
            });
    }

    /// <summary>
    /// Property 15: Fee Aggregation Correctness — Empty Fee Set Returns Empty Summary
    ///
    /// For an application with no fees, the fee summary SHALL return an empty list.
    ///
    /// **Validates: Requirements 8.6**
    /// </summary>
    [Fact]
    public async Task EmptyFeeSet_ReturnsEmptySummary()
    {
        // Arrange
        var handler = CreateHandler(new List<PlanningFee>());
        var query = new GetFeeSummaryQuery { ApplicationId = TestApplicationId };

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        result.Should().BeEmpty();
    }

    /// <summary>
    /// Property 15: Fee Aggregation Correctness — Total Count Across Groups Equals Input Count
    ///
    /// For any set of PlanningFees, the sum of Count values across all returned groups
    /// SHALL equal the total number of input fees.
    ///
    /// **Validates: Requirements 8.6**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property TotalCountAcrossGroups_EqualsInputFeeCount()
    {
        var feeListGen = GenerateFeeList();

        return Prop.ForAll(
            feeListGen.ToArbitrary(),
            fees =>
            {
                // Arrange
                var handler = CreateHandler(fees);
                var query = new GetFeeSummaryQuery { ApplicationId = TestApplicationId };

                // Act
                var result = handler.Handle(query, CancellationToken.None).GetAwaiter().GetResult();

                // Assert
                var totalCount = result.Sum(r => r.Count);
                totalCount.Should().Be(fees.Count,
                    "sum of Count across all groups should equal total fee count");

                return true;
            });
    }

    /// <summary>
    /// Property 15: Fee Aggregation Correctness — Total Amount Across Groups Equals Sum of All Fees
    ///
    /// For any set of PlanningFees, the sum of TotalAmount values across all returned groups
    /// SHALL equal the mathematical sum of all fee amounts.
    ///
    /// **Validates: Requirements 8.6**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property TotalAmountAcrossGroups_EqualsSumOfAllFees()
    {
        var feeListGen = GenerateFeeList();

        return Prop.ForAll(
            feeListGen.ToArbitrary(),
            fees =>
            {
                // Arrange
                var handler = CreateHandler(fees);
                var query = new GetFeeSummaryQuery { ApplicationId = TestApplicationId };

                // Act
                var result = handler.Handle(query, CancellationToken.None).GetAwaiter().GetResult();

                // Assert
                var totalAmountFromGroups = result.Sum(r => r.TotalAmount);
                var expectedTotal = fees.Sum(f => f.Amount);
                totalAmountFromGroups.Should().Be(expectedTotal,
                    "sum of TotalAmount across all groups should equal total of all fee amounts");

                return true;
            });
    }

    #region Generators

    /// <summary>
    /// Generates a non-empty list of PlanningFee entities with random FeeType,
    /// PaymentStatus, and positive Amount values, all belonging to the same application.
    /// </summary>
    private static Gen<List<PlanningFee>> GenerateFeeList()
    {
        var feeTypeGen = Gen.Elements(
            FeeType.ApplicationFee,
            FeeType.PreApplicationFee,
            FeeType.ConditionDischargeFee,
            FeeType.AppealFee,
            FeeType.SupplementaryFee);

        var paymentStatusGen = Gen.Elements(
            PaymentStatus.Pending,
            PaymentStatus.AwaitingApproval,
            PaymentStatus.Approved,
            PaymentStatus.Rejected,
            PaymentStatus.Paid);

        // Generate positive amounts with 2 decimal places (0.01 to 999,999.99)
        var amountGen = Gen.Choose(1, 99999999)
            .Select(cents => cents / 100m);

        var singleFeeGen = from feeType in feeTypeGen
                           from paymentStatus in paymentStatusGen
                           from amount in amountGen
                           select new PlanningFee
                           {
                               Id = Guid.NewGuid(),
                               ApplicationId = TestApplicationId,
                               Amount = amount,
                               Currency = "GBP",
                               FeeType = feeType,
                               Description = $"Generated fee - {feeType}",
                               PaymentStatus = paymentStatus,
                               CreatedAt = DateTime.UtcNow.AddDays(-7),
                               CreatedBy = "test-user"
                           };

        // Generate lists of 1 to 20 fees
        return Gen.Choose(1, 20).SelectMany(count =>
            Gen.ListOf(count, singleFeeGen).Select(l => l.ToList()));
    }

    #endregion

    #region Test Helpers

    private static GetFeeSummaryQueryHandler CreateHandler(List<PlanningFee> fees)
    {
        var feeRepoMock = new Mock<IRepository<PlanningFee>>();

        feeRepoMock
            .Setup(r => r.Query())
            .Returns(fees.AsAsyncQueryable());

        return new GetFeeSummaryQueryHandler(feeRepoMock.Object);
    }

    #endregion
}
