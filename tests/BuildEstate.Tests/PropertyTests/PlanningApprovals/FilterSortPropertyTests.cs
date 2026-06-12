using BuildEstate.Application.Features.PlanningApprovals.Applications.Queries.GetApplications;
using BuildEstate.Domain.Common;
using BuildEstate.Domain.Entities.LandAcquisition;
using BuildEstate.Domain.Entities.PlanningApprovals;
using BuildEstate.Domain.Enums;
using BuildEstate.Tests.Helpers;
using FluentAssertions;
using FsCheck;
using FsCheck.Xunit;
using Moq;

namespace BuildEstate.Tests.PropertyTests.PlanningApprovals;

/// <summary>
/// Property-based tests for filter and sort correctness of the GetApplicationsQueryHandler.
/// Verifies that filtering produces only matching items and sorting produces correctly ordered results.
///
/// **Validates: Requirements 3.2, 3.3**
/// </summary>
public class FilterSortPropertyTests
{
    private static readonly string[] SampleCouncilNames =
    {
        "Westminster Council", "Camden Council", "Islington Borough",
        "Tower Hamlets", "Hackney Council", "Lambeth Council", "Southwark Council"
    };

    private static readonly string[] SampleDescriptions =
    {
        "New residential development on Oak Street",
        "Commercial office block conversion",
        "Mixed-use scheme on High Road",
        "Affordable housing project at Park Lane",
        "Industrial warehouse redevelopment",
        "Listed building restoration project",
        "Change of use from retail to residential"
    };

    private static readonly string[] SampleOpportunityNames =
    {
        "Riverside Plot", "Green Meadow", "Hill View", "Station Road", "Church Farm"
    };

    #region Property 19: Filter Result Consistency

    /// <summary>
    /// Property 19: Filter Result Consistency — Status Filter
    ///
    /// For any random Status filter applied to a planning application list query,
    /// every returned item SHALL have the matching Status value.
    ///
    /// **Validates: Requirements 3.2**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property Filter_ByStatus_AllReturnedItems_HaveMatchingStatus()
    {
        var inputGen = from data in GenerateApplicationData()
                       from status in Gen.Elements(Enum.GetValues<PlanningApplicationStatus>())
                       select new { Data = data, Status = status };

        return Prop.ForAll(inputGen.ToArbitrary(), input =>
        {
            var (handler, _) = CreateHandler(input.Data.Applications, input.Data.Opportunities);
            var query = new GetApplicationsQuery
            {
                PageNumber = 1,
                PageSize = 100,
                Status = input.Status
            };

            var result = handler.Handle(query, CancellationToken.None).GetAwaiter().GetResult();

            foreach (var item in result.Items)
            {
                item.Status.Should().Be(input.Status.ToString(),
                    $"filtering by status {input.Status} should only return items with that status");
            }
        });
    }

    /// <summary>
    /// Property 19: Filter Result Consistency — ApplicationType Filter
    ///
    /// For any random ApplicationType filter, every returned item SHALL have
    /// the matching ApplicationType value.
    ///
    /// **Validates: Requirements 3.2**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property Filter_ByApplicationType_AllReturnedItems_HaveMatchingType()
    {
        var inputGen = from data in GenerateApplicationData()
                       from appType in Gen.Elements(Enum.GetValues<PlanningApplicationType>())
                       select new { Data = data, ApplicationType = appType };

        return Prop.ForAll(inputGen.ToArbitrary(), input =>
        {
            var (handler, _) = CreateHandler(input.Data.Applications, input.Data.Opportunities);
            var query = new GetApplicationsQuery
            {
                PageNumber = 1,
                PageSize = 100,
                ApplicationType = input.ApplicationType
            };

            var result = handler.Handle(query, CancellationToken.None).GetAwaiter().GetResult();

            foreach (var item in result.Items)
            {
                item.ApplicationType.Should().Be(input.ApplicationType.ToString(),
                    $"filtering by type {input.ApplicationType} should only return items with that type");
            }
        });
    }

