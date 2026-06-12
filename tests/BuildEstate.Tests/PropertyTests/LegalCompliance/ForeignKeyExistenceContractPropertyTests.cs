using AutoMapper;
using BuildEstate.Application.Features.LegalCompliance.Contracts.Commands.CreateContract;
using BuildEstate.Application.Features.LegalCompliance.Contracts.DTOs;
using BuildEstate.Application.Interfaces;
using BuildEstate.Domain.Common;
using BuildEstate.Domain.Entities.LegalCompliance;
using BuildEstate.Domain.Enums;
using BuildEstate.Domain.Exceptions;
using BuildEstate.Domain.Services;
using BuildEstate.Tests.Helpers;
using FluentAssertions;
using FsCheck;
using FsCheck.Xunit;
using Moq;

namespace BuildEstate.Tests.PropertyTests.LegalCompliance;

/// <summary>
/// Property-based tests for Foreign Key Existence Validation (Contract).
///
/// Property 8: Foreign Key Existence Validation
/// Generate creation commands with invalid/valid LegalCaseId references and verify
/// rejection/acceptance. Test CreateContractCommandHandler:
/// - When LegalCaseId doesn't reference an existing case, handler throws EntityNotFoundException.
/// - When it references an existing case with ineligible status, throws BusinessRuleViolationException.
/// - When valid (exists + eligible status), succeeds.
///
/// **Validates: Requirements 3.4**
/// </summary>
public class ForeignKeyExistenceContractPropertyTests
{
    private static readonly LegalCaseStatus[] EligibleStatuses =
    {
        LegalCaseStatus.Open,
        LegalCaseStatus.InProgress,
        LegalCaseStatus.UnderReview
    };

    private static readonly LegalCaseStatus[] IneligibleStatuses =
        Enum.GetValues<LegalCaseStatus>()
            .Where(s => !EligibleStatuses.Contains(s))
            .ToArray();

    #region Generators

    /// <summary>
    /// Generates a valid Title (5-50 chars for efficiency).
    /// </summary>
    private static Gen<string> ValidTitleGen =>
        Gen.Choose(5, 50)
            .SelectMany(len => Gen.ArrayOf(len, Gen.Elements(
                "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 -".ToCharArray()))
            .Select(chars => new string(chars)));

    /// <summary>
    /// Generates a valid CounterpartyName (2-30 chars for efficiency).
    /// </summary>
    private static Gen<string> ValidCounterpartyGen =>
        Gen.Choose(2, 30)
            .SelectMany(len => Gen.ArrayOf(len, Gen.Elements(
                "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ ".ToCharArray()))
            .Select(chars => new string(chars)));

    /// <summary>
    /// Generates a valid ContractType enum value.
    /// </summary>
    private static Gen<LegalContractType> ValidContractTypeGen =>
        Gen.Elements(Enum.GetValues<LegalContractType>());

    /// <summary>
    /// Generates a positive contract value.
    /// </summary>
    private static Gen<decimal> ValidContractValueGen =>
        Gen.Choose(100, 500000).Select(v => (decimal)v);

    /// <summary>
    /// Generates a valid ISO 4217 currency code.
    /// </summary>
    private static Gen<string> ValidCurrencyGen =>
        Gen.Elements("GBP", "USD", "EUR");

