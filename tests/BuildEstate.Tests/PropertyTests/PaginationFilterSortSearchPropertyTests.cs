using BuildEstate.Application.Features.LandAcquisition.Opportunities.Queries.GetOpportunities;
using BuildEstate.Domain.Common;
using BuildEstate.Domain.Entities.LandAcquisition;
using BuildEstate.Domain.Enums;
using BuildEstate.Tests.Helpers;
using FluentAssertions;
using FsCheck;
using FsCheck.Xunit;
using Moq;

namespace BuildEstate.Tests.PropertyTests;

/// <summary>
/// Property-based tests for pagination, filtering, sorting, soft-delete exclusion, and free-text search.
/// Tests verify invariants hold across randomly generated datasets and query parameters.
/// 
/// **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5**
/// 
/// Property 12: Pagination Invariants — items returned ≤ pageSize; total pages = ceil(totalCount/pageSize);
///              all items across all pages equal total items.
/// Property 13: Filter Predicate Correctness — filtered results satisfy the predicate.
/// Property 14: Sort Order Invariant — results are in correct order for given sort field/direction.
/// Property 15: Soft-Delete Exclusion Invariant — records with IsDeleted=true never appear.
/// Property 16: Free-Text Search Correctness — results contain the search term in Name, Location, or Source.
/// </summary>
public class PaginationFilterSortSearchPropertyTests
{
    #region Generators

    private static readonly string[] SampleLocations = { "London", "Manchester", "Birmingham", "Leeds", "Bristol", "Oxford", "Cambridge" };
    private static readonly string[] SampleSources = { "Agent", "Direct", "Auction", "Online Portal", "Referral" };
    private static readonly string[] SampleNames = { "Oak Field", "Green Meadow", "Riverside Plot", "Hill View", "Park Lane", "Church Farm", "Station Road" };

    private static Gen<LandOpportunity> OpportunityGen(bool allowDeleted = false)
    {
        var statusGen = Gen.Elements(Enum.GetValues<OpportunityStatus>());
        var nameGen = Gen.Elements(SampleNames);
        var locationGen = Gen.Elements(SampleLocations);
        var sourceGen = Gen.OneOf(
            Gen.Elements(SampleSources).Select(s => (string?)s),
            Gen.Constant<string?>(null));
        var landSizeGen = Gen.Choose(1, 1000).Select(i => (decimal)i / 10m);
        var deletedGen = allowDeleted
            ? Gen.Frequency(new WeightAndValue<Gen<bool>>(3, Gen.Constant(false)), new WeightAndValue<Gen<bool>>(1, Gen.Constant(true)))
            : Gen.Constant(false);
        var dateGen = Gen.Choose(0, 365).Select(d => DateTime.UtcNow.AddDays(-d));
        var expectedAcqGen = Gen.OneOf(
            Gen.Choose(1, 180).Select(d => (DateTime?)DateTime.UtcNow.AddDays(d)),
            Gen.Constant<DateTime?>(null));

        return from name in nameGen
               from location in locationGen
               from landSize in landSizeGen
               from status in statusGen
               from source in sourceGen
               from isDeleted in deletedGen
               from createdAt in dateGen
               from expectedAcq in expectedAcqGen
               select new LandOpportunity
               {
                   Id = Guid.NewGuid(),
                   Name = name + " " + Guid.NewGuid().ToString("N")[..6],
                   Location = location,
                   LandSize = landSize,
                   Status = status,
                   Source = source,
                   IsDeleted = isDeleted,
                   CreatedAt = createdAt,
                   CreatedBy = "test-user",
                   ExpectedAcquisition = expectedAcq
               };
    }

    private static Gen<List<LandOpportunity>> OpportunityListGen(int minCount = 0, int maxCount = 50, bool allowDeleted = false)
    {
        return Gen.Choose(minCount, maxCount).SelectMany(count =>
            Gen.ListOf(count, OpportunityGen(allowDeleted)).Select(l => l.ToList()));
    }

    private static GetOpportunitiesQueryHandler CreateHandler(List<LandOpportunity> data)
    {
        var mockRepo = new Mock<IRepository<LandOpportunity>>();
        // Only expose non-deleted records via Query() to simulate EF Core global query filter
        var activeData = data.Where(o => !o.IsDeleted).ToList();
        mockRepo.Setup(r => r.Query()).Returns(activeData.AsAsyncQueryable());
        return new GetOpportunitiesQueryHandler(mockRepo.Object);
    }

    #endregion

    #region Property 12: Pagination Invariants