    /// <summary>
    /// Property 19: Filter Result Consistency — CouncilName Filter
    ///
    /// For any random CouncilName filter, every returned item SHALL have
    /// the matching CouncilName value.
    ///
    /// **Validates: Requirements 3.2**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property Filter_ByCouncilName_AllReturnedItems_HaveMatchingCouncilName()
    {
        var inputGen = from data in GenerateApplicationData()
                       from councilName in Gen.Elements(SampleCouncilNames)
                       select new { Data = data, CouncilName = councilName };

        return Prop.ForAll(inputGen.ToArbitrary(), input =>
        {
            var (handler, _) = CreateHandler(input.Data.Applications, input.Data.Opportunities);
            var query = new GetApplicationsQuery
            {
                PageNumber = 1,
                PageSize = 100,
                CouncilName = input.CouncilName
            };

            var result = handler.Handle(query, CancellationToken.None).GetAwaiter().GetResult();

            foreach (var item in result.Items)
            {
                item.CouncilName.Should().Be(input.CouncilName,
                    $"filtering by council '{input.CouncilName}' should only return items with that council");
            }
        });
    }

    /// <summary>
    /// Property 19: Filter Result Consistency — SubmissionDate Range Filter
    ///
    /// For any random date range filter on SubmissionDate, every returned item SHALL have
    /// a SubmissionDate within the specified range (inclusive).
    ///
    /// **Validates: Requirements 3.2**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property Filter_ByDateRange_AllReturnedItems_HaveSubmissionDateWithinRange()
    {
        var inputGen = from data in GenerateApplicationData()
                       from daysFrom in Gen.Choose(30, 180)
                       from daysTo in Gen.Choose(0, 29)
                       select new
                       {
                           Data = data,
                           DateFrom = DateTime.UtcNow.AddDays(-daysFrom).Date,
                           DateTo = DateTime.UtcNow.AddDays(-daysTo).Date
                       };

        return Prop.ForAll(inputGen.ToArbitrary(), input =>
        {
            var (handler, _) = CreateHandler(input.Data.Applications, input.Data.Opportunities);
            var query = new GetApplicationsQuery
            {
                PageNumber = 1,
                PageSize = 100,
                SubmissionDateFrom = input.DateFrom,
                SubmissionDateTo = input.DateTo
            };

            var result = handler.Handle(query, CancellationToken.None).GetAwaiter().GetResult();

            foreach (var item in result.Items)
            {
                if (item.SubmissionDate.HasValue)
                {
                    item.SubmissionDate.Value.Should().BeOnOrAfter(input.DateFrom,
                        "returned items must have SubmissionDate >= DateFrom");
                    item.SubmissionDate.Value.Should().BeOnOrBefore(input.DateTo,
                        "returned items must have SubmissionDate <= DateTo");
                }
            }
        });
    }

    /// <summary>
    /// Property 19: Filter Result Consistency — Combined Filters
    ///
    /// For any random combination of Status + ApplicationType filters,
    /// every returned item SHALL satisfy ALL active filter predicates simultaneously.
    ///
    /// **Validates: Requirements 3.2**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property Filter_Combined_AllReturnedItems_SatisfyAllPredicates()
    {
        var inputGen = from data in GenerateApplicationData()
                       from status in Gen.Elements(Enum.GetValues<PlanningApplicationStatus>())
                       from appType in Gen.Elements(Enum.GetValues<PlanningApplicationType>())
                       select new { Data = data, Status = status, ApplicationType = appType };

        return Prop.ForAll(inputGen.ToArbitrary(), input =>
        {
            var (handler, _) = CreateHandler(input.Data.Applications, input.Data.Opportunities);
            var query = new GetApplicationsQuery
            {
                PageNumber = 1,
                PageSize = 100,
                Status = input.Status,
                ApplicationType = input.ApplicationType
            };

            var result = handler.Handle(query, CancellationToken.None).GetAwaiter().GetResult();

            foreach (var item in result.Items)
            {
                item.Status.Should().Be(input.Status.ToString(),
                    "combined filter: status must match");
                item.ApplicationType.Should().Be(input.ApplicationType.ToString(),
                    "combined filter: application type must match");
            }
        });
    }

    /// <summary>
    /// Property 19: Filter Result Consistency — Completeness (No Matching Items Excluded)
    ///
    /// For any random Status filter, the total count of returned items SHALL equal the count
    /// of active items matching that status in the source data.
    ///
    /// **Validates: Requirements 3.2**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property Filter_ByStatus_NoMatchingItems_AreExcluded()
    {
        var inputGen = from data in GenerateApplicationData()
                       from status in Gen.Elements(Enum.GetValues<PlanningApplicationStatus>())
                       select new { Data = data, Status = status };

        return Prop.ForAll(inputGen.ToArbitrary(), input =>
        {
            var expectedCount = input.Data.Applications
                .Count(a => !a.IsDeleted && a.Status == input.Status);

            var (handler, _) = CreateHandler(input.Data.Applications, input.Data.Opportunities);
            var query = new GetApplicationsQuery
            {
                PageNumber = 1,
                PageSize = 100,
                Status = input.Status
            };

            var result = handler.Handle(query, CancellationToken.None).GetAwaiter().GetResult();

            result.TotalCount.Should().Be(expectedCount,
                $"filtering by status {input.Status} should return exactly {expectedCount} matching items");
        });
    }

