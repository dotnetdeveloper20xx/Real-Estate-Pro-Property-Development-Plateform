using AutoMapper;
using BuildEstate.Application.Features.PlanningApprovals.Applications.Commands.CreateApplication;
using BuildEstate.Application.Features.PlanningApprovals.Applications.DTOs;
using BuildEstate.Application.Interfaces;
using BuildEstate.Domain.Common;
using BuildEstate.Domain.Entities.LandAcquisition;
using BuildEstate.Domain.Entities.PlanningApprovals;
using BuildEstate.Domain.Enums;
using BuildEstate.Domain.Exceptions;
using BuildEstate.Tests.Helpers;
using FluentAssertions;
using FsCheck;
using FsCheck.Xunit;
using Moq;

namespace BuildEstate.Tests.PropertyTests.PlanningApprovals;

/// <summary>
/// Property-based tests for PlanningApplication creation validating:
/// - Only LandOpportunities with Acquired status allow application creation
/// - Active application uniqueness per opportunity is enforced
/// - Description and CouncilName field length boundaries are enforced
///
/// **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.6**
/// </summary>
public class ApplicationCreationPropertyTests
{
    #region Property 5: Application Creation Requires Acquired Opportunity

    /// <summary>
    /// Property 5: For any LandOpportunity with a Status value other than Acquired,
    /// attempting to create a PlanningApplication referencing that opportunity SHALL always
    /// be rejected with a BusinessRuleViolationException.
    ///
    /// **Validates: Requirements 1.1, 1.2, 1.3**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property ApplicationCreation_WithNonAcquiredOpportunityStatus_AlwaysFails()
    {
        var nonAcquiredStatuses = Enum.GetValues<OpportunityStatus>()
            .Where(s => s != OpportunityStatus.Acquired)
            .ToArray();

        return Prop.ForAll(
            Gen.Elements(nonAcquiredStatuses).ToArbitrary(),
            status =>
            {
                // Arrange
                var opportunityId = Guid.NewGuid();
                var opportunity = CreateOpportunity(opportunityId, status);
                var handler = CreateHandler(opportunity, existingApplications: new List<PlanningApplication>());

                var command = new CreateApplicationCommand
                {
                    OpportunityId = opportunityId,
                    ApplicationType = PlanningApplicationType.Full,
                    Description = "A valid description for this planning application",
                    CouncilName = "Test Council Name"
                };

                // Act
                Func<Task> act = () => handler.Handle(command, CancellationToken.None);

                // Assert
                act.Should().ThrowAsync<BusinessRuleViolationException>().GetAwaiter().GetResult()
                    .Which.RuleName.Should().Be("OpportunityMustBeAcquired");

                return true;
            });
    }

    /// <summary>
    /// Property 5 (continued): For any LandOpportunity with Status = Acquired,
    /// creation with valid data SHALL succeed and produce an entity with Status = PreApplication.
    ///
    /// **Validates: Requirements 1.1, 1.2, 1.3**
    /// </summary>
    [Property(MaxTest = 50)]
    public Property ApplicationCreation_WithAcquiredStatus_SucceedsAndProducesPreApplicationStatus()
    {
        var applicationTypeGen = Gen.Elements(Enum.GetValues<PlanningApplicationType>());

        return Prop.ForAll(
            applicationTypeGen.ToArbitrary(),
            applicationType =>
            {
                // Arrange
                var opportunityId = Guid.NewGuid();
                var opportunity = CreateOpportunity(opportunityId, OpportunityStatus.Acquired);

                PlanningApplication? capturedApplication = null;
                var handler = CreateHandler(
                    opportunity,
                    existingApplications: new List<PlanningApplication>(),
                    onAdd: app => capturedApplication = app);

                var command = new CreateApplicationCommand
                {
                    OpportunityId = opportunityId,
                    ApplicationType = applicationType,
                    Description = "A valid description for this planning application",
                    CouncilName = "Test Council Name"
                };

                // Act
                var result = handler.Handle(command, CancellationToken.None).GetAwaiter().GetResult();

                // Assert — created application must have Status = PreApplication
                capturedApplication.Should().NotBeNull();
                capturedApplication!.Status.Should().Be(PlanningApplicationStatus.PreApplication,
                    "newly created planning applications must always have Status = PreApplication");
                capturedApplication.OpportunityId.Should().Be(opportunityId);
                capturedApplication.ApplicationType.Should().Be(applicationType);

                return true;
            });
    }

