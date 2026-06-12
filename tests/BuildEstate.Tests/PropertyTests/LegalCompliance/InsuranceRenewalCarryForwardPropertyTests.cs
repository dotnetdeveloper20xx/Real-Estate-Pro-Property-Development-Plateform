using AutoMapper;
using BuildEstate.Application.Features.LegalCompliance.Insurance.Commands.RenewInsuranceRecord;
using BuildEstate.Application.Features.LegalCompliance.Insurance.DTOs;
using BuildEstate.Application.Interfaces;
using BuildEstate.Domain.Common;
using BuildEstate.Domain.Entities.LegalCompliance;
using BuildEstate.Domain.Enums;
using BuildEstate.Domain.Services;
using BuildEstate.Infrastructure.Services.LegalCompliance;
using FluentAssertions;
using FsCheck;
using FsCheck.Xunit;
using Moq;

namespace BuildEstate.Tests.PropertyTests.LegalCompliance;

/// <summary>
/// Property-based tests for insurance renewal field carry-forward.
///
/// Property 14: Insurance Renewal Carries Forward Fields
/// Generate random insurance records, renew them, and verify that:
/// - The NEW record's PreviousPolicyId equals the OLD record's Id
/// - PolicyNumber, Insurer, CoverageType, OpportunityId, LegalCaseId are carried forward from the original
/// - The new record's Status is Active
///
/// Tests the RenewInsuranceRecordCommandHandler directly.
///
/// **Validates: Requirements 7.6**
/// </summary>
public class InsuranceRenewalCarryForwardPropertyTests
{
    /// <summary>
    /// Valid statuses from which an insurance record can be renewed (ExpiringSoon or Expired).
    /// </summary>
    private static readonly InsuranceStatus[] RenewableStatuses =
    {
        InsuranceStatus.ExpiringSoon,
        InsuranceStatus.Expired
    };

    #region Generators

    /// <summary>
    /// Generates a random PolicyNumber (3-50 alphanumeric characters).
    /// </summary>
    private static Gen<string> PolicyNumberGen =>
        Gen.Choose(3, 20)
            .SelectMany(len => Gen.ArrayOf(len, Gen.Elements(
                "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-".ToCharArray()))
            .Select(chars => new string(chars)));

    /// <summary>
    /// Generates a random Insurer name (2-50 characters).
    /// </summary>
    private static Gen<string> InsurerGen =>
        Gen.Choose(5, 30)
            .SelectMany(len => Gen.ArrayOf(len, Gen.Elements(
                "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ ".ToCharArray()))
            .Select(chars => new string(chars)));

    /// <summary>
    /// Generates a random CoverageType enum value.
    /// </summary>
    private static Gen<CoverageType> CoverageTypeGen =>
        Gen.Elements(Enum.GetValues<CoverageType>());

    /// <summary>
    /// Generates a random renewable status (ExpiringSoon or Expired).
    /// </summary>
    private static Gen<InsuranceStatus> RenewableStatusGen =>
        Gen.Elements(RenewableStatuses);

    /// <summary>
    /// Generates a random positive decimal value (for CoverAmount and Premium).
    /// </summary>
    private static Gen<decimal> PositiveDecimalGen =>
        Gen.Choose(100, 5000000).Select(v => (decimal)v / 100m);

    /// <summary>
    /// Generates a valid ISO 4217 currency code.
    /// </summary>
    private static Gen<string> CurrencyGen =>
        Gen.Elements("GBP", "USD", "EUR", "CHF", "AUD", "CAD");

    /// <summary>
    /// Generates an optional Guid (either null or a random Guid).
    /// </summary>
    private static Gen<Guid?> OptionalGuidGen =>
        Gen.OneOf(
            Gen.Constant<Guid?>(null),
            Gen.Fresh(() => (Guid?)Guid.NewGuid()));

