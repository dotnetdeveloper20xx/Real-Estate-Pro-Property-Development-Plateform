using FsCheck;
using FsCheck.Xunit;
using FluentAssertions;
using FluentValidation;
using BuildEstate.Application.Features.Search.Queries.ExecuteSearch;
using BuildEstate.Application.Features.Search.Queries.GetRecentSearches;
using BuildEstate.Application.Features.Search.DTOs;
using BuildEstate.Application.Interfaces;
using BuildEstate.Domain.Common;
using BuildEstate.Domain.Entities.Search;
using MockQueryable.Moq;
using Moq;

namespace BuildEstate.Tests.PropertyTests.Search;

/// <summary>
/// Property-based tests for date validation, pagination size clamping, and
/// recent searches descending order.
///
/// **Validates: Requirements 11.5, 13.7, 10.2**
/// </summary>
public class SearchValidationPropertyTests
{
    #region Helpers

    private static ExecuteSearchQueryValidator CreateValidator() => new();

    private static Gen<DateTime> DateTimeGen()
    {
        return Gen.Choose(2020, 2030).SelectMany(year =>
            Gen.Choose(1, 12).SelectMany(month =>
                Gen.Choose(1, 28).Select(day =>
                    new DateTime(year, month, day, 0, 0, 0, DateTimeKind.Utc))));
    }

    #endregion

    #region Property 14: Date range validation

    /// <summary>
    /// Property 14: Date range validation — When dateTo is earlier than dateFrom,
    /// the validator returns a validation error.
    /// </summary>
    [Property(MaxTest = 200)]
    public Property DateRangeValidation_DateToBeforeDateFrom_ReturnsValidationError()
    {
        // Generate two distinct dates and ensure dateTo < dateFrom
        var dateGen = DateTimeGen();

        return Prop.ForAll(
            dateGen.Two()
                .Where(t => t.Item1 != t.Item2)
                .ToArbitrary(),
            (Tuple<DateTime, DateTime> dates) =>
        {
            var dateFrom = dates.Item1 > dates.Item2 ? dates.Item1 : dates.Item2;
            var dateTo = dates.Item1 > dates.Item2 ? dates.Item2 : dates.Item1;

            // dateTo is now strictly less than dateFrom
            var query = new ExecuteSearchQuery
            {
                Query = "test",
                DateFrom = dateFrom,
                DateTo = dateTo,
                Page = 1,
                PageSize = 10
            };

            var validator = CreateValidator();
            var result = validator.Validate(query);

            return (!result.IsValid &&
                    result.Errors.Any(e => e.PropertyName == "DateTo"))
                .Label($"dateTo={dateTo:yyyy-MM-dd} < dateFrom={dateFrom:yyyy-MM-dd}" +
                       $" should fail validation. IsValid={result.IsValid}");
        });
    }

    /// <summary>
    /// Property 14: Date range validation — When dateFrom ≤ dateTo (both set),
    /// the date validation passes.
    /// </summary>
    [Property(MaxTest = 200)]
    public Property DateRangeValidation_DateFromLessThanOrEqualDateTo_Passes()
    {
        var dateGen = DateTimeGen();

        return Prop.ForAll(
            dateGen.Two().ToArbitrary(),
            (Tuple<DateTime, DateTime> dates) =>
        {
            var dateFrom = dates.Item1 <= dates.Item2 ? dates.Item1 : dates.Item2;
            var dateTo = dates.Item1 <= dates.Item2 ? dates.Item2 : dates.Item1;

            // dateFrom ≤ dateTo
            var query = new ExecuteSearchQuery
            {
                Query = "test",
                DateFrom = dateFrom,
                DateTo = dateTo,
                Page = 1,
                PageSize = 10
            };

            var validator = CreateValidator();
            var result = validator.Validate(query);

            // Should not have a DateTo error
            var hasDateError = result.Errors.Any(e => e.PropertyName == "DateTo");
            return (!hasDateError)
                .Label($"dateFrom={dateFrom:yyyy-MM-dd} <= dateTo={dateTo:yyyy-MM-dd}" +
                       $" should pass date validation. HasDateError={hasDateError}");
        });
    }