    /// <summary>
    /// Property 12: Pagination Invariants
    /// Items returned on any page must be less than or equal to pageSize.
    /// **Validates: Requirements 2.1**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property Pagination_ItemsReturned_NeverExceedsPageSize()
    {
        var dataGen = OpportunityListGen(0, 50);
        var pageNumberGen = Gen.Choose(1, 10);
        var pageSizeGen = Gen.Choose(1, 20);

        var inputGen = from data in dataGen
                       from pageNumber in pageNumberGen
                       from pageSize in pageSizeGen
                       select new { Data = data, PageNumber = pageNumber, PageSize = pageSize };

        return Prop.ForAll(inputGen.ToArbitrary(), input =>
        {
            var handler = CreateHandler(input.Data);
            var query = new GetOpportunitiesQuery
            {
                PageNumber = input.PageNumber,
                PageSize = input.PageSize
            };

            var result = handler.Handle(query, CancellationToken.None).GetAwaiter().GetResult();

            result.Items.Count.Should().BeLessThanOrEqualTo(input.PageSize,
                because: $"page size is {input.PageSize}, so no page can contain more items");
        });
    }

    /// <summary>
    /// Property 12: Pagination Invariants
    /// TotalPages = ceil(TotalCount / PageSize).
    /// **Validates: Requirements 2.1**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property Pagination_TotalPages_EqualsCeiling_OfTotalCountDividedByPageSize()
    {
        var dataGen = OpportunityListGen(0, 50);
        var pageSizeGen = Gen.Choose(1, 20);

        var inputGen = from data in dataGen
                       from pageSize in pageSizeGen
                       select new { Data = data, PageSize = pageSize };

        return Prop.ForAll(inputGen.ToArbitrary(), input =>
        {
            var handler = CreateHandler(input.Data);
            var query = new GetOpportunitiesQuery
            {
                PageNumber = 1,
                PageSize = input.PageSize
            };

            var result = handler.Handle(query, CancellationToken.None).GetAwaiter().GetResult();

            var expectedTotalPages = (int)Math.Ceiling((double)result.TotalCount / input.PageSize);
            result.TotalPages.Should().Be(expectedTotalPages,
                because: $"TotalCount={result.TotalCount}, PageSize={input.PageSize}");
        });
    }

    /// <summary>
    /// Property 12: Pagination Invariants
    /// The sum of items across all pages equals TotalCount.
    /// **Validates: Requirements 2.1**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property Pagination_AllItemsAcrossPages_EqualTotalCount()
    {
        var dataGen = OpportunityListGen(0, 30);
        var pageSizeGen = Gen.Choose(1, 10);

        var inputGen = from data in dataGen
                       from pageSize in pageSizeGen
                       select new { Data = data, PageSize = pageSize };

        return Prop.ForAll(inputGen.ToArbitrary(), input =>
        {
            var handler = CreateHandler(input.Data);

            // Get total count from first page
            var firstQuery = new GetOpportunitiesQuery { PageNumber = 1, PageSize = input.PageSize };
            var firstResult = handler.Handle(firstQuery, CancellationToken.None).GetAwaiter().GetResult();

            var totalItemsCollected = 0;
            var totalPages = firstResult.TotalPages;

            for (var page = 1; page <= totalPages; page++)
            {
                // Re-create handler for each page (same data)
                var pageHandler = CreateHandler(input.Data);
                var pageQuery = new GetOpportunitiesQuery { PageNumber = page, PageSize = input.PageSize };
                var pageResult = pageHandler.Handle(pageQuery, CancellationToken.None).GetAwaiter().GetResult();
                totalItemsCollected += pageResult.Items.Count;
            }

            totalItemsCollected.Should().Be(firstResult.TotalCount,
                because: "iterating all pages should yield exactly TotalCount items");
        });
    }

    #endregion

    #region Property 13: Filter Predicate Correctness

    /// <summary>
    /// Property 13: Filter Predicate Correctness
    /// When filtering by Status, all returned items must have the specified status.
    /// **Validates: Requirements 2.2**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property Filter_ByStatus_AllReturnedItems_HaveMatchingStatus()
    {
        var dataGen = OpportunityListGen(1, 30);
        var statusGen = Gen.Elements(Enum.GetValues<OpportunityStatus>());

        var inputGen = from data in dataGen
                       from status in statusGen
                       select new { Data = data, Status = status };

        return Prop.ForAll(inputGen.ToArbitrary(), input =>
        {
            var handler = CreateHandler(input.Data);
            var query = new GetOpportunitiesQuery
            {
                PageNumber = 1,
                PageSize = 100,
                Status = input.Status
            };

            var result = handler.Handle(query, CancellationToken.None).GetAwaiter().GetResult();

            // Empty result is valid (vacuously true); all returned items must match the filter
            foreach (var item in result.Items)
            {
                item.Status.Should().Be(input.Status.ToString(),
                    because: $"filtering by status {input.Status} should only return items with that status");
            }
        });
    }

