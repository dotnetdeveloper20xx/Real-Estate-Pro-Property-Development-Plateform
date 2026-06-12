using BuildEstate.Application.Features.LegalCompliance.LegalCases.Commands.CreateLegalCase;
using BuildEstate.Domain.Common;
using BuildEstate.Domain.Entities.LandAcquisition;
using BuildEstate.Domain.Entities.PlanningApprovals;
using BuildEstate.Domain.Enums;
using BuildEstate.Tests.Helpers;
using FluentAssertions;
using FluentValidation.TestHelper;
using FsCheck;
using FsCheck.Xunit;
using Moq;

namespace BuildEstate.Tests.PropertyTests.LegalCompliance;

/// <summary>
/// Property-based tests for <see cref="CreateLegalCaseCommandValidator"/>.
/// Generates random invalid and valid field values and verifies the validator
/// correctly rejects or accepts them.
///
/// **Validates: Requirements 1.2**
/// </summary>
public class InputValidationLegalCasePropertyTests
{
    private readonly CreateLegalCaseCommandValidator _validator;

    public InputValidationLegalCasePropertyTests()
    {
        // Mock repositories that always return true for existence checks
        // so we can focus on field-level validation
        var opportunityRepoMock = new Mock<IRepository<LandOpportunity>>();
        var planningAppRepoMock = new Mock<IRepository<PlanningApplication>>();

        var existingOpportunity = new LandOpportunity { Id = Guid.NewGuid(), IsDeleted = false };
        var existingPlanningApp = new PlanningApplication { Id = Guid.NewGuid(), IsDeleted = false };

        opportunityRepoMock
            .Setup(r => r.Query())
            .Returns(new List<LandOpportunity> { existingOpportunity }.AsAsyncQueryable());

        planningAppRepoMock
            .Setup(r => r.Query())
            .Returns(new List<PlanningApplication> { existingPlanningApp }.AsAsyncQueryable());

        _validator = new CreateLegalCaseCommandValidator(
            opportunityRepoMock.Object,
            planningAppRepoMock.Object);
    }

    /// <summary>
    /// Generates a valid base command with all fields within acceptable ranges.
    /// Used as starting point for mutation-based testing.
    /// </summary>
    private static CreateLegalCaseCommand CreateValidCommand() => new()
    {
        Title = "Valid Legal Case Title",
        Description = "This is a valid description for a legal case entity.",
        CaseType = LegalCaseType.Conveyancing,
        Priority = LegalCasePriority.Medium,
        OpportunityId = Guid.NewGuid(),
        PlanningApplicationId = null
    };

    #region Title Validation

    /// <summary>
    /// Property 6: Titles shorter than 5 characters SHALL be rejected.
    ///
    /// **Validates: Requirements 1.2**
    /// </summary>
    [Property(MaxTest = 50)]
    public Property TitleTooShort_IsRejected()
    {
        // Generate strings of length 1..4 (non-empty, under 5 chars)
        var shortTitleGen = Gen.Choose(1, 4)
            .SelectMany(len => Gen.ArrayOf(len, Gen.Elements<char>("abcdefghijklmnopqrstuvwxyz".ToCharArray()))
                .Select(chars => new string(chars)));

        return Prop.ForAll(
            shortTitleGen.ToArbitrary(),
            title =>
            {
                var command = CreateValidCommand() with { Title = title };
                var result = _validator.TestValidateAsync(command).Result;

                return result.ShouldHaveValidationErrorFor(x => x.Title).Any()
                    .Label($"Title '{title}' (length {title.Length}) should be rejected");
            });
    }

