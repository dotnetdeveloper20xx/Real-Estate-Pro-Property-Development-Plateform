using System.Text.RegularExpressions;
using AutoMapper;
using BuildEstate.Application.Features.LegalCompliance.LegalCases.Commands.CreateLegalCase;
using BuildEstate.Application.Features.LegalCompliance.LegalCases.DTOs;
using BuildEstate.Application.Interfaces;
using BuildEstate.Domain.Common;
using BuildEstate.Domain.Entities.LegalCompliance;
using BuildEstate.Domain.Enums;
using BuildEstate.Domain.Services;
using FluentAssertions;
using FsCheck;
using FsCheck.Xunit;
using Moq;

namespace BuildEstate.Tests.PropertyTests.LegalCompliance;

/// <summary>
/// Property-based tests for Entity Creation Invariants (LegalCase).
///
/// Property 5: Entity Creation Invariants
/// For any valid creation command, the resulting entity SHALL have:
/// - A non-empty Guid Id
/// - Status set to Open
/// - CreatedAt within 1 second of UTC now
/// - CreatedBy set to the authenticated user identifier
/// - CaseReference non-empty and matching format LC-YYYY-NNNNN
///
/// **Validates: Requirements 1.1, 1.5**
/// </summary>
public class LegalCaseCreationInvariantsPropertyTests
{
    private static readonly Regex CaseReferencePattern = new(@"^LC-\d{4}-\d{5}$", RegexOptions.Compiled);

    /// <summary>
    /// FsCheck generator for valid Title strings (5-200 characters).
    /// </summary>
    private static Gen<string> ValidTitleGen =>
        Gen.Choose(5, 200)
            .SelectMany(len => Gen.ArrayOf(len, Gen.Elements(
                "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 -".ToCharArray()))
            .Select(chars => new string(chars)));

    /// <summary>
    /// FsCheck generator for valid Description strings (10-2000 characters).
    /// </summary>
    private static Gen<string> ValidDescriptionGen =>
        Gen.Choose(10, 200) // Use 10-200 range for test efficiency
            .SelectMany(len => Gen.ArrayOf(len, Gen.Elements(
                "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 .,!?-".ToCharArray()))
            .Select(chars => new string(chars)));

    /// <summary>
    /// FsCheck generator for valid LegalCaseType enum values.
    /// </summary>
    private static Gen<LegalCaseType> ValidCaseTypeGen =>
        Gen.Elements(Enum.GetValues<LegalCaseType>());

    /// <summary>
    /// FsCheck generator for valid LegalCasePriority enum values.
    /// </summary>
    private static Gen<LegalCasePriority> ValidPriorityGen =>
        Gen.Elements(Enum.GetValues<LegalCasePriority>());

    /// <summary>
    /// FsCheck generator for valid CreateLegalCaseCommand instances.
    /// </summary>
    private static Gen<CreateLegalCaseCommand> ValidCommandGen =>
        from title in ValidTitleGen
        from description in ValidDescriptionGen
        from caseType in ValidCaseTypeGen
        from priority in ValidPriorityGen
        select new CreateLegalCaseCommand
        {
            Title = title,
            Description = description,
            CaseType = caseType,
            Priority = priority,
            OpportunityId = Guid.NewGuid(),
            PlanningApplicationId = null
        };