    /// <summary>
    /// Property 13: Filter Predicate Correctness
    /// When filtering by Location, all returned items must contain the location substring.
    /// **Validates: Requirements 2.2**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property Filter_ByLocation_AllReturnedItems_ContainLocationSubstring()
    {
        var dataGen = OpportunityListGen(1, 30);
        var locationGen = Gen.Elements(SampleLocations);

        var inputGen = from data in dataGen
                       from location in locationGen
                       select new { Data = data, Location = location };

        return Prop.ForAll(inputGen.ToArbitrary(), input =>
        {
            var handler = CreateHandler(input.Data);
            var query = new GetOpportunitiesQuery
            {
                PageNumber = 1,
                PageSize = 100,
                Location = input.Location
            };

            var result = handler.Handle(query, CancellationToken.None).GetAwaiter().GetResult();

            // Empty result is valid (vacuously true); all returned items must match
            foreach (var item in result.Items)
            {
                item.Location.Should().Contain(input.Location,
                    because: $"filtering by location '{input.Location}' should only return matching items");
            }
        });
    }

    /// <summary>
    /// Property 13: Filter Predicate Correctness
    /// When filtering by Source, all returned items must contain the source substring.
    /// **Validates: Requirements 2.2**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property Filter_BySource_AllReturnedItems_ContainSourceSubstring()
    {
        var dataGen = OpportunityListGen(1, 30);
        var sourceGen = Gen.Elements(SampleSources);

        var inputGen = from data in dataGen
                       from source in sourceGen
                       select new { Data = data, Source = source };

        return Prop.ForAll(inputGen.ToArbitrary(), input =>
        {
            var handler = CreateHandler(input.Data);
            var query = new GetOpportunitiesQuery
            {
                PageNumber = 1,
                PageSize = 100,
                Source = input.Source
            };

            var result = handler.Handle(query, CancellationToken.None).GetAwaiter().GetResult();

            // Empty result is valid (vacuously true); all returned items must match
            foreach (var item in result.Items)
            {
                item.Source.Should().NotBeNull();
                item.Source.Should().Contain(input.Source,
                    because: $"filtering by source '{input.Source}' should only return items whose source contains that value");
            }
        });
    }

    #endregion

    #region Property 14: Sort Order Invariant

    /// <summary>
    /// Property 14: Sort Order Invariant
    /// When sorting by Name ascending, results are in non-decreasing alphabetical order.
    /// **Validates: Requirements 2.3**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property Sort_ByNameAsc_ResultsAreInNonDecreasingOrder()
    {
        var dataGen = OpportunityListGen(2, 30);

        return Prop.ForAll(dataGen.ToArbitrary(), data =>
        {
            var handler = CreateHandler(data);
            var query = new GetOpportunitiesQuery
            {
                PageNumber = 1,
                PageSize = 100,
                SortBy = "Name",
                SortDirection = "asc"
            };

            var result = handler.Handle(query, CancellationToken.None).GetAwaiter().GetResult();

            for (var i = 1; i < result.Items.Count; i++)
            {
                string.Compare(result.Items[i - 1].Name, result.Items[i].Name, StringComparison.Ordinal)
                    .Should().BeLessThanOrEqualTo(0,
                        because: $"item at index {i - 1} ('{result.Items[i - 1].Name}') should come before or equal item at index {i} ('{result.Items[i].Name}') when sorted by Name asc");
            }
        });
    }

    /// <summary>
    /// Property 14: Sort Order Invariant
    /// When sorting by Name descending, results are in non-increasing alphabetical order.
    /// **Validates: Requirements 2.3**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property Sort_ByNameDesc_ResultsAreInNonIncreasingOrder()
    {
        var dataGen = OpportunityListGen(2, 30);

        return Prop.ForAll(dataGen.ToArbitrary(), data =>
        {
            var handler = CreateHandler(data);
            var query = new GetOpportunitiesQuery
            {
                PageNumber = 1,
                PageSize = 100,
                SortBy = "Name",
                SortDirection = "desc"
            };

            var result = handler.Handle(query, CancellationToken.None).GetAwaiter().GetResult();

            for (var i = 1; i < result.Items.Count; i++)
            {
                string.Compare(result.Items[i - 1].Name, result.Items[i].Name, StringComparison.Ordinal)
                    .Should().BeGreaterThanOrEqualTo(0,
                        because: $"item at index {i - 1} should come after or equal item at index {i} when sorted by Name desc");
            }
        });
    }