    /// <summary>
    /// Property 5 (continued): Exhaustive verification across ALL OpportunityStatus values.
    /// Creation succeeds if and only if status == Acquired.
    ///
    /// **Validates: Requirements 1.1, 1.2, 1.3**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property ApplicationCreation_OnlyAcquiredStatus_AllowsCreation()
    {
        var allStatuses = Enum.GetValues<OpportunityStatus>();

        return Prop.ForAll(
            Gen.Elements(allStatuses).ToArbitrary(),
            status =>
            {
                // Arrange
                var opportunityId = Guid.NewGuid();
                var opportunity = CreateOpportunity(opportunityId, status);
                var handler = CreateHandler(opportunity, existingApplications: new List<PlanningApplication>());

                var command = new CreateApplicationCommand
                {
                    OpportunityId = opportunityId,
                    ApplicationType = PlanningApplicationType.Full,
                    Description = "A valid description for this planning application",
                    CouncilName = "Test Council Name"
                };

                // Act
                Func<Task> act = () => handler.Handle(command, CancellationToken.None);

                // Assert
                if (status == OpportunityStatus.Acquired)
                {
                    act.Should().NotThrowAsync().GetAwaiter().GetResult();
                }
                else
                {
                    act.Should().ThrowAsync<BusinessRuleViolationException>().GetAwaiter().GetResult();
                }

                return true;
            });
    }

    #endregion

    #region Property 6: Active Application Uniqueness Per Opportunity

    /// <summary>
    /// Property 6: For any LandOpportunity that already has a PlanningApplication with a Status
    /// NOT in {Withdrawn, Refused}, attempting to create a new PlanningApplication for the same
    /// opportunity SHALL be rejected with a DuplicateEntityException.
    ///
    /// **Validates: Requirements 1.6**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property ApplicationCreation_WithActiveApplicationExisting_AlwaysFails()
    {
        // Active statuses = all statuses except Withdrawn and Refused
        var activeStatuses = Enum.GetValues<PlanningApplicationStatus>()
            .Where(s => s != PlanningApplicationStatus.Withdrawn && s != PlanningApplicationStatus.Refused)
            .ToArray();

        return Prop.ForAll(
            Gen.Elements(activeStatuses).ToArbitrary(),
            existingStatus =>
            {
                // Arrange
                var opportunityId = Guid.NewGuid();
                var opportunity = CreateOpportunity(opportunityId, OpportunityStatus.Acquired);

                var existingApp = new PlanningApplication
                {
                    Id = Guid.NewGuid(),
                    OpportunityId = opportunityId,
                    Status = existingStatus,
                    Description = "Existing active application",
                    ApplicationType = PlanningApplicationType.Full,
                    CouncilName = "Existing Council",
                    IsDeleted = false,
                    CreatedAt = DateTime.UtcNow,
                    CreatedBy = "existing-user"
                };

                var handler = CreateHandler(opportunity, existingApplications: new List<PlanningApplication> { existingApp });

                var command = new CreateApplicationCommand
                {
                    OpportunityId = opportunityId,
                    ApplicationType = PlanningApplicationType.Outline,
                    Description = "A valid description for a new application",
                    CouncilName = "New Council Name"
                };

                // Act
                Func<Task> act = () => handler.Handle(command, CancellationToken.None);

                // Assert
                act.Should().ThrowAsync<DuplicateEntityException>().GetAwaiter().GetResult();

                return true;
            });
    }