    /// <summary>
    /// Creates a configured handler with mocked dependencies and returns the userId used.
    /// </summary>
    private static (CreateLegalCaseCommandHandler Handler, string UserId) CreateHandler()
    {
        var userId = Guid.NewGuid().ToString();
        var sequenceNumber = System.Random.Shared.Next(1, 99999);

        var repositoryMock = new Mock<IRepository<LegalCase>>();
        repositoryMock
            .Setup(r => r.AddAsync(It.IsAny<LegalCase>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        var unitOfWorkMock = new Mock<IUnitOfWork>();
        unitOfWorkMock
            .Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        var currentUserServiceMock = new Mock<ICurrentUserService>();
        currentUserServiceMock.Setup(c => c.UserId).Returns(userId);
        currentUserServiceMock.Setup(c => c.UserName).Returns("Test User");

        var referenceNumberGeneratorMock = new Mock<ILegalReferenceNumberGenerator>();
        referenceNumberGeneratorMock
            .Setup(r => r.GenerateCaseReferenceAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync($"LC-{DateTime.UtcNow.Year:D4}-{sequenceNumber:D5}");

        var mapperMock = new Mock<IMapper>();
        mapperMock
            .Setup(m => m.Map<LegalCaseDto>(It.IsAny<LegalCase>()))
            .Returns((LegalCase entity) => new LegalCaseDto
            {
                Id = entity.Id,
                CaseReference = entity.CaseReference,
                Title = entity.Title,
                Description = entity.Description,
                CaseType = entity.CaseType,
                Status = entity.Status,
                Priority = entity.Priority,
                CreatedAt = entity.CreatedAt,
                CreatedBy = entity.CreatedBy,
                OpportunityId = entity.OpportunityId,
                PlanningApplicationId = entity.PlanningApplicationId
            });

        var handler = new CreateLegalCaseCommandHandler(
            repositoryMock.Object,
            unitOfWorkMock.Object,
            currentUserServiceMock.Object,
            referenceNumberGeneratorMock.Object,
            mapperMock.Object);

        return (handler, userId);
    }

    /// <summary>
    /// Property 5: Entity Creation Invariants — Id is non-empty Guid.
    /// For any valid creation command, the resulting entity SHALL have a non-empty Guid Id.
    ///
    /// **Validates: Requirements 1.1, 1.5**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property CreatedLegalCase_HasNonEmptyGuidId()
    {
        return Prop.ForAll(ValidCommandGen.ToArbitrary(), command =>
        {
            var (handler, _) = CreateHandler();

            var result = handler.Handle(command, CancellationToken.None).GetAwaiter().GetResult();

            return (result.Id != Guid.Empty)
                .Label($"Expected non-empty Guid but got {result.Id}");
        });
    }

    /// <summary>
    /// Property 5: Entity Creation Invariants — Status is always Open.
    /// For any valid creation command, the resulting entity SHALL have Status set to Open.
    ///
    /// **Validates: Requirements 1.1, 1.5**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property CreatedLegalCase_StatusIsAlwaysOpen()
    {
        return Prop.ForAll(ValidCommandGen.ToArbitrary(), command =>
        {
            var (handler, _) = CreateHandler();

            var result = handler.Handle(command, CancellationToken.None).GetAwaiter().GetResult();

            return (result.Status == LegalCaseStatus.Open)
                .Label($"Expected Status=Open but got {result.Status}");
        });
    }

    /// <summary>
    /// Property 5: Entity Creation Invariants — CreatedAt within 1 second of UTC now.
    /// For any valid creation command, the resulting entity SHALL have CreatedAt set to
    /// a UTC timestamp within 1 second of invocation time.
    ///
    /// **Validates: Requirements 1.1, 1.5**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property CreatedLegalCase_CreatedAtWithin1SecondOfNow()
    {
        return Prop.ForAll(ValidCommandGen.ToArbitrary(), command =>
        {
            var (handler, _) = CreateHandler();
            var beforeExecution = DateTime.UtcNow;

            var result = handler.Handle(command, CancellationToken.None).GetAwaiter().GetResult();

            var afterExecution = DateTime.UtcNow;

            var withinRange = result.CreatedAt >= beforeExecution.AddSeconds(-1)
                          && result.CreatedAt <= afterExecution.AddSeconds(1);

            return withinRange
                .Label($"CreatedAt {result.CreatedAt:O} not within 1s of now ({beforeExecution:O} - {afterExecution:O})");
        });
    }

    /// <summary>
    /// Property 5: Entity Creation Invariants — CreatedBy matches authenticated user.
    /// For any valid creation command, the resulting entity SHALL have CreatedBy set to
    /// the authenticated user identifier.
    ///
    /// **Validates: Requirements 1.1, 1.5**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property CreatedLegalCase_CreatedByMatchesAuthenticatedUser()
    {
        return Prop.ForAll(ValidCommandGen.ToArbitrary(), command =>
        {
            var (handler, userId) = CreateHandler();

            var result = handler.Handle(command, CancellationToken.None).GetAwaiter().GetResult();

            return (result.CreatedBy == userId)
                .Label($"Expected CreatedBy='{userId}' but got '{result.CreatedBy}'");
        });
    }

    /// <summary>
    /// Property 5: Entity Creation Invariants — CaseReference is non-empty and follows format.
    /// For any valid creation command, the resulting entity SHALL have a CaseReference that is
    /// non-empty and matches the format LC-YYYY-NNNNN.
    ///
    /// **Validates: Requirements 1.1, 1.5**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property CreatedLegalCase_CaseReferenceIsNonEmptyAndFollowsFormat()
    {
        return Prop.ForAll(ValidCommandGen.ToArbitrary(), command =>
        {
            var (handler, _) = CreateHandler();

            var result = handler.Handle(command, CancellationToken.None).GetAwaiter().GetResult();

            var isNonEmpty = !string.IsNullOrWhiteSpace(result.CaseReference);
            var matchesPattern = CaseReferencePattern.IsMatch(result.CaseReference);

            return (isNonEmpty && matchesPattern)
                .Label($"Expected non-empty CaseReference matching LC-YYYY-NNNNN but got '{result.CaseReference}'");
        });
    }
}