    /// <summary>
    /// Generates a valid CreateContractCommand with a specified LegalCaseId.
    /// </summary>
    private static Gen<CreateContractCommand> ValidCommandWithCaseId(Guid legalCaseId) =>
        from title in ValidTitleGen
        from counterparty in ValidCounterpartyGen
        from contractType in ValidContractTypeGen
        from value in ValidContractValueGen
        from currency in ValidCurrencyGen
        select new CreateContractCommand
        {
            LegalCaseId = legalCaseId,
            Title = title,
            ContractType = contractType,
            CounterpartyName = counterparty,
            ContractValue = value,
            Currency = currency,
            StartDate = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc),
            EndDate = new DateTime(2025, 12, 31, 0, 0, 0, DateTimeKind.Utc)
        };

    /// <summary>
    /// Generates a LegalCaseStatus that is eligible for contract creation.
    /// </summary>
    private static Gen<LegalCaseStatus> EligibleStatusGen =>
        Gen.Elements(EligibleStatuses);

    /// <summary>
    /// Generates a LegalCaseStatus that is NOT eligible for contract creation.
    /// </summary>
    private static Gen<LegalCaseStatus> IneligibleStatusGen =>
        Gen.Elements(IneligibleStatuses);

    #endregion

    #region Helper Methods

    /// <summary>
    /// Creates a handler with mocked dependencies where the legal case repository
    /// returns an empty list (simulating non-existent case).
    /// </summary>
    private static CreateContractCommandHandler CreateHandlerWithNoCases()
    {
        var contractRepositoryMock = new Mock<IRepository<Contract>>();
        contractRepositoryMock
            .Setup(r => r.AddAsync(It.IsAny<Contract>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        var legalCaseRepositoryMock = new Mock<IRepository<LegalCase>>();
        legalCaseRepositoryMock
            .Setup(r => r.Query())
            .Returns(new List<LegalCase>().AsAsyncQueryable());

        var unitOfWorkMock = new Mock<IUnitOfWork>();
        unitOfWorkMock
            .Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        var currentUserServiceMock = new Mock<ICurrentUserService>();
        currentUserServiceMock.Setup(c => c.UserId).Returns("test-user-id");
        currentUserServiceMock.Setup(c => c.UserName).Returns("Test User");

        var referenceNumberGeneratorMock = new Mock<ILegalReferenceNumberGenerator>();
        referenceNumberGeneratorMock
            .Setup(r => r.GenerateContractReferenceAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync($"CON-{DateTime.UtcNow.Year:D4}-00001");

        var mapperMock = new Mock<IMapper>();

        return new CreateContractCommandHandler(
            contractRepositoryMock.Object,
            legalCaseRepositoryMock.Object,
            unitOfWorkMock.Object,
            currentUserServiceMock.Object,
            referenceNumberGeneratorMock.Object,
            mapperMock.Object);
    }

    /// <summary>
    /// Creates a handler with a mocked legal case repository that returns
    /// a case with the specified ID and status.
    /// </summary>
    private static CreateContractCommandHandler CreateHandlerWithCase(Guid caseId, LegalCaseStatus status)
    {
        var legalCase = new LegalCase
        {
            Id = caseId,
            CaseReference = "LC-2024-00001",
            Title = "Test Case",
            Description = "Test case for property testing",
            CaseType = LegalCaseType.General,
            Status = status,
            Priority = LegalCasePriority.Medium,
            IsDeleted = false,
            CreatedAt = DateTime.UtcNow.AddDays(-10),
            CreatedBy = "test-user"
        };

        var contractRepositoryMock = new Mock<IRepository<Contract>>();
        contractRepositoryMock
            .Setup(r => r.AddAsync(It.IsAny<Contract>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        var legalCaseRepositoryMock = new Mock<IRepository<LegalCase>>();
        legalCaseRepositoryMock
            .Setup(r => r.Query())
            .Returns(new List<LegalCase> { legalCase }.AsAsyncQueryable());

        var unitOfWorkMock = new Mock<IUnitOfWork>();
        unitOfWorkMock
            .Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        var currentUserServiceMock = new Mock<ICurrentUserService>();
        currentUserServiceMock.Setup(c => c.UserId).Returns("test-user-id");
        currentUserServiceMock.Setup(c => c.UserName).Returns("Test User");

        var referenceNumberGeneratorMock = new Mock<ILegalReferenceNumberGenerator>();
        referenceNumberGeneratorMock
            .Setup(r => r.GenerateContractReferenceAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync($"CON-{DateTime.UtcNow.Year:D4}-00001");

        var mapperMock = new Mock<IMapper>();
        mapperMock
            .Setup(m => m.Map<ContractDto>(It.IsAny<Contract>()))
            .Returns((Contract entity) => new ContractDto
            {
                Id = entity.Id,
                ContractReference = entity.ContractReference,
                Title = entity.Title,
                ContractType = entity.ContractType.ToString(),
                Status = entity.Status.ToString(),
                CounterpartyName = entity.CounterpartyName,
                ContractValue = entity.ContractValue,
                Currency = entity.Currency,
                StartDate = entity.StartDate,
                EndDate = entity.EndDate,
                LegalCaseId = entity.LegalCaseId,
                CreatedAt = entity.CreatedAt,
                CreatedBy = entity.CreatedBy
            });

        return new CreateContractCommandHandler(
            contractRepositoryMock.Object,
            legalCaseRepositoryMock.Object,
            unitOfWorkMock.Object,
            currentUserServiceMock.Object,
            referenceNumberGeneratorMock.Object,
            mapperMock.Object);
    }

    #endregion

    #region Property 8a: Non-existent LegalCaseId throws EntityNotFoundException

    /// <summary>
    /// Property 8a: When LegalCaseId does not reference an existing LegalCase,
    /// the handler SHALL throw EntityNotFoundException.
    ///
    /// **Validates: Requirements 3.4**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property NonExistentLegalCaseId_ThrowsEntityNotFoundException()
    {
        var gen = ValidCommandWithCaseId(Guid.NewGuid());

        return Prop.ForAll(gen.ToArbitrary(), command =>
        {
            var handler = CreateHandlerWithNoCases();

            var act = () => handler.Handle(command, CancellationToken.None).GetAwaiter().GetResult();

            var exception = Assert.Throws<EntityNotFoundException>(act);
            return (exception.EntityType == nameof(LegalCase))
                .Label($"Expected EntityNotFoundException for LegalCase but got EntityType='{exception.EntityType}'");
        });
    }

    #endregion

    #region Property 8b: Existing LegalCase with ineligible status throws BusinessRuleViolationException

    /// <summary>
    /// Property 8b: When LegalCaseId references an existing LegalCase whose Status
    /// is NOT Open, InProgress, or UnderReview, the handler SHALL throw
    /// BusinessRuleViolationException.
    ///
    /// **Validates: Requirements 3.4**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property IneligibleCaseStatus_ThrowsBusinessRuleViolationException()
    {
        var gen =
            from status in IneligibleStatusGen
            let caseId = Guid.NewGuid()
            from command in ValidCommandWithCaseId(caseId)
            select (command, caseId, status);

        return Prop.ForAll(gen.ToArbitrary(), tuple =>
        {
            var (command, caseId, status) = tuple;
            var handler = CreateHandlerWithCase(caseId, status);

            var act = () => handler.Handle(command, CancellationToken.None).GetAwaiter().GetResult();

            var exception = Assert.Throws<BusinessRuleViolationException>(act);
            return (exception.RuleName == "LegalCaseStatusEligibility")
                .Label($"Expected BusinessRuleViolationException with RuleName='LegalCaseStatusEligibility' " +
                       $"but got '{exception.RuleName}' for status '{status}'");
        });
    }

    #endregion

    #region Property 8c: Valid LegalCaseId with eligible status succeeds

    /// <summary>
    /// Property 8c: When LegalCaseId references an existing LegalCase with an eligible
    /// status (Open, InProgress, or UnderReview), the handler SHALL succeed and return
    /// a ContractDto with Status=Draft and matching LegalCaseId.
    ///
    /// **Validates: Requirements 3.4**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property ValidCaseWithEligibleStatus_Succeeds()
    {
        var gen =
            from status in EligibleStatusGen
            let caseId = Guid.NewGuid()
            from command in ValidCommandWithCaseId(caseId)
            select (command, caseId, status);

        return Prop.ForAll(gen.ToArbitrary(), tuple =>
        {
            var (command, caseId, status) = tuple;
            var handler = CreateHandlerWithCase(caseId, status);

            var result = handler.Handle(command, CancellationToken.None).GetAwaiter().GetResult();

            var statusIsDraft = result.Status == LegalContractStatus.Draft.ToString();
            var caseIdMatches = result.LegalCaseId == caseId;
            var idIsNonEmpty = result.Id != Guid.Empty;

            return (statusIsDraft && caseIdMatches && idIsNonEmpty)
                .Label($"Expected Draft status with CaseId={caseId}, got Status='{result.Status}', " +
                       $"LegalCaseId='{result.LegalCaseId}', Id='{result.Id}' for case status '{status}'");
        });
    }

    #endregion
}
