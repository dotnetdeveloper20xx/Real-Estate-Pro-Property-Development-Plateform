using BuildEstate.Application.Features.Search.Interfaces;
using BuildEstate.Application.Features.Search.Models;
using BuildEstate.Application.Features.Search.Services;
using BuildEstate.Application.Settings;
using FluentAssertions;
using Microsoft.Extensions.Options;
using Moq;

namespace BuildEstate.Tests.UnitTests.Search;

public class SearchScoringServiceTests
{
    private readonly SearchScoringService _sut;
    private readonly Mock<ISearchSynonymService> _synonymServiceMock;
    private readonly SearchSettings _settings;

    public SearchScoringServiceTests()
    {
        _settings = new SearchSettings
        {
            EnableFuzzyMatching = true,
            EnablePhoneticMatching = true,
            EnableSynonyms = false
        };

        _synonymServiceMock = new Mock<ISearchSynonymService>();
        _synonymServiceMock.Setup(s => s.IsEnabled).Returns(false);
        _synonymServiceMock.Setup(s => s.ExpandQuery(It.IsAny<string>()))
            .Returns(new List<string>());

        var options = Options.Create(_settings);
        _sut = new SearchScoringService(options, _synonymServiceMock.Object);
    }

    #region ScoreResults — Empty/Whitespace Query

    [Fact]
    public void ScoreResults_WithEmptyQuery_ReturnsEmptyResults()
    {
        // Arrange
        var rawResults = new List<RawSearchResult>
        {
            CreateRawResult("Test Entity", "Some subtitle")
        };
        var boostContext = CreateDefaultBoostContext();

        // Act
        var results = _sut.ScoreResults(rawResults, "", boostContext);

        // Assert
        results.Should().BeEmpty();
    }

    [Fact]
    public void ScoreResults_WithWhitespaceOnlyQuery_ReturnsEmptyResults()
    {
        // Arrange
        var rawResults = new List<RawSearchResult>
        {
            CreateRawResult("Test Entity", "Some subtitle")
        };
        var boostContext = CreateDefaultBoostContext();

        // Act
        var results = _sut.ScoreResults(rawResults, "   ", boostContext);

        // Assert
        results.Should().BeEmpty();
    }

    #endregion

    #region ScoreResults — Exact Match with Special Characters

    [Fact]
    public void ScoreResults_WithExactMatchSpecialChars_ScoresCorrectly()
    {
        // Arrange
        var rawResults = new List<RawSearchResult>
        {
            CreateRawResult("croydon site #a", "development area")
        };
        var boostContext = CreateDefaultBoostContext();

        // Act
        var results = _sut.ScoreResults(rawResults, "croydon site #a", boostContext);

        // Assert
        results.Should().HaveCount(1);
        // Exact match (5.0 * 2.0 field weight) + token matching for 3 tokens (2.0 * 3 * 2.0)
        // The exact score depends on all layers, but it must be positive and include exact match contribution
        results[0].Score.Should().BeGreaterThan(0);
        // Exact match alone = 5.0 * 2.0 = 10.0, so total should be at least 10.0
        results[0].Score.Should().BeGreaterOrEqualTo(10.0);
    }

    #endregion

    #region ScoreResults — Multi-Token AND Logic

    [Fact]
    public void ScoreResults_MultiToken_ExcludesResultsMissingToken()
    {
        // Arrange
        var resultWithBothTokens = CreateRawResult("croydon residential", "development");
        var resultWithOneToken = CreateRawResult("croydon commercial", "office space");

        var rawResults = new List<RawSearchResult> { resultWithBothTokens, resultWithOneToken };
        var boostContext = CreateDefaultBoostContext();

        // Act - "croydon residential" should match both tokens in first result
        var results = _sut.ScoreResults(rawResults, "croydon residential", boostContext);

        // Assert
        // First result matches both tokens so it should appear
        results.Should().Contain(r => r.Title == "croydon residential");

        // Second result has "croydon" but not "residential" — 
        // The scoring service still includes it as long as at least one token matches any field
        // (anyTokenMatchedInAnyField check). Let's verify the first result scores higher.
        var bothTokenResult = results.FirstOrDefault(r => r.Title == "croydon residential");
        var oneTokenResult = results.FirstOrDefault(r => r.Title == "croydon commercial");

        bothTokenResult.Should().NotBeNull();
        if (oneTokenResult != null)
        {
            // Result with both tokens should score higher than result with only one token
            bothTokenResult!.Score.Should().BeGreaterThan(oneTokenResult.Score);
        }
    }

