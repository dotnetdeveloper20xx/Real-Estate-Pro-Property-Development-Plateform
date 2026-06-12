using AutoMapper;
using BuildEstate.Application.Features.LegalCompliance.Contracts.Commands.TransitionContractStatus;
using BuildEstate.Application.Features.LegalCompliance.Contracts.DTOs;
using BuildEstate.Application.Interfaces;
using BuildEstate.Application.Settings;
using BuildEstate.Domain.Common;
using BuildEstate.Domain.Entities.LegalCompliance;
using BuildEstate.Domain.Enums;
using BuildEstate.Domain.Exceptions;
using BuildEstate.Domain.Services;
using BuildEstate.Tests.Helpers;
using FluentAssertions;
using FsCheck;
using FsCheck.Xunit;
using MediatR;
using Microsoft.Extensions.Options;
using Moq;

namespace BuildEstate.Tests.PropertyTests.LegalCompliance;

/// <summary>
/// Property-based tests for Contract Threshold Approval Rule.
///
/// Property 21: Contract Threshold Approval Rule
/// Generate random ContractValues around the threshold (default 50,000) and verify
/// approval requirement enforcement. For contracts with ContractValue > threshold,
/// transitioning Draft→UnderReview should require Finance_Director role. For contracts
/// ≤ threshold, no additional role check is enforced.
///
/// **Validates: Requirements 3.5**
/// </summary>
public class ContractThresholdApprovalPropertyTests
{
    private const decimal DefaultThreshold = 50_000m;
    private const string FinanceDirectorRole = "Finance_Director";

    #region Generators

    /// <summary>
    /// Generates contract values strictly above the threshold (50,000.01 to 10,000,000).
    /// </summary>
    private static Gen<decimal> AboveThresholdValueGen =>
        Gen.Choose(5000001, 1000000000)
            .Select(cents => cents / 100m);

    /// <summary>
    /// Generates contract values at or below the threshold (0.01 to 50,000.00).
    /// </summary>
    private static Gen<decimal> AtOrBelowThresholdValueGen =>
        Gen.Choose(1, 5000000)
            .Select(cents => cents / 100m);

    /// <summary>
    /// Generates contract values very close to the threshold boundary for edge testing.
    /// Values from 49,990 to 50,010.
    /// </summary>
    private static Gen<decimal> NearThresholdValueGen =>
        Gen.Choose(4999000, 5001000)
            .Select(cents => cents / 100m);

    #endregion

    #region Helper Methods

    /// <summary>
    /// Creates a Contract entity in Draft status with the given ContractValue.
    /// </summary>
    private static Contract CreateDraftContract(decimal contractValue)
    {
        return new Contract
        {
            Id = Guid.NewGuid(),
            ContractReference = $"CON-{DateTime.UtcNow.Year:D4}-00001",
            Title = "Test Contract",
            ContractType = LegalContractType.Construction,
            Status = LegalContractStatus.Draft,
            CounterpartyName = "Test Counterparty",
            ContractValue = contractValue,
            Currency = "GBP",
            StartDate = DateTime.UtcNow,
            EndDate = DateTime.UtcNow.AddYears(1),
            LegalCaseId = Guid.NewGuid(),
            LegalCase = new LegalCase
            {
                Id = Guid.NewGuid(),
                CaseReference = "LC-2024-00001",
                Title = "Test Case",
                Status = LegalCaseStatus.InProgress
            },
            CreatedAt = DateTime.UtcNow,
            CreatedBy = "system"
        };
    }

    /// <summary>
    /// Creates the TransitionContractStatusCommandHandler with mocked dependencies.
    /// </summary>
    private static TransitionContractStatusCommandHandler CreateHandler(
        Contract contract,
        bool isFinanceDirector)
    {
        var contracts = new List<Contract> { contract };
        var mockQueryable = contracts.AsAsyncQueryable();

        var repositoryMock = new Mock<IRepository<Contract>>();
        repositoryMock
            .Setup(r => r.Query())
            .Returns(mockQueryable);

        var unitOfWorkMock = new Mock<IUnitOfWork>();
        unitOfWorkMock
            .Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        var currentUserServiceMock = new Mock<ICurrentUserService>();
        currentUserServiceMock.Setup(c => c.UserId).Returns("test-user-id");
        currentUserServiceMock.Setup(c => c.UserName).Returns("Test User");
        currentUserServiceMock
            .Setup(c => c.IsInRole(FinanceDirectorRole))
            .Returns(isFinanceDirector);

        var stateMachineMock = new Mock<ILegalContractStateMachine>();
        stateMachineMock
            .Setup(sm => sm.ValidateTransition(LegalContractStatus.Draft, LegalContractStatus.UnderReview));

        var publisherMock = new Mock<IPublisher>();

        var mapperMock = new Mock<IMapper>();
        mapperMock
            .Setup(m => m.Map<ContractDto>(It.IsAny<Contract>()))
            .Returns((Contract c) => new ContractDto
            {
                Id = c.Id,
                ContractReference = c.ContractReference,
                Title = c.Title,
                ContractType = c.ContractType.ToString(),
                Status = c.Status.ToString(),
                CounterpartyName = c.CounterpartyName,
                ContractValue = c.ContractValue,
                Currency = c.Currency,
                StartDate = c.StartDate,
                EndDate = c.EndDate,
                LegalCaseId = c.LegalCaseId,
                CreatedAt = c.CreatedAt,
                CreatedBy = c.CreatedBy
            });

        var settings = Options.Create(new LegalComplianceSettings
        {
            HighValueContractThreshold = DefaultThreshold
        });

        return new TransitionContractStatusCommandHandler(
            repositoryMock.Object,
            unitOfWorkMock.Object,
            currentUserServiceMock.Object,
            mapperMock.Object,
            stateMachineMock.Object,
            publisherMock.Object,
            settings);
    }