    /// <summary>
    /// Property 6 (continued): If the only existing applications for the opportunity have
    /// Status in {Withdrawn, Refused}, creation SHALL succeed.
    ///
    /// **Validates: Requirements 1.6**
    /// </summary>
    [Property(MaxTest = 50)]
    public Property ApplicationCreation_WithOnlyWithdrawnOrRefusedApplications_Succeeds()
    {
        var inactiveStatuses = new[] { PlanningApplicationStatus.Withdrawn, PlanningApplicationStatus.Refused };

        return Prop.ForAll(
            Gen.Elements(inactiveStatuses).ToArbitrary(),
            existingStatus =>
            {
                // Arrange
                var opportunityId = Guid.NewGuid();
                var opportunity = CreateOpportunity(opportunityId, OpportunityStatus.Acquired);

                var existingApp = new PlanningApplication
                {
                    Id = Guid.NewGuid(),
                    OpportunityId = opportunityId,
                    Status = existingStatus,
                    Description = "Previously withdrawn/refused application",
                    ApplicationType = PlanningApplicationType.Full,
                    CouncilName = "Old Council",
                    IsDeleted = false,
                    CreatedAt = DateTime.UtcNow.AddDays(-30),
                    CreatedBy = "previous-user"
                };

                PlanningApplication? capturedApplication = null;
                var handler = CreateHandler(
                    opportunity,
                    existingApplications: new List<PlanningApplication> { existingApp },
                    onAdd: app => capturedApplication = app);

                var command = new CreateApplicationCommand
                {
                    OpportunityId = opportunityId,
                    ApplicationType = PlanningApplicationType.Full,
                    Description = "A valid description for a new application",
                    CouncilName = "New Council Name"
                };

                // Act
                Func<Task> act = () => handler.Handle(command, CancellationToken.None);

                // Assert — should succeed
                act.Should().NotThrowAsync().GetAwaiter().GetResult();
                capturedApplication.Should().NotBeNull();
                capturedApplication!.Status.Should().Be(PlanningApplicationStatus.PreApplication);

                return true;
            });
    }

    #endregion

    #region Property 7: Application Field Validation Boundaries

    /// <summary>
    /// Property 7: For any Description string, it SHALL be accepted if and only if its
    /// trimmed length is between 10 and 2000 characters inclusive. Tests the validator directly.
    ///
    /// **Validates: Requirements 1.4**
    /// </summary>
    [Property(MaxTest = 200)]
    public Property Description_AcceptedOnlyWhenTrimmedLengthBetween10And2000()
    {
        // Generate string lengths that span below, within, and above valid range
        var lengthGen = Gen.Frequency(
            Tuple.Create(3, Gen.Choose(0, 9)),       // below minimum
            Tuple.Create(4, Gen.Choose(10, 2000)),   // within valid range
            Tuple.Create(3, Gen.Choose(2001, 2500))  // above maximum
        );

        return Prop.ForAll(
            lengthGen.ToArbitrary(),
            length =>
            {
                // Arrange
                var description = new string('a', length);
                var command = new CreateApplicationCommand
                {
                    OpportunityId = Guid.NewGuid(),
                    ApplicationType = PlanningApplicationType.Full,
                    Description = description,
                    CouncilName = "Valid Council Name"
                };

                var validator = new CreateApplicationCommandValidator();

                // Act
                var result = validator.Validate(command);

                // Assert — description is valid only when length is between 10 and 2000
                var isValidLength = length >= 10 && length <= 2000;
                var hasDescriptionError = result.Errors.Any(e => e.PropertyName == "Description");

                return (hasDescriptionError != isValidLength)
                    .Label($"Description length {length}: expected valid={isValidLength}, hasError={hasDescriptionError}");
            });
    }

    /// <summary>
    /// Property 7 (continued): For any CouncilName string, it SHALL be accepted if and only if
    /// its trimmed length is between 3 and 200 characters inclusive. Tests the validator directly.
    ///
    /// **Validates: Requirements 1.4**
    /// </summary>
    [Property(MaxTest = 200)]
    public Property CouncilName_AcceptedOnlyWhenTrimmedLengthBetween3And200()
    {
        // Generate string lengths that span below, within, and above valid range
        var lengthGen = Gen.Frequency(
            Tuple.Create(3, Gen.Choose(0, 2)),     // below minimum (including empty)
            Tuple.Create(4, Gen.Choose(3, 200)),   // within valid range
            Tuple.Create(3, Gen.Choose(201, 300))  // above maximum
        );

        return Prop.ForAll(
            lengthGen.ToArbitrary(),
            length =>
            {
                // Arrange
                var councilName = length == 0 ? string.Empty : new string('c', length);
                var command = new CreateApplicationCommand
                {
                    OpportunityId = Guid.NewGuid(),
                    ApplicationType = PlanningApplicationType.Full,
                    Description = "A valid description for testing",
                    CouncilName = councilName
                };

                var validator = new CreateApplicationCommandValidator();

                // Act
                var result = validator.Validate(command);

                // Assert — council name is valid only when length is between 3 and 200
                var isValidLength = length >= 3 && length <= 200;
                var hasCouncilNameError = result.Errors.Any(e => e.PropertyName == "CouncilName");

                return (hasCouncilNameError != isValidLength)
                    .Label($"CouncilName length {length}: expected valid={isValidLength}, hasError={hasCouncilNameError}");
            });
    }