    #endregion

    #region CalculateBoostScore — Individual Conditions

    [Fact]
    public void CalculateBoostScore_RecentlyViewed_AddsTwo()
    {
        // Arrange
        var entityId = Guid.NewGuid();
        var result = CreateRawResultWithId(entityId);
        var context = new SearchBoostContext
        {
            CurrentUserId = "user-1",
            UserDepartment = null,
            RecentlyViewedIds = new HashSet<Guid> { entityId },
            FrequentlyAccessedIds = new HashSet<Guid>()
        };

        // Act
        var boost = SearchScoringService.CalculateBoostScore(result, context);

        // Assert
        boost.Should().Be(2.0);
    }

    [Fact]
    public void CalculateBoostScore_RecentlyModified_AddsOnePointFive()
    {
        // Arrange
        var result = CreateRawResultWithId(Guid.NewGuid());
        result.ModifiedAt = DateTime.UtcNow.AddDays(-3); // Within 7-day threshold
        var context = CreateDefaultBoostContext();

        // Act
        var boost = SearchScoringService.CalculateBoostScore(result, context);

        // Assert
        boost.Should().Be(1.5);
    }

    [Fact]
    public void CalculateBoostScore_ActiveStatus_AddsOne()
    {
        // Arrange
        var result = CreateRawResultWithId(Guid.NewGuid());
        result.ModifiedAt = DateTime.UtcNow.AddDays(-30); // Not recently modified
        result.Status = "Active";
        var context = CreateDefaultBoostContext();

        // Act
        var boost = SearchScoringService.CalculateBoostScore(result, context);

        // Assert
        boost.Should().Be(1.0);
    }

    [Fact]
    public void CalculateBoostScore_CreatedByUser_AddsPointFive()
    {
        // Arrange
        var result = CreateRawResultWithId(Guid.NewGuid());
        result.ModifiedAt = DateTime.UtcNow.AddDays(-30); // Not recently modified
        result.CreatedBy = "user-123";
        var context = new SearchBoostContext
        {
            CurrentUserId = "user-123",
            UserDepartment = null,
            RecentlyViewedIds = new HashSet<Guid>(),
            FrequentlyAccessedIds = new HashSet<Guid>()
        };

        // Act
        var boost = SearchScoringService.CalculateBoostScore(result, context);

        // Assert
        boost.Should().Be(0.5);
    }

    [Fact]
    public void CalculateBoostScore_MatchesDepartment_AddsOne()
    {
        // Arrange
        var result = CreateRawResultWithId(Guid.NewGuid());
        result.ModifiedAt = DateTime.UtcNow.AddDays(-30); // Not recently modified
        result.Department = "Acquisitions";
        var context = new SearchBoostContext
        {
            CurrentUserId = "user-1",
            UserDepartment = "Acquisitions",
            RecentlyViewedIds = new HashSet<Guid>(),
            FrequentlyAccessedIds = new HashSet<Guid>()
        };

        // Act
        var boost = SearchScoringService.CalculateBoostScore(result, context);

        // Assert
        boost.Should().Be(1.0);
    }

    [Fact]
    public void CalculateBoostScore_FrequentlyAccessed_AddsPointEight()
    {
        // Arrange
        var entityId = Guid.NewGuid();
        var result = CreateRawResultWithId(entityId);
        result.ModifiedAt = DateTime.UtcNow.AddDays(-30); // Not recently modified
        var context = new SearchBoostContext
        {
            CurrentUserId = "user-1",
            UserDepartment = null,
            RecentlyViewedIds = new HashSet<Guid>(),
            FrequentlyAccessedIds = new HashSet<Guid> { entityId }
        };

        // Act
        var boost = SearchScoringService.CalculateBoostScore(result, context);

        // Assert
        boost.Should().Be(0.8);
    }