    /// <summary>
    /// Property 14: Sort Order Invariant
    /// When sorting by LandSize ascending, results are in non-decreasing order.
    /// **Validates: Requirements 2.3**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property Sort_ByLandSizeAsc_ResultsAreInNonDecreasingOrder()
    {
        var dataGen = OpportunityListGen(2, 30);

        return Prop.ForAll(dataGen.ToArbitrary(), data =>
        {
            var handler = CreateHandler(data);
            var query = new GetOpportunitiesQuery
            {
                PageNumber = 1,
                PageSize = 100,
                SortBy = "LandSize",
                SortDirection = "asc"
            };

            var result = handler.Handle(query, CancellationToken.None).GetAwaiter().GetResult();

            for (var i = 1; i < result.Items.Count; i++)
            {
                result.Items[i - 1].LandSize.Should().BeLessThanOrEqualTo(result.Items[i].LandSize,
                    because: "LandSize should be non-decreasing when sorted ascending");
            }
        });
    }

    /// <summary>
    /// Property 14: Sort Order Invariant
    /// When sorting by CreatedAt descending, results are in non-increasing order.
    /// **Validates: Requirements 2.3**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property Sort_ByCreatedAtDesc_ResultsAreInNonIncreasingOrder()
    {
        var dataGen = OpportunityListGen(2, 30);

        return Prop.ForAll(dataGen.ToArbitrary(), data =>
        {
            var handler = CreateHandler(data);
            var query = new GetOpportunitiesQuery
            {
                PageNumber = 1,
                PageSize = 100,
                SortBy = "CreatedAt",
                SortDirection = "desc"
            };

            var result = handler.Handle(query, CancellationToken.None).GetAwaiter().GetResult();

            for (var i = 1; i < result.Items.Count; i++)
            {
                result.Items[i - 1].CreatedAt.Should().BeOnOrAfter(result.Items[i].CreatedAt,
                    because: "CreatedAt should be non-increasing when sorted descending");
            }
        });
    }

    /// <summary>
    /// Property 14: Sort Order Invariant
    /// When sorting by Status ascending, results are in non-decreasing enum int order.
    /// **Validates: Requirements 2.3**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property Sort_ByStatusAsc_ResultsAreInNonDecreasingEnumOrder()
    {
        var dataGen = OpportunityListGen(2, 30);

        return Prop.ForAll(dataGen.ToArbitrary(), data =>
        {
            var handler = CreateHandler(data);
            var query = new GetOpportunitiesQuery
            {
                PageNumber = 1,
                PageSize = 100,
                SortBy = "Status",
                SortDirection = "asc"
            };

            var result = handler.Handle(query, CancellationToken.None).GetAwaiter().GetResult();

            for (var i = 1; i < result.Items.Count; i++)
            {
                var prev = Enum.Parse<OpportunityStatus>(result.Items[i - 1].Status);
                var curr = Enum.Parse<OpportunityStatus>(result.Items[i].Status);
                ((int)prev).Should().BeLessThanOrEqualTo((int)curr,
                    because: "Status enum value should be non-decreasing when sorted ascending");
            }
        });
    }

    #endregion

    #region Property 15: Soft-Delete Exclusion Invariant

    /// <summary>
    /// Property 15: Soft-Delete Exclusion Invariant
    /// Records marked as IsDeleted=true must never appear in query results regardless of filters.
    /// **Validates: Requirements 2.5**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property SoftDelete_DeletedRecords_NeverAppearInResults()
    {
        var dataGen = OpportunityListGen(5, 40, allowDeleted: true);

        return Prop.ForAll(dataGen.ToArbitrary(), data =>
        {
            var deletedIds = data.Where(o => o.IsDeleted).Select(o => o.Id).ToHashSet();

            var handler = CreateHandler(data);
            var query = new GetOpportunitiesQuery
            {
                PageNumber = 1,
                PageSize = 100
            };

            var result = handler.Handle(query, CancellationToken.None).GetAwaiter().GetResult();

            result.Items.Should().NotContain(item => deletedIds.Contains(item.Id),
                because: "soft-deleted records must never appear in query results");
        });
    }