    /// <summary>
    /// Property 14: Date range validation — When one or both dates are null,
    /// validation passes (no date constraint violated).
    /// </summary>
    [Property(MaxTest = 100)]
    public Property DateRangeValidation_NullDates_AlwaysPasses()
    {
        var nullableGen = Gen.OneOf(
            Gen.Constant<DateTime?>(null),
            DateTimeGen().Select<DateTime, DateTime?>(d => d));

        return Prop.ForAll(
            nullableGen.ToArbitrary(),
            nullableGen.ToArbitrary(),
            (DateTime? dateFrom, DateTime? dateTo) =>
        {
            // Only test cases where at least one date is null
            if (dateFrom.HasValue && dateTo.HasValue)
                return true.Label("Both non-null — skipped (tested separately)");

            var query = new ExecuteSearchQuery
            {
                Query = "test",
                DateFrom = dateFrom,
                DateTo = dateTo,
                Page = 1,
                PageSize = 10
            };

            var validator = CreateValidator();
            var result = validator.Validate(query);

            var hasDateError = result.Errors.Any(e => e.PropertyName == "DateTo");
            return (!hasDateError)
                .Label($"dateFrom={dateFrom?.ToString("yyyy-MM-dd") ?? "null"}, " +
                       $"dateTo={dateTo?.ToString("yyyy-MM-dd") ?? "null"}" +
                       $" should pass. HasDateError={hasDateError}");
        });
    }

    #endregion

    #region Property 15: Pagination size clamping

    /// <summary>
    /// Property 15: Pagination size clamping — PageSize values within [1, 50]
    /// pass validation.
    /// </summary>
    [Property(MaxTest = 200)]
    public Property PaginationSizeClamping_ValidPageSize_PassesValidation()
    {
        var pageSizeGen = Gen.Choose(1, 50);

        return Prop.ForAll(pageSizeGen.ToArbitrary(), (int pageSize) =>
        {
            var query = new ExecuteSearchQuery
            {
                Query = "test",
                Page = 1,
                PageSize = pageSize
            };

            var validator = CreateValidator();
            var result = validator.Validate(query);

            var hasPageSizeError = result.Errors.Any(e => e.PropertyName == "PageSize");
            return (!hasPageSizeError)
                .Label($"PageSize={pageSize} should pass. HasPageSizeError={hasPageSizeError}");
        });
    }

    /// <summary>
    /// Property 15: Pagination size clamping — PageSize values less than 1
    /// fail validation.
    /// </summary>
    [Property(MaxTest = 100)]
    public Property PaginationSizeClamping_PageSizeBelowMin_FailsValidation()
    {
        var pageSizeGen = Gen.Choose(-100, 0);

        return Prop.ForAll(pageSizeGen.ToArbitrary(), (int pageSize) =>
        {
            var query = new ExecuteSearchQuery
            {
                Query = "test",
                Page = 1,
                PageSize = pageSize
            };

            var validator = CreateValidator();
            var result = validator.Validate(query);

            return (!result.IsValid &&
                    result.Errors.Any(e => e.PropertyName == "PageSize"))
                .Label($"PageSize={pageSize} should fail validation. IsValid={result.IsValid}");
        });
    }

    /// <summary>
    /// Property 15: Pagination size clamping — PageSize values greater than 50
    /// fail validation.
    /// </summary>
    [Property(MaxTest = 100)]
    public Property PaginationSizeClamping_PageSizeAboveMax_FailsValidation()
    {
        var pageSizeGen = Gen.Choose(51, 1000);

        return Prop.ForAll(pageSizeGen.ToArbitrary(), (int pageSize) =>
        {
            var query = new ExecuteSearchQuery
            {
                Query = "test",
                Page = 1,
                PageSize = pageSize
            };

            var validator = CreateValidator();
            var result = validator.Validate(query);

            return (!result.IsValid &&
                    result.Errors.Any(e => e.PropertyName == "PageSize"))
                .Label($"PageSize={pageSize} should fail validation. IsValid={result.IsValid}");
        });
    }

    /// <summary>
    /// Property 15: Pagination size clamping — Default page size is 10.
    /// </summary>
    [Fact]
    public void PaginationSizeDefault_WhenNotSpecified_DefaultsTo10()
    {
        var query = new ExecuteSearchQuery { Query = "test" };
        query.PageSize.Should().Be(10);
    }