    /// <summary>
    /// Property 7 (continued): For any ApplicationType value, it SHALL be accepted if and only
    /// if it is a valid member of the PlanningApplicationType enum. Tests the validator directly.
    ///
    /// **Validates: Requirements 1.4**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property ApplicationType_AcceptedOnlyForValidEnumValues()
    {
        // Generate both valid enum values and invalid integer values cast to the enum
        var valueGen = Gen.Frequency(
            Tuple.Create(5, Gen.Elements(Enum.GetValues<PlanningApplicationType>())
                .Select(v => (int)v)),
            Tuple.Create(5, Gen.Choose(100, 200))  // invalid enum values
        );

        return Prop.ForAll(
            valueGen.ToArbitrary(),
            intValue =>
            {
                // Arrange
                var command = new CreateApplicationCommand
                {
                    OpportunityId = Guid.NewGuid(),
                    ApplicationType = (PlanningApplicationType)intValue,
                    Description = "A valid description for testing",
                    CouncilName = "Valid Council Name"
                };

                var validator = new CreateApplicationCommandValidator();

                // Act
                var result = validator.Validate(command);

                // Assert
                var isValidEnum = Enum.IsDefined(typeof(PlanningApplicationType), intValue);
                var hasApplicationTypeError = result.Errors.Any(e => e.PropertyName == "ApplicationType");

                return (hasApplicationTypeError != isValidEnum)
                    .Label($"ApplicationType value {intValue}: expected valid={isValidEnum}, hasError={hasApplicationTypeError}");
            });
    }

    #endregion

    #region Test Helpers

    private static LandOpportunity CreateOpportunity(Guid opportunityId, OpportunityStatus status)
    {
        return new LandOpportunity
        {
            Id = opportunityId,
            Name = "Test Land Opportunity",
            Location = "Test Location",
            LandSize = 5000,
            Status = status,
            IsDeleted = false,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = "test-user"
        };
    }

    private static CreateApplicationCommandHandler CreateHandler(
        LandOpportunity opportunity,
        List<PlanningApplication> existingApplications,
        Action<PlanningApplication>? onAdd = null)
    {
        var opportunityRepoMock = new Mock<IRepository<LandOpportunity>>();
        var applicationRepoMock = new Mock<IRepository<PlanningApplication>>();
        var unitOfWorkMock = new Mock<IUnitOfWork>();
        var currentUserMock = new Mock<ICurrentUserService>();
        var mapperMock = new Mock<IMapper>();

        // Setup opportunity repository Query() to return the test opportunity
        var opportunities = new List<LandOpportunity> { opportunity };
        opportunityRepoMock
            .Setup(r => r.Query())
            .Returns(opportunities.AsAsyncQueryable());

        // Setup application repository Query() to return existing applications
        applicationRepoMock
            .Setup(r => r.Query())
            .Returns(existingApplications.AsAsyncQueryable());

        // Capture added application for assertion
        applicationRepoMock
            .Setup(r => r.AddAsync(It.IsAny<PlanningApplication>(), It.IsAny<CancellationToken>()))
            .Callback<PlanningApplication, CancellationToken>((app, _) => onAdd?.Invoke(app))
            .Returns(Task.CompletedTask);

        unitOfWorkMock
            .Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        currentUserMock
            .Setup(c => c.UserId)
            .Returns("test-user");

        mapperMock
            .Setup(m => m.Map<ApplicationDto>(It.IsAny<PlanningApplication>()))
            .Returns((PlanningApplication app) => new ApplicationDto
            {
                Id = app.Id,
                OpportunityId = app.OpportunityId,
                Description = app.Description,
                ApplicationType = app.ApplicationType.ToString(),
                Status = app.Status.ToString(),
                CouncilName = app.CouncilName,
                CreatedAt = app.CreatedAt,
                CreatedBy = app.CreatedBy
            });

        return new CreateApplicationCommandHandler(
            opportunityRepoMock.Object,
            applicationRepoMock.Object,
            unitOfWorkMock.Object,
            currentUserMock.Object,
            mapperMock.Object);
    }

    #endregion
}