    /// <summary>
    /// Generates a complete test scenario: existing record + renew command.
    /// </summary>
    private static Gen<RenewalTestScenario> ScenarioGen =>
        from policyNumber in PolicyNumberGen
        from insurer in InsurerGen
        from coverageType in CoverageTypeGen
        from status in RenewableStatusGen
        from coverAmount in PositiveDecimalGen
        from premium in PositiveDecimalGen
        from currency in CurrencyGen
        from opportunityId in OptionalGuidGen
        from legalCaseId in OptionalGuidGen
        from newCoverAmount in PositiveDecimalGen
        from newPremium in PositiveDecimalGen
        from newCurrency in CurrencyGen
        select new RenewalTestScenario
        {
            ExistingRecordId = Guid.NewGuid(),
            PolicyNumber = policyNumber,
            Insurer = insurer,
            CoverageType = coverageType,
            Status = status,
            CoverAmount = coverAmount,
            Premium = premium,
            Currency = currency,
            OpportunityId = opportunityId,
            LegalCaseId = legalCaseId,
            NewCoverAmount = newCoverAmount,
            NewPremium = newPremium,
            NewCurrency = newCurrency
        };

    #endregion

    #region Helper Types

    /// <summary>
    /// Encapsulates all data needed for a renewal test scenario.
    /// </summary>
    private sealed class RenewalTestScenario
    {
        public Guid ExistingRecordId { get; init; }
        public string PolicyNumber { get; init; } = string.Empty;
        public string Insurer { get; init; } = string.Empty;
        public CoverageType CoverageType { get; init; }
        public InsuranceStatus Status { get; init; }
        public decimal CoverAmount { get; init; }
        public decimal Premium { get; init; }
        public string Currency { get; init; } = string.Empty;
        public Guid? OpportunityId { get; init; }
        public Guid? LegalCaseId { get; init; }
        public decimal NewCoverAmount { get; init; }
        public decimal NewPremium { get; init; }
        public string NewCurrency { get; init; } = string.Empty;
    }

    #endregion

    #region Helper Methods