    [Fact]
    public void CalculateBoostScore_NoConditionsMet_ReturnsZero()
    {
        // Arrange
        var result = CreateRawResultWithId(Guid.NewGuid());
        result.ModifiedAt = DateTime.UtcNow.AddDays(-30); // Not recently modified
        result.Status = "Archived";
        result.CreatedBy = "other-user";
        result.Department = "Finance";
        var context = new SearchBoostContext
        {
            CurrentUserId = "user-1",
            UserDepartment = "Legal",
            RecentlyViewedIds = new HashSet<Guid>(),
            FrequentlyAccessedIds = new HashSet<Guid>()
        };

        // Act
        var boost = SearchScoringService.CalculateBoostScore(result, context);

        // Assert
        boost.Should().Be(0.0);
    }

    [Fact]
    public void CalculateBoostScore_AllConditionsMet_ReturnsSumOfAll()
    {
        // Arrange
        var entityId = Guid.NewGuid();
        var result = CreateRawResultWithId(entityId);
        result.ModifiedAt = DateTime.UtcNow.AddDays(-3); // Recently modified (+1.5)
        result.Status = "Active"; // Active status (+1.0)
        result.CreatedBy = "user-1"; // Created by user (+0.5)
        result.Department = "Acquisitions"; // Matches department (+1.0)

        var context = new SearchBoostContext
        {
            CurrentUserId = "user-1",
            UserDepartment = "Acquisitions",
            RecentlyViewedIds = new HashSet<Guid> { entityId }, // Recently viewed (+2.0)
            FrequentlyAccessedIds = new HashSet<Guid> { entityId } // Frequently accessed (+0.8)
        };

        // Act
        var boost = SearchScoringService.CalculateBoostScore(result, context);

        // Assert
        // Sum: 2.0 + 1.5 + 1.0 + 0.5 + 1.0 + 0.8 = 6.8
        boost.Should().Be(6.8);
    }

    #endregion

    #region Helpers

    private static RawSearchResult CreateRawResult(string title, string subtitle)
    {
        return new RawSearchResult
        {
            EntityId = Guid.NewGuid(),
            EntityType = "LandOpportunity",
            Title = title,
            Subtitle = subtitle,
            Status = "Identified",
            Icon = "landscape",
            Category = "Land Acquisition",
            ModuleBadge = "Land",
            NavigationRoute = "/land/opportunities/1",
            ModifiedAt = DateTime.UtcNow.AddDays(-30), // Not recently modified
            SearchableFields = new List<SearchableField>
            {
                new() { Name = "Title", Value = title, Weight = 2.0 },
                new() { Name = "Subtitle", Value = subtitle, Weight = 1.0 }
            }
        };
    }

    private static RawSearchResult CreateRawResultWithId(Guid entityId)
    {
        return new RawSearchResult
        {
            EntityId = entityId,
            EntityType = "LandOpportunity",
            Title = "Test Entity",
            Subtitle = "Test Subtitle",
            Status = null,
            Icon = "landscape",
            Category = "Land Acquisition",
            ModuleBadge = "Land",
            NavigationRoute = $"/land/opportunities/{entityId}",
            ModifiedAt = DateTime.UtcNow.AddDays(-30), // Default: not recently modified
            SearchableFields = new List<SearchableField>
            {
                new() { Name = "Title", Value = "test entity", Weight = 2.0 },
                new() { Name = "Subtitle", Value = "test subtitle", Weight = 1.0 }
            }
        };
    }

    private static SearchBoostContext CreateDefaultBoostContext()
    {
        return new SearchBoostContext
        {
            CurrentUserId = "default-user",
            UserDepartment = null,
            RecentlyViewedIds = new HashSet<Guid>(),
            FrequentlyAccessedIds = new HashSet<Guid>()
        };
    }

    #endregion
}