    #endregion

    #region Property 20: Sort Order Correctness

    /// <summary>
    /// Property 20: Sort Order Correctness — Description Ascending
    ///
    /// For sort field Description with direction ascending, consecutive pairs
    /// SHALL be in non-decreasing alphabetical order.
    ///
    /// **Validates: Requirements 3.3**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property Sort_ByDescriptionAsc_ConsecutivePairs_InNonDecreasingOrder()
    {
        var dataGen = GenerateApplicationData();

        return Prop.ForAll(dataGen.ToArbitrary(), data =>
        {
            var (handler, _) = CreateHandler(data.Applications, data.Opportunities);
            var query = new GetApplicationsQuery
            {
                PageNumber = 1,
                PageSize = 100,
                SortBy = "Description",
                SortDirection = "asc"
            };

            var result = handler.Handle(query, CancellationToken.None).GetAwaiter().GetResult();

            for (var i = 1; i < result.Items.Count; i++)
            {
                string.Compare(result.Items[i - 1].Description, result.Items[i].Description, StringComparison.Ordinal)
                    .Should().BeLessThanOrEqualTo(0,
                        $"item[{i - 1}] ('{result.Items[i - 1].Description}') should come before or equal item[{i}] ('{result.Items[i].Description}') when sorted by Description asc");
            }
        });
    }

    /// <summary>
    /// Property 20: Sort Order Correctness — Description Descending
    ///
    /// For sort field Description with direction descending, consecutive pairs
    /// SHALL be in non-increasing alphabetical order.
    ///
    /// **Validates: Requirements 3.3**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property Sort_ByDescriptionDesc_ConsecutivePairs_InNonIncreasingOrder()
    {
        var dataGen = GenerateApplicationData();

        return Prop.ForAll(dataGen.ToArbitrary(), data =>
        {
            var (handler, _) = CreateHandler(data.Applications, data.Opportunities);
            var query = new GetApplicationsQuery
            {
                PageNumber = 1,
                PageSize = 100,
                SortBy = "Description",
                SortDirection = "desc"
            };

            var result = handler.Handle(query, CancellationToken.None).GetAwaiter().GetResult();

            for (var i = 1; i < result.Items.Count; i++)
            {
                string.Compare(result.Items[i - 1].Description, result.Items[i].Description, StringComparison.Ordinal)
                    .Should().BeGreaterThanOrEqualTo(0,
                        $"item[{i - 1}] should come after or equal item[{i}] when sorted by Description desc");
            }
        });
    }

    /// <summary>
    /// Property 20: Sort Order Correctness — CreatedAt Ascending
    ///
    /// For sort field CreatedAt with direction ascending, consecutive pairs
    /// SHALL be in non-decreasing chronological order.
    ///
    /// **Validates: Requirements 3.3**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property Sort_ByCreatedAtAsc_ConsecutivePairs_InNonDecreasingOrder()
    {
        var dataGen = GenerateApplicationData();

        return Prop.ForAll(dataGen.ToArbitrary(), data =>
        {
            var (handler, _) = CreateHandler(data.Applications, data.Opportunities);
            var query = new GetApplicationsQuery
            {
                PageNumber = 1,
                PageSize = 100,
                SortBy = "CreatedAt",
                SortDirection = "asc"
            };

            var result = handler.Handle(query, CancellationToken.None).GetAwaiter().GetResult();

            for (var i = 1; i < result.Items.Count; i++)
            {
                result.Items[i - 1].CreatedAt.Should().BeOnOrBefore(result.Items[i].CreatedAt,
                    $"item[{i - 1}].CreatedAt should be <= item[{i}].CreatedAt when sorted ascending");
            }
        });
    }