    #endregion

    #region Property 21a: High-value contracts without Finance_Director role are rejected

    /// <summary>
    /// Property 21a: For any Contract with ContractValue > threshold (50,000),
    /// transitioning Draft→UnderReview WITHOUT the Finance_Director role SHALL throw
    /// BusinessRuleViolationException.
    ///
    /// **Validates: Requirements 3.5**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property HighValueContract_WithoutFinanceDirectorRole_IsRejected()
    {
        return Prop.ForAll(AboveThresholdValueGen.ToArbitrary(), contractValue =>
        {
            var contract = CreateDraftContract(contractValue);
            var handler = CreateHandler(contract, isFinanceDirector: false);

            var command = new TransitionContractStatusCommand
            {
                Id = contract.Id,
                NewStatus = LegalContractStatus.UnderReview
            };

            var act = () => handler.Handle(command, CancellationToken.None).GetAwaiter().GetResult();

            act.Should().Throw<BusinessRuleViolationException>()
                .Where(ex => ex.RuleName == "HighValueContractApproval");

            return true;
        });
    }

    #endregion

    #region Property 21b: High-value contracts with Finance_Director role succeed

    /// <summary>
    /// Property 21b: For any Contract with ContractValue > threshold (50,000),
    /// transitioning Draft→UnderReview WITH the Finance_Director role SHALL succeed
    /// without throwing any exception.
    ///
    /// **Validates: Requirements 3.5**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property HighValueContract_WithFinanceDirectorRole_Succeeds()
    {
        return Prop.ForAll(AboveThresholdValueGen.ToArbitrary(), contractValue =>
        {
            var contract = CreateDraftContract(contractValue);
            var handler = CreateHandler(contract, isFinanceDirector: true);

            var command = new TransitionContractStatusCommand
            {
                Id = contract.Id,
                NewStatus = LegalContractStatus.UnderReview
            };

            var result = handler.Handle(command, CancellationToken.None).GetAwaiter().GetResult();

            return (result is not null && result.Status == LegalContractStatus.UnderReview.ToString())
                .Label($"Expected successful transition for value {contractValue} with Finance_Director role");
        });
    }

    #endregion

    #region Property 21c: At-or-below threshold contracts do not require Finance_Director

    /// <summary>
    /// Property 21c: For any Contract with ContractValue ≤ threshold (50,000),
    /// transitioning Draft→UnderReview SHALL succeed regardless of role (no
    /// Finance_Director requirement).
    ///
    /// **Validates: Requirements 3.5**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property AtOrBelowThresholdContract_WithoutFinanceDirectorRole_Succeeds()
    {
        return Prop.ForAll(AtOrBelowThresholdValueGen.ToArbitrary(), contractValue =>
        {
            var contract = CreateDraftContract(contractValue);
            var handler = CreateHandler(contract, isFinanceDirector: false);

            var command = new TransitionContractStatusCommand
            {
                Id = contract.Id,
                NewStatus = LegalContractStatus.UnderReview
            };

            var result = handler.Handle(command, CancellationToken.None).GetAwaiter().GetResult();

            return (result is not null && result.Status == LegalContractStatus.UnderReview.ToString())
                .Label($"Expected successful transition for value {contractValue} without Finance_Director role");
        });
    }

    #endregion

    #region Property 21d: Boundary values — exactly at threshold succeeds without role

    /// <summary>
    /// Property 21d: For contracts with ContractValue near the threshold boundary,
    /// those exactly at the threshold (50,000) SHALL succeed without Finance_Director,
    /// and those just above (50,000.01+) SHALL be rejected without Finance_Director.
    ///
    /// **Validates: Requirements 3.5**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property NearThreshold_EnforcementIsStrictlyGreaterThan()
    {
        return Prop.ForAll(NearThresholdValueGen.ToArbitrary(), contractValue =>
        {
            var contract = CreateDraftContract(contractValue);
            var handler = CreateHandler(contract, isFinanceDirector: false);

            var command = new TransitionContractStatusCommand
            {
                Id = contract.Id,
                NewStatus = LegalContractStatus.UnderReview
            };

            if (contractValue > DefaultThreshold)
            {
                // Should be rejected
                var act = () => handler.Handle(command, CancellationToken.None).GetAwaiter().GetResult();
                try
                {
                    act();
                    return false.Label($"Expected rejection for value {contractValue} > threshold {DefaultThreshold}");
                }
                catch (BusinessRuleViolationException ex)
                {
                    return (ex.RuleName == "HighValueContractApproval")
                        .Label($"Exception thrown with rule '{ex.RuleName}' for value {contractValue}");
                }
            }
            else
            {
                // Should succeed
                var result = handler.Handle(command, CancellationToken.None).GetAwaiter().GetResult();
                return (result is not null)
                    .Label($"Expected success for value {contractValue} ≤ threshold {DefaultThreshold}");
            }
        });
    }

    #endregion
}