    /// <summary>
    /// Property 15: Soft-Delete Exclusion Invariant
    /// The TotalCount must not include soft-deleted records.
    /// **Validates: Requirements 2.5**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property SoftDelete_TotalCount_ExcludesDeletedRecords()
    {
        var dataGen = OpportunityListGen(5, 40, allowDeleted: true);

        return Prop.ForAll(dataGen.ToArbitrary(), data =>
        {
            var activeCount = data.Count(o => !o.IsDeleted);

            var handler = CreateHandler(data);
            var query = new GetOpportunitiesQuery
            {
                PageNumber = 1,
                PageSize = 100
            };

            var result = handler.Handle(query, CancellationToken.None).GetAwaiter().GetResult();

            result.TotalCount.Should().Be(activeCount,
                because: "TotalCount should only count non-deleted records");
        });
    }

    #endregion

    #region Property 16: Free-Text Search Correctness

    /// <summary>
    /// Property 16: Free-Text Search Correctness
    /// All results returned for a search term must contain that term in Name, Location, or Source.
    /// **Validates: Requirements 2.4**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property Search_AllReturnedItems_ContainSearchTermInNameLocationOrSource()
    {
        var dataGen = OpportunityListGen(5, 30);
        var searchTermGen = Gen.OneOf(
            Gen.Elements(SampleNames.Select(n => n.Split(' ')[0]).ToArray()),
            Gen.Elements(SampleLocations),
            Gen.Elements(SampleSources));

        var inputGen = from data in dataGen
                       from term in searchTermGen
                       select new { Data = data, SearchTerm = term };

        return Prop.ForAll(inputGen.ToArbitrary(), input =>
        {
            var handler = CreateHandler(input.Data);
            var query = new GetOpportunitiesQuery
            {
                PageNumber = 1,
                PageSize = 100,
                SearchTerm = input.SearchTerm
            };

            var result = handler.Handle(query, CancellationToken.None).GetAwaiter().GetResult();

            // Empty result is valid (vacuously true); all returned items must contain the search term
            foreach (var item in result.Items)
            {
                var matchesName = item.Name.Contains(input.SearchTerm, StringComparison.Ordinal);
                var matchesLocation = item.Location.Contains(input.SearchTerm, StringComparison.Ordinal);
                var matchesSource = item.Source != null && item.Source.Contains(input.SearchTerm, StringComparison.Ordinal);

                (matchesName || matchesLocation || matchesSource).Should().BeTrue(
                    because: $"search term '{input.SearchTerm}' should match Name, Location, or Source for item '{item.Name}'");
            }
        });
    }

    /// <summary>
    /// Property 16: Free-Text Search Correctness
    /// When no search term is provided, all non-deleted records are returned (up to page size).
    /// **Validates: Requirements 2.4**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property Search_WithNoSearchTerm_ReturnsAllActiveRecords()
    {
        var dataGen = OpportunityListGen(0, 30);

        return Prop.ForAll(dataGen.ToArbitrary(), data =>
        {
            var handler = CreateHandler(data);
            var query = new GetOpportunitiesQuery
            {
                PageNumber = 1,
                PageSize = 100,
                SearchTerm = null
            };

            var result = handler.Handle(query, CancellationToken.None).GetAwaiter().GetResult();

            var expectedCount = data.Count(o => !o.IsDeleted);
            result.TotalCount.Should().Be(expectedCount,
                because: "with no search term, all active records should be returned");
        });
    }

    /// <summary>
    /// Property 16: Free-Text Search Correctness
    /// Search must not miss any matching active records — completeness check.
    /// **Validates: Requirements 2.4**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property Search_ReturnsAllMatchingRecords_Completeness()
    {
        var dataGen = OpportunityListGen(5, 30);
        var searchTermGen = Gen.Elements(SampleLocations);

        var inputGen = from data in dataGen
                       from term in searchTermGen
                       select new { Data = data, SearchTerm = term };

        return Prop.ForAll(inputGen.ToArbitrary(), input =>
        {
            var expectedMatches = input.Data
                .Where(o => !o.IsDeleted)
                .Where(o =>
                    o.Name.Contains(input.SearchTerm, StringComparison.Ordinal) ||
                    o.Location.Contains(input.SearchTerm, StringComparison.Ordinal) ||
                    (o.Source != null && o.Source.Contains(input.SearchTerm, StringComparison.Ordinal)))
                .Count();

            var handler = CreateHandler(input.Data);
            var query = new GetOpportunitiesQuery
            {
                PageNumber = 1,
                PageSize = 100,
                SearchTerm = input.SearchTerm
            };

            var result = handler.Handle(query, CancellationToken.None).GetAwaiter().GetResult();

            result.TotalCount.Should().Be(expectedMatches,
                because: $"search for '{input.SearchTerm}' should return exactly the matching active records");
        });
    }

    #endregion
}