    /// <summary>
    /// Creates a RenewInsuranceRecordCommandHandler with mocked dependencies
    /// that simulates the given existing record.
    /// Captures the added entity for assertion.
    /// </summary>
    private static (RenewInsuranceRecordCommandHandler handler, Func<InsuranceRecord?> getCapturedRecord)
        CreateHandler(RenewalTestScenario scenario)
    {
        var existingRecord = new InsuranceRecord
        {
            Id = scenario.ExistingRecordId,
            PolicyNumber = scenario.PolicyNumber,
            Insurer = scenario.Insurer,
            CoverageType = scenario.CoverageType,
            CoverAmount = scenario.CoverAmount,
            Premium = scenario.Premium,
            Currency = scenario.Currency,
            StartDate = DateTime.UtcNow.AddYears(-1),
            ExpiryDate = DateTime.UtcNow.AddDays(-5),
            Status = scenario.Status,
            OpportunityId = scenario.OpportunityId,
            LegalCaseId = scenario.LegalCaseId,
            CreatedAt = DateTime.UtcNow.AddYears(-1),
            CreatedBy = "original-user"
        };

        InsuranceRecord? capturedRecord = null;

        var repositoryMock = new Mock<IRepository<InsuranceRecord>>();
        repositoryMock
            .Setup(r => r.GetByIdAsync(scenario.ExistingRecordId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(existingRecord);
        repositoryMock
            .Setup(r => r.AddAsync(It.IsAny<InsuranceRecord>(), It.IsAny<CancellationToken>()))
            .Callback<InsuranceRecord, CancellationToken>((record, _) => capturedRecord = record)
            .Returns(Task.CompletedTask);
        repositoryMock
            .Setup(r => r.Update(It.IsAny<InsuranceRecord>()));

        var unitOfWorkMock = new Mock<IUnitOfWork>();
        unitOfWorkMock
            .Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        var currentUserServiceMock = new Mock<ICurrentUserService>();
        currentUserServiceMock.Setup(c => c.UserId).Returns("test-renewal-user");
        currentUserServiceMock.Setup(c => c.UserName).Returns("Test Renewal User");

        var mapperMock = new Mock<IMapper>();
        mapperMock
            .Setup(m => m.Map<InsuranceRecordDto>(It.IsAny<InsuranceRecord>()))
            .Returns((InsuranceRecord entity) => new InsuranceRecordDto
            {
                Id = entity.Id,
                PolicyNumber = entity.PolicyNumber,
                Insurer = entity.Insurer,
                CoverageType = entity.CoverageType,
                CoverAmount = entity.CoverAmount,
                Premium = entity.Premium,
                Currency = entity.Currency,
                StartDate = entity.StartDate,
                ExpiryDate = entity.ExpiryDate,
                Status = entity.Status,
                PreviousPolicyId = entity.PreviousPolicyId,
                OpportunityId = entity.OpportunityId,
                LegalCaseId = entity.LegalCaseId,
                CreatedAt = entity.CreatedAt,
                CreatedBy = entity.CreatedBy
            });

        // Use real state machine to validate transition rules
        var stateMachine = new InsuranceStateMachine();

        var handler = new RenewInsuranceRecordCommandHandler(
            repositoryMock.Object,
            unitOfWorkMock.Object,
            currentUserServiceMock.Object,
            mapperMock.Object,
            stateMachine);

        return (handler, () => capturedRecord);
    }

    #endregion

    #region Property 14a: PreviousPolicyId links to old record

    /// <summary>
    /// Property 14a: When an insurance record is renewed, the NEW record's PreviousPolicyId
    /// SHALL equal the OLD record's Id, establishing a renewal chain.
    ///
    /// **Validates: Requirements 7.6**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property RenewedRecord_HasPreviousPolicyId_PointingToOldRecord()
    {
        return Prop.ForAll(ScenarioGen.ToArbitrary(), scenario =>
        {
            var (handler, getCapturedRecord) = CreateHandler(scenario);

            var command = new RenewInsuranceRecordCommand
            {
                Id = scenario.ExistingRecordId,
                NewCoverAmount = scenario.NewCoverAmount,
                NewPremium = scenario.NewPremium,
                Currency = scenario.NewCurrency,
                NewStartDate = DateTime.UtcNow,
                NewExpiryDate = DateTime.UtcNow.AddYears(1)
            };

            var result = handler.Handle(command, CancellationToken.None).GetAwaiter().GetResult();

            return (result.PreviousPolicyId == scenario.ExistingRecordId)
                .Label($"Expected PreviousPolicyId={scenario.ExistingRecordId}, got {result.PreviousPolicyId}");
        });
    }

    #endregion

    #region Property 14b: PolicyNumber carried forward

    /// <summary>
    /// Property 14b: When an insurance record is renewed, the NEW record SHALL carry forward
    /// the PolicyNumber from the original record.
    ///
    /// **Validates: Requirements 7.6**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property RenewedRecord_CarriesForward_PolicyNumber()
    {
        return Prop.ForAll(ScenarioGen.ToArbitrary(), scenario =>
        {
            var (handler, _) = CreateHandler(scenario);

            var command = new RenewInsuranceRecordCommand
            {
                Id = scenario.ExistingRecordId,
                NewCoverAmount = scenario.NewCoverAmount,
                NewPremium = scenario.NewPremium,
                Currency = scenario.NewCurrency,
                NewStartDate = DateTime.UtcNow,
                NewExpiryDate = DateTime.UtcNow.AddYears(1)
            };

            var result = handler.Handle(command, CancellationToken.None).GetAwaiter().GetResult();

            return (result.PolicyNumber == scenario.PolicyNumber)
                .Label($"Expected PolicyNumber='{scenario.PolicyNumber}', got '{result.PolicyNumber}'");
        });
    }

    #endregion

    #region Property 14c: Insurer carried forward

    /// <summary>
    /// Property 14c: When an insurance record is renewed, the NEW record SHALL carry forward
    /// the Insurer from the original record.
    ///
    /// **Validates: Requirements 7.6**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property RenewedRecord_CarriesForward_Insurer()
    {
        return Prop.ForAll(ScenarioGen.ToArbitrary(), scenario =>
        {
            var (handler, _) = CreateHandler(scenario);

            var command = new RenewInsuranceRecordCommand
            {
                Id = scenario.ExistingRecordId,
                NewCoverAmount = scenario.NewCoverAmount,
                NewPremium = scenario.NewPremium,
                Currency = scenario.NewCurrency,
                NewStartDate = DateTime.UtcNow,
                NewExpiryDate = DateTime.UtcNow.AddYears(1)
            };

            var result = handler.Handle(command, CancellationToken.None).GetAwaiter().GetResult();

            return (result.Insurer == scenario.Insurer)
                .Label($"Expected Insurer='{scenario.Insurer}', got '{result.Insurer}'");
        });
    }

    #endregion

    #region Property 14d: CoverageType carried forward

    /// <summary>
    /// Property 14d: When an insurance record is renewed, the NEW record SHALL carry forward
    /// the CoverageType from the original record.
    ///
    /// **Validates: Requirements 7.6**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property RenewedRecord_CarriesForward_CoverageType()
    {
        return Prop.ForAll(ScenarioGen.ToArbitrary(), scenario =>
        {
            var (handler, _) = CreateHandler(scenario);

            var command = new RenewInsuranceRecordCommand
            {
                Id = scenario.ExistingRecordId,
                NewCoverAmount = scenario.NewCoverAmount,
                NewPremium = scenario.NewPremium,
                Currency = scenario.NewCurrency,
                NewStartDate = DateTime.UtcNow,
                NewExpiryDate = DateTime.UtcNow.AddYears(1)
            };

            var result = handler.Handle(command, CancellationToken.None).GetAwaiter().GetResult();

            return (result.CoverageType == scenario.CoverageType)
                .Label($"Expected CoverageType={scenario.CoverageType}, got {result.CoverageType}");
        });
    }

    #endregion

    #region Property 14e: OpportunityId carried forward

    /// <summary>
    /// Property 14e: When an insurance record is renewed, the NEW record SHALL carry forward
    /// the OpportunityId from the original record (may be null).
    ///
    /// **Validates: Requirements 7.6**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property RenewedRecord_CarriesForward_OpportunityId()
    {
        return Prop.ForAll(ScenarioGen.ToArbitrary(), scenario =>
        {
            var (handler, _) = CreateHandler(scenario);

            var command = new RenewInsuranceRecordCommand
            {
                Id = scenario.ExistingRecordId,
                NewCoverAmount = scenario.NewCoverAmount,
                NewPremium = scenario.NewPremium,
                Currency = scenario.NewCurrency,
                NewStartDate = DateTime.UtcNow,
                NewExpiryDate = DateTime.UtcNow.AddYears(1)
            };

            var result = handler.Handle(command, CancellationToken.None).GetAwaiter().GetResult();

            return (result.OpportunityId == scenario.OpportunityId)
                .Label($"Expected OpportunityId={scenario.OpportunityId}, got {result.OpportunityId}");
        });
    }

    #endregion

    #region Property 14f: LegalCaseId carried forward

    /// <summary>
    /// Property 14f: When an insurance record is renewed, the NEW record SHALL carry forward
    /// the LegalCaseId from the original record (may be null).
    ///
    /// **Validates: Requirements 7.6**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property RenewedRecord_CarriesForward_LegalCaseId()
    {
        return Prop.ForAll(ScenarioGen.ToArbitrary(), scenario =>
        {
            var (handler, _) = CreateHandler(scenario);

            var command = new RenewInsuranceRecordCommand
            {
                Id = scenario.ExistingRecordId,
                NewCoverAmount = scenario.NewCoverAmount,
                NewPremium = scenario.NewPremium,
                Currency = scenario.NewCurrency,
                NewStartDate = DateTime.UtcNow,
                NewExpiryDate = DateTime.UtcNow.AddYears(1)
            };

            var result = handler.Handle(command, CancellationToken.None).GetAwaiter().GetResult();

            return (result.LegalCaseId == scenario.LegalCaseId)
                .Label($"Expected LegalCaseId={scenario.LegalCaseId}, got {result.LegalCaseId}");
        });
    }

    #endregion

    #region Property 14g: Renewed record status is Active

    /// <summary>
    /// Property 14g: When an insurance record is renewed, the NEW record SHALL have
    /// Status set to Active regardless of the original record's status.
    ///
    /// **Validates: Requirements 7.6**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property RenewedRecord_HasStatus_Active()
    {
        return Prop.ForAll(ScenarioGen.ToArbitrary(), scenario =>
        {
            var (handler, _) = CreateHandler(scenario);

            var command = new RenewInsuranceRecordCommand
            {
                Id = scenario.ExistingRecordId,
                NewCoverAmount = scenario.NewCoverAmount,
                NewPremium = scenario.NewPremium,
                Currency = scenario.NewCurrency,
                NewStartDate = DateTime.UtcNow,
                NewExpiryDate = DateTime.UtcNow.AddYears(1)
            };

            var result = handler.Handle(command, CancellationToken.None).GetAwaiter().GetResult();

            return (result.Status == InsuranceStatus.Active)
                .Label($"Expected Status=Active, got {result.Status}");
        });
    }

    #endregion
}