    #endregion

    #region Property 20: Recent searches descending order

    /// <summary>
    /// Property 20: Recent searches descending order — Results returned by
    /// GetRecentSearchesQueryHandler are always ordered by SearchedAt descending.
    /// </summary>
    [Property(MaxTest = 100)]
    public Property RecentSearchesDescendingOrder_AlwaysOrderedBySearchedAtDesc()
    {
        // Generate a list of 1-25 recent searches with random timestamps
        var recentSearchGen = DateTimeGen().SelectMany(searchedAt =>
            Gen.Choose(0, 100).Select(resultCount =>
                new RecentSearch
                {
                    Id = Guid.NewGuid(),
                    UserId = "test-user",
                    Query = "search",
                    ResultCount = resultCount,
                    SearchedAt = searchedAt,
                    CreatedAt = DateTime.UtcNow
                }));

        var searchListGen = Gen.Choose(1, 25).SelectMany(count =>
            Gen.ArrayOf(count, recentSearchGen));

        return Prop.ForAll(searchListGen.ToArbitrary(), (RecentSearch[] searches) =>
        {
            // Arrange: set up mocked repository
            var searchList = searches.ToList();
            var mockQueryable = searchList.AsQueryable().BuildMockDbSet();

            var mockRepo = new Mock<IRepository<RecentSearch>>();
            mockRepo.Setup(r => r.Query()).Returns(mockQueryable.Object);

            var mockCurrentUser = new Mock<ICurrentUserService>();
            mockCurrentUser.Setup(u => u.UserId).Returns("test-user");

            var handler = new GetRecentSearchesQueryHandler(
                mockRepo.Object, mockCurrentUser.Object);

            // Act
            var result = handler.Handle(
                new GetRecentSearchesQuery(), CancellationToken.None).Result;

            // Assert: results are ordered by SearchedAt descending
            var isDescending = true;
            for (var i = 1; i < result.Count; i++)
            {
                if (result[i].SearchedAt > result[i - 1].SearchedAt)
                {
                    isDescending = false;
                    break;
                }
            }

            // Also verify max 20 entries
            var withinLimit = result.Count <= 20;

            return (isDescending && withinLimit)
                .Label($"Count={result.Count}, IsDescending={isDescending}, " +
                       $"WithinLimit={withinLimit}");
        });
    }

    /// <summary>
    /// Property 20: Recent searches descending order — Only the current user's
    /// searches are returned (no cross-user leakage).
    /// </summary>
    [Property(MaxTest = 50)]
    public Property RecentSearches_OnlyCurrentUserSearchesReturned()
    {
        var recentSearchGen = DateTimeGen().SelectMany(searchedAt =>
            Gen.Elements("test-user", "other-user").Select(userId =>
                new RecentSearch
                {
                    Id = Guid.NewGuid(),
                    UserId = userId,
                    Query = "search",
                    ResultCount = 5,
                    SearchedAt = searchedAt,
                    CreatedAt = DateTime.UtcNow
                }));

        var searchListGen = Gen.Choose(1, 30).SelectMany(count =>
            Gen.ArrayOf(count, recentSearchGen));

        return Prop.ForAll(searchListGen.ToArbitrary(), (RecentSearch[] searches) =>
        {
            var searchList = searches.ToList();
            var mockQueryable = searchList.AsQueryable().BuildMockDbSet();

            var mockRepo = new Mock<IRepository<RecentSearch>>();
            mockRepo.Setup(r => r.Query()).Returns(mockQueryable.Object);

            var mockCurrentUser = new Mock<ICurrentUserService>();
            mockCurrentUser.Setup(u => u.UserId).Returns("test-user");

            var handler = new GetRecentSearchesQueryHandler(
                mockRepo.Object, mockCurrentUser.Object);

            var result = handler.Handle(
                new GetRecentSearchesQuery(), CancellationToken.None).Result;

            // All returned results should belong to "test-user"
            // We verify this by checking that the count matches
            // what we'd expect if filtered correctly
            var expectedCount = Math.Min(
                searchList.Count(s => s.UserId == "test-user"), 20);

            return (result.Count == expectedCount)
                .Label($"Expected {expectedCount} results for 'test-user', " +
                       $"got {result.Count}");
        });
    }

    #endregion
}