    /// <summary>
    /// Property 20: Sort Order Correctness — CreatedAt Descending
    ///
    /// For sort field CreatedAt with direction descending, consecutive pairs
    /// SHALL be in non-increasing chronological order.
    ///
    /// **Validates: Requirements 3.3**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property Sort_ByCreatedAtDesc_ConsecutivePairs_InNonIncreasingOrder()
    {
        var dataGen = GenerateApplicationData();

        return Prop.ForAll(dataGen.ToArbitrary(), data =>
        {
            var (handler, _) = CreateHandler(data.Applications, data.Opportunities);
            var query = new GetApplicationsQuery
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
                    $"item[{i - 1}].CreatedAt should be >= item[{i}].CreatedAt when sorted descending");
            }
        });
    }

    /// <summary>
    /// Property 20: Sort Order Correctness — SubmissionDate Ascending
    ///
    /// For sort field SubmissionDate with direction ascending, consecutive pairs
    /// SHALL be in non-decreasing chronological order (nulls handled consistently).
    ///
    /// **Validates: Requirements 3.3**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property Sort_BySubmissionDateAsc_ConsecutivePairs_InNonDecreasingOrder()
    {
        var dataGen = GenerateApplicationData();

        return Prop.ForAll(dataGen.ToArbitrary(), data =>
        {
            var (handler, _) = CreateHandler(data.Applications, data.Opportunities);
            var query = new GetApplicationsQuery
            {
                PageNumber = 1,
                PageSize = 100,
                SortBy = "SubmissionDate",
                SortDirection = "asc"
            };

            var result = handler.Handle(query, CancellationToken.None).GetAwaiter().GetResult();

            for (var i = 1; i < result.Items.Count; i++)
            {
                var prev = result.Items[i - 1].SubmissionDate;
                var curr = result.Items[i].SubmissionDate;

                // Nulls sort first in ascending order (default LINQ behavior)
                if (prev.HasValue && curr.HasValue)
                {
                    prev.Value.Should().BeOnOrBefore(curr.Value,
                        $"item[{i - 1}].SubmissionDate should be <= item[{i}].SubmissionDate when sorted ascending");
                }
                else if (prev.HasValue && !curr.HasValue)
                {
                    // Non-null before null is invalid in ascending with null-first ordering
                    // But LINQ OrderBy puts null first, so this should not happen
                    Assert.Fail("Non-null SubmissionDate should not precede null when sorted ascending");
                }
            }
        });
    }

    /// <summary>
    /// Property 20: Sort Order Correctness — TargetDecisionDate Ascending
    ///
    /// For sort field TargetDecisionDate with direction ascending, consecutive pairs
    /// SHALL be in non-decreasing chronological order.
    ///
    /// **Validates: Requirements 3.3**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property Sort_ByTargetDecisionDateAsc_ConsecutivePairs_InNonDecreasingOrder()
    {
        var dataGen = GenerateApplicationData();

        return Prop.ForAll(dataGen.ToArbitrary(), data =>
        {
            var (handler, _) = CreateHandler(data.Applications, data.Opportunities);
            var query = new GetApplicationsQuery
            {
                PageNumber = 1,
                PageSize = 100,
                SortBy = "TargetDecisionDate",
                SortDirection = "asc"
            };

            var result = handler.Handle(query, CancellationToken.None).GetAwaiter().GetResult();

            for (var i = 1; i < result.Items.Count; i++)
            {
                var prev = result.Items[i - 1].TargetDecisionDate;
                var curr = result.Items[i].TargetDecisionDate;

                if (prev.HasValue && curr.HasValue)
                {
                    prev.Value.Should().BeOnOrBefore(curr.Value,
                        $"item[{i - 1}].TargetDecisionDate should be <= item[{i}].TargetDecisionDate when sorted ascending");
                }
                else if (prev.HasValue && !curr.HasValue)
                {
                    Assert.Fail("Non-null TargetDecisionDate should not precede null when sorted ascending");
                }
            }
        });
    }

    /// <summary>
    /// Property 20: Sort Order Correctness — Status Ascending
    ///
    /// For sort field Status with direction ascending, consecutive pairs
    /// SHALL be in non-decreasing enum integer order.
    ///
    /// **Validates: Requirements 3.3**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property Sort_ByStatusAsc_ConsecutivePairs_InNonDecreasingEnumOrder()
    {
        var dataGen = GenerateApplicationData();

        return Prop.ForAll(dataGen.ToArbitrary(), data =>
        {
            var (handler, _) = CreateHandler(data.Applications, data.Opportunities);
            var query = new GetApplicationsQuery
            {
                PageNumber = 1,
                PageSize = 100,
                SortBy = "Status",
                SortDirection = "asc"
            };

            var result = handler.Handle(query, CancellationToken.None).GetAwaiter().GetResult();

            for (var i = 1; i < result.Items.Count; i++)
            {
                var prev = Enum.Parse<PlanningApplicationStatus>(result.Items[i - 1].Status);
                var curr = Enum.Parse<PlanningApplicationStatus>(result.Items[i].Status);
                ((int)prev).Should().BeLessThanOrEqualTo((int)curr,
                    $"Status enum value at [{i - 1}] should be <= [{i}] when sorted ascending");
            }
        });
    }

    /// <summary>
    /// Property 20: Sort Order Correctness — Status Descending
    ///
    /// For sort field Status with direction descending, consecutive pairs
    /// SHALL be in non-increasing enum integer order.
    ///
    /// **Validates: Requirements 3.3**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property Sort_ByStatusDesc_ConsecutivePairs_InNonIncreasingEnumOrder()
    {
        var dataGen = GenerateApplicationData();

        return Prop.ForAll(dataGen.ToArbitrary(), data =>
        {
            var (handler, _) = CreateHandler(data.Applications, data.Opportunities);
            var query = new GetApplicationsQuery
            {
                PageNumber = 1,
                PageSize = 100,
                SortBy = "Status",
                SortDirection = "desc"
            };

            var result = handler.Handle(query, CancellationToken.None).GetAwaiter().GetResult();

            for (var i = 1; i < result.Items.Count; i++)
            {
                var prev = Enum.Parse<PlanningApplicationStatus>(result.Items[i - 1].Status);
                var curr = Enum.Parse<PlanningApplicationStatus>(result.Items[i].Status);
                ((int)prev).Should().BeGreaterThanOrEqualTo((int)curr,
                    $"Status enum value at [{i - 1}] should be >= [{i}] when sorted descending");
            }
        });
    }

    /// <summary>
    /// Property 20: Sort Order Correctness — Random Sort Field and Direction
    ///
    /// For any valid sort field and direction combination, the returned list SHALL
    /// be ordered such that consecutive pairs respect the specified direction.
    ///
    /// **Validates: Requirements 3.3**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property Sort_RandomFieldAndDirection_ConsecutivePairs_RespectOrdering()
    {
        var sortFields = new[] { "Description", "CreatedAt", "SubmissionDate", "TargetDecisionDate", "Status" };
        var sortDirections = new[] { "asc", "desc" };

        var inputGen = from data in GenerateApplicationData()
                       from sortBy in Gen.Elements(sortFields)
                       from sortDir in Gen.Elements(sortDirections)
                       select new { Data = data, SortBy = sortBy, SortDirection = sortDir };

        return Prop.ForAll(inputGen.ToArbitrary(), input =>
        {
            var (handler, _) = CreateHandler(input.Data.Applications, input.Data.Opportunities);
            var query = new GetApplicationsQuery
            {
                PageNumber = 1,
                PageSize = 100,
                SortBy = input.SortBy,
                SortDirection = input.SortDirection
            };

            var result = handler.Handle(query, CancellationToken.None).GetAwaiter().GetResult();
            var isDescending = input.SortDirection == "desc";

            for (var i = 1; i < result.Items.Count; i++)
            {
                var comparison = CompareItems(result.Items[i - 1], result.Items[i], input.SortBy);

                if (isDescending)
                {
                    comparison.Should().BeGreaterThanOrEqualTo(0,
                        $"item[{i - 1}] should be >= item[{i}] when sorted by {input.SortBy} desc");
                }
                else
                {
                    comparison.Should().BeLessThanOrEqualTo(0,
                        $"item[{i - 1}] should be <= item[{i}] when sorted by {input.SortBy} asc");
                }
            }
        });
    }

    #endregion

    #region Generators

    /// <summary>
    /// Generates a cohesive test dataset with PlanningApplications and matching LandOpportunities.
    /// Applications reference real opportunity IDs to ensure the handler join works correctly.
    /// </summary>
    private static Gen<TestApplicationData> GenerateApplicationData()
    {
        return Gen.Choose(3, 25).SelectMany(count =>
        {
            // Generate opportunities first
            var opportunitiesGen = Gen.ListOf(count, GenerateOpportunity()).Select(l => l.ToList());

            return opportunitiesGen.SelectMany(opportunities =>
            {
                // Generate applications referencing the opportunity IDs
                var applicationsGen = Gen.ListOf(count, GenerateApplication(opportunities))
                    .Select(l => l.ToList());

                return applicationsGen.Select(applications =>
                    new TestApplicationData
                    {
                        Applications = applications,
                        Opportunities = opportunities
                    });
            });
        });
    }

    private static Gen<LandOpportunity> GenerateOpportunity()
    {
        return from name in Gen.Elements(SampleOpportunityNames)
               select new LandOpportunity
               {
                   Id = Guid.NewGuid(),
                   Name = name + " " + Guid.NewGuid().ToString("N")[..4],
                   Location = "London",
                   LandSize = 1.0m,
                   Status = OpportunityStatus.Acquired,
                   CreatedAt = DateTime.UtcNow.AddDays(-90),
                   CreatedBy = "test-user"
               };
    }

    private static Gen<PlanningApplication> GenerateApplication(List<LandOpportunity> opportunities)
    {
        var statusGen = Gen.Elements(Enum.GetValues<PlanningApplicationStatus>());
        var typeGen = Gen.Elements(Enum.GetValues<PlanningApplicationType>());
        var councilGen = Gen.Elements(SampleCouncilNames);
        var descriptionGen = Gen.Elements(SampleDescriptions);
        var createdAtGen = Gen.Choose(1, 365).Select(d => DateTime.UtcNow.AddDays(-d));
        var submissionDateGen = Gen.OneOf(
            Gen.Choose(1, 180).Select(d => (DateTime?)DateTime.UtcNow.AddDays(-d)),
            Gen.Constant<DateTime?>(null));
        var targetDecisionDateGen = Gen.OneOf(
            Gen.Choose(1, 90).Select(d => (DateTime?)DateTime.UtcNow.AddDays(d)),
            Gen.Constant<DateTime?>(null));
        var opportunityIndexGen = Gen.Choose(0, opportunities.Count - 1);

        return from status in statusGen
               from appType in typeGen
               from council in councilGen
               from description in descriptionGen
               from createdAt in createdAtGen
               from submissionDate in submissionDateGen
               from targetDate in targetDecisionDateGen
               from oppIdx in opportunityIndexGen
               select new PlanningApplication
               {
                   Id = Guid.NewGuid(),
                   OpportunityId = opportunities[oppIdx].Id,
                   Description = description + " " + Guid.NewGuid().ToString("N")[..4],
                   ApplicationType = appType,
                   Status = status,
                   CouncilName = council,
                   SubmissionDate = submissionDate,
                   TargetDecisionDate = targetDate,
                   CreatedAt = createdAt,
                   CreatedBy = "test-user",
                   IsDeleted = false
               };
    }

    #endregion

    #region Test Helpers

    private static (GetApplicationsQueryHandler Handler, TestApplicationData Data) CreateHandler(
        List<PlanningApplication> applications,
        List<LandOpportunity> opportunities)
    {
        var appRepoMock = new Mock<IRepository<PlanningApplication>>();
        var oppRepoMock = new Mock<IRepository<LandOpportunity>>();

        // Simulate EF Core query filter (exclude soft-deleted)
        var activeApps = applications.Where(a => !a.IsDeleted).ToList();
        appRepoMock.Setup(r => r.Query()).Returns(activeApps.AsAsyncQueryable());
        oppRepoMock.Setup(r => r.Query()).Returns(opportunities.AsAsyncQueryable());

        var handler = new GetApplicationsQueryHandler(appRepoMock.Object, oppRepoMock.Object);
        return (handler, new TestApplicationData { Applications = applications, Opportunities = opportunities });
    }

    /// <summary>
    /// Compares two ApplicationListItemDto values by the specified sort field.
    /// Returns negative if a &lt; b, 0 if equal, positive if a &gt; b.
    /// </summary>
    private static int CompareItems(
        Application.Features.PlanningApprovals.Applications.DTOs.ApplicationListItemDto a,
        Application.Features.PlanningApprovals.Applications.DTOs.ApplicationListItemDto b,
        string sortField)
    {
        return sortField.ToLowerInvariant() switch
        {
            "description" => string.Compare(a.Description, b.Description, StringComparison.Ordinal),
            "createdat" => a.CreatedAt.CompareTo(b.CreatedAt),
            "submissiondate" => Nullable.Compare(a.SubmissionDate, b.SubmissionDate),
            "targetdecisiondate" => Nullable.Compare(a.TargetDecisionDate, b.TargetDecisionDate),
            "status" => ((int)Enum.Parse<PlanningApplicationStatus>(a.Status))
                .CompareTo((int)Enum.Parse<PlanningApplicationStatus>(b.Status)),
            _ => 0
        };
    }

    private sealed class TestApplicationData
    {
        public List<PlanningApplication> Applications { get; init; } = new();
        public List<LandOpportunity> Opportunities { get; init; } = new();
    }

    #endregion
}