    /// <summary>
    /// Property 6: Titles longer than 200 characters SHALL be rejected.
    ///
    /// **Validates: Requirements 1.2**
    /// </summary>
    [Property(MaxTest = 50)]
    public Property TitleTooLong_IsRejected()
    {
        // Generate strings of length 201..300
        var longTitleGen = Gen.Choose(201, 300)
            .Select(len => new string('A', len));

        return Prop.ForAll(
            longTitleGen.ToArbitrary(),
            title =>
            {
                var command = CreateValidCommand() with { Title = title };
                var result = _validator.TestValidateAsync(command).Result;

                return result.ShouldHaveValidationErrorFor(x => x.Title).Any()
                    .Label($"Title of length {title.Length} should be rejected");
            });
    }

    #endregion

    #region Description Validation

    /// <summary>
    /// Property 6: Descriptions shorter than 10 characters SHALL be rejected.
    ///
    /// **Validates: Requirements 1.2**
    /// </summary>
    [Property(MaxTest = 50)]
    public Property DescriptionTooShort_IsRejected()
    {
        // Generate strings of length 1..9 (non-empty, under 10 chars)
        var shortDescGen = Gen.Choose(1, 9)
            .SelectMany(len => Gen.ArrayOf(len, Gen.Elements<char>("abcdefghijklmnopqrstuvwxyz".ToCharArray()))
                .Select(chars => new string(chars)));

        return Prop.ForAll(
            shortDescGen.ToArbitrary(),
            description =>
            {
                var command = CreateValidCommand() with { Description = description };
                var result = _validator.TestValidateAsync(command).Result;

                return result.ShouldHaveValidationErrorFor(x => x.Description).Any()
                    .Label($"Description '{description}' (length {description.Length}) should be rejected");
            });
    }

    /// <summary>
    /// Property 6: Descriptions longer than 2000 characters SHALL be rejected.
    ///
    /// **Validates: Requirements 1.2**
    /// </summary>
    [Property(MaxTest = 50)]
    public Property DescriptionTooLong_IsRejected()
    {
        // Generate strings of length 2001..2500
        var longDescGen = Gen.Choose(2001, 2500)
            .Select(len => new string('B', len));

        return Prop.ForAll(
            longDescGen.ToArbitrary(),
            description =>
            {
                var command = CreateValidCommand() with { Description = description };
                var result = _validator.TestValidateAsync(command).Result;

                return result.ShouldHaveValidationErrorFor(x => x.Description).Any()
                    .Label($"Description of length {description.Length} should be rejected");
            });
    }

    #endregion

    #region Missing Link Validation

    /// <summary>
    /// Property 6: Commands missing both OpportunityId and PlanningApplicationId SHALL be rejected.
    ///
    /// **Validates: Requirements 1.2**
    /// </summary>
    [Fact]
    public async Task MissingBothLinks_IsRejected()
    {
        var command = CreateValidCommand() with
        {
            OpportunityId = null,
            PlanningApplicationId = null
        };

        var result = await _validator.TestValidateAsync(command);

        result.IsValid.Should().BeFalse(
            "at least one of OpportunityId or PlanningApplicationId must be provided");
    }

    #endregion

    #region Valid Data Acceptance

    /// <summary>
    /// Property 6: Commands with all fields within valid ranges SHALL be accepted.
    ///
    /// **Validates: Requirements 1.2**
    /// </summary>
    [Property(MaxTest = 50)]
    public Property ValidData_IsAccepted()
    {
        var validCaseTypes = Enum.GetValues<LegalCaseType>();
        var validPriorities = Enum.GetValues<LegalCasePriority>();

        // Generate valid titles (5-200 chars)
        var validTitleGen = Gen.Choose(5, 200)
            .SelectMany(len => Gen.ArrayOf(len, Gen.Elements<char>("abcdefghijklmnopqrstuvwxyz ".ToCharArray()))
                .Select(chars => new string(chars)));

        // Generate valid descriptions (10-2000 chars)
        var validDescGen = Gen.Choose(10, 200)
            .SelectMany(len => Gen.ArrayOf(len, Gen.Elements<char>("abcdefghijklmnopqrstuvwxyz ".ToCharArray()))
                .Select(chars => new string(chars)));

        var validCommandGen = from title in validTitleGen
                              from desc in validDescGen
                              from caseType in Gen.Elements(validCaseTypes)
                              from priority in Gen.Elements(validPriorities)
                              select new CreateLegalCaseCommand
                              {
                                  Title = title,
                                  Description = desc,
                                  CaseType = caseType,
                                  Priority = priority,
                                  OpportunityId = Guid.NewGuid(),
                                  PlanningApplicationId = null
                              };

        return Prop.ForAll(
            validCommandGen.ToArbitrary(),
            command =>
            {
                // Note: Existence checks will fail for random GUIDs, 
                // so we use a known GUID from setup for this test
                var validCommand = command with { OpportunityId = Guid.NewGuid() };

                // For valid data test, we need to bypass the async existence check
                // by providing an ID that the mock knows about.
                // Instead, test synchronous validation rules only using a mock that always returns true.
                var opportunityRepoMock = new Mock<IRepository<LandOpportunity>>();
                var planningAppRepoMock = new Mock<IRepository<PlanningApplication>>();

                // Create a mock that matches any GUID
                opportunityRepoMock
                    .Setup(r => r.Query())
                    .Returns((IQueryable<LandOpportunity>)new List<LandOpportunity>
                    {
                        new() { Id = command.OpportunityId!.Value, IsDeleted = false }
                    }.AsAsyncQueryable());

                planningAppRepoMock
                    .Setup(r => r.Query())
                    .Returns(new List<PlanningApplication>().AsAsyncQueryable());

                var validator = new CreateLegalCaseCommandValidator(
                    opportunityRepoMock.Object,
                    planningAppRepoMock.Object);

                var result = validator.TestValidateAsync(command).Result;

                return result.IsValid
                    .Label($"Valid command with Title.Length={command.Title.Length}, " +
                           $"Desc.Length={command.Description.Length}, " +
                           $"CaseType={command.CaseType}, Priority={command.Priority} should pass");
            });
    }

    #endregion

    #region Invalid Enum Validation

    /// <summary>
    /// Property 6: Invalid CaseType enum values SHALL be rejected.
    ///
    /// **Validates: Requirements 1.2**
    /// </summary>
    [Property(MaxTest = 50)]
    public Property InvalidCaseType_IsRejected()
    {
        var maxEnumValue = Enum.GetValues<LegalCaseType>().Cast<int>().Max();

        // Generate integer values outside the valid enum range
        var invalidEnumGen = Gen.Choose(maxEnumValue + 1, maxEnumValue + 100)
            .Select(i => (LegalCaseType)i);

        return Prop.ForAll(
            invalidEnumGen.ToArbitrary(),
            invalidCaseType =>
            {
                var command = CreateValidCommand() with { CaseType = invalidCaseType };
                var result = _validator.TestValidateAsync(command).Result;

                return result.ShouldHaveValidationErrorFor(x => x.CaseType).Any()
                    .Label($"CaseType value {(int)invalidCaseType} should be rejected");
            });
    }

    /// <summary>
    /// Property 6: Invalid Priority enum values SHALL be rejected.
    ///
    /// **Validates: Requirements 1.2**
    /// </summary>
    [Property(MaxTest = 50)]
    public Property InvalidPriority_IsRejected()
    {
        var maxEnumValue = Enum.GetValues<LegalCasePriority>().Cast<int>().Max();

        // Generate integer values outside the valid enum range
        var invalidEnumGen = Gen.Choose(maxEnumValue + 1, maxEnumValue + 100)
            .Select(i => (LegalCasePriority)i);

        return Prop.ForAll(
            invalidEnumGen.ToArbitrary(),
            invalidPriority =>
            {
                var command = CreateValidCommand() with { Priority = invalidPriority };
                var result = _validator.TestValidateAsync(command).Result;

                return result.ShouldHaveValidationErrorFor(x => x.Priority).Any()
                    .Label($"Priority value {(int)invalidPriority} should be rejected");
            });
    }

    #endregion
}
