using BuildEstate.Application.Features.LegalCompliance.LegalCases.Commands.TransitionLegalCaseStatus;
using BuildEstate.Domain.Enums;
using FluentAssertions;
using FluentValidation.TestHelper;
using FsCheck;
using FsCheck.Xunit;

namespace BuildEstate.Tests.PropertyTests.LegalCompliance;

/// <summary>
/// Property-based tests for <see cref="TransitionLegalCaseStatusCommandValidator"/>.
/// Validates conditional field requirements for status transitions:
/// - Resolved: requires ResolutionSummary (≥20 chars) and ResolutionDate
/// - Escalated: requires EscalationReason (≥10 chars)
/// - OnHold: requires HoldReason (≥10 chars)
///
/// **Validates: Requirements 2.4, 2.5, 2.6, 2.7**
/// </summary>
public class ConditionalTransitionValidationPropertyTests
{
    private readonly TransitionLegalCaseStatusCommandValidator _validator = new();

    #region Generators

    /// <summary>
    /// Generates a random string of a specific length using printable characters.
    /// </summary>
    private static Gen<string> GenStringOfLength(int length)
    {
        if (length <= 0)
            return Gen.Constant(string.Empty);

        return Gen.ArrayOf(length, Gen.Elements(
            'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j',
            'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't',
            'u', 'v', 'w', 'x', 'y', 'z', ' '))
            .Select(chars => new string(chars));
    }

    /// <summary>
    /// Generates strings with length strictly less than the minimum required.
    /// </summary>
    private static Gen<string?> GenTooShortString(int minLength)
    {
        return Gen.OneOf(
            Gen.Constant<string?>(null),
            Gen.Constant<string?>(string.Empty),
            Gen.Choose(1, minLength - 1).SelectMany(len => GenStringOfLength(len).Select<string, string?>(s => s))
        );
    }

    /// <summary>
    /// Generates strings with length at or above the minimum required.
    /// </summary>
    private static Gen<string> GenValidString(int minLength)
    {
        return Gen.Choose(minLength, minLength + 50)
            .SelectMany(len => GenStringOfLength(len));
    }

    #endregion

    #region Property 9a: Resolved — Missing Required Fields Should Be Rejected

    /// <summary>
    /// Property 9a: When NewStatus=Resolved, commands WITHOUT a valid ResolutionSummary (≥20 chars)
    /// should be REJECTED by the validator.
    ///
    /// **Validates: Requirements 2.4**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property Resolved_WithoutValidResolutionSummary_IsRejected()
    {
        var gen = GenTooShortString(20).Select(summary =>
            new TransitionLegalCaseStatusCommand
            {
                Id = Guid.NewGuid(),
                NewStatus = LegalCaseStatus.Resolved,
                ResolutionSummary = summary,
                ResolutionDate = DateTime.UtcNow.AddDays(-1)
            });

        return Prop.ForAll(
            gen.ToArbitrary(),
            command =>
            {
                var result = _validator.TestValidate(command);
                result.ShouldHaveValidationErrorFor(x => x.ResolutionSummary);
                return true;
            });
    }

    /// <summary>
    /// Property 9a (continued): When NewStatus=Resolved, commands WITHOUT a ResolutionDate
    /// should be REJECTED by the validator.
    ///
    /// **Validates: Requirements 2.4**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property Resolved_WithoutResolutionDate_IsRejected()
    {
        var gen = GenValidString(20).Select(summary =>
            new TransitionLegalCaseStatusCommand
            {
                Id = Guid.NewGuid(),
                NewStatus = LegalCaseStatus.Resolved,
                ResolutionSummary = summary,
                ResolutionDate = null
            });

        return Prop.ForAll(
            gen.ToArbitrary(),
            command =>
            {
                var result = _validator.TestValidate(command);
                result.ShouldHaveValidationErrorFor(x => x.ResolutionDate);
                return true;
            });
    }

    #endregion

    #region Property 9b: Escalated — Missing Required Fields Should Be Rejected

    /// <summary>
    /// Property 9b: When NewStatus=Escalated, commands WITHOUT a valid EscalationReason (≥10 chars)
    /// should be REJECTED by the validator.
    ///
    /// **Validates: Requirements 2.6**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property Escalated_WithoutValidEscalationReason_IsRejected()
    {
        var gen = GenTooShortString(10).Select(reason =>
            new TransitionLegalCaseStatusCommand
            {
                Id = Guid.NewGuid(),
                NewStatus = LegalCaseStatus.Escalated,
                EscalationReason = reason
            });

        return Prop.ForAll(
            gen.ToArbitrary(),
            command =>
            {
                var result = _validator.TestValidate(command);
                result.ShouldHaveValidationErrorFor(x => x.EscalationReason);
                return true;
            });
    }

    #endregion

    #region Property 9c: OnHold — Missing Required Fields Should Be Rejected

    /// <summary>
    /// Property 9c: When NewStatus=OnHold, commands WITHOUT a valid HoldReason (≥10 chars)
    /// should be REJECTED by the validator.
    ///
    /// **Validates: Requirements 2.7**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property OnHold_WithoutValidHoldReason_IsRejected()
    {
        var gen = GenTooShortString(10).Select(reason =>
            new TransitionLegalCaseStatusCommand
            {
                Id = Guid.NewGuid(),
                NewStatus = LegalCaseStatus.OnHold,
                HoldReason = reason
            });

        return Prop.ForAll(
            gen.ToArbitrary(),
            command =>
            {
                var result = _validator.TestValidate(command);
                result.ShouldHaveValidationErrorFor(x => x.HoldReason);
                return true;
            });
    }

    #endregion

    #region Property 9d: Valid Commands Are Accepted

    /// <summary>
    /// Property 9d: When NewStatus=Resolved and command has all required fields with valid values,
    /// the validator should ACCEPT the command (no validation errors for conditional fields).
    ///
    /// **Validates: Requirements 2.4**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property Resolved_WithAllRequiredFields_IsAccepted()
    {
        var gen = GenValidString(20).Select(summary =>
            new TransitionLegalCaseStatusCommand
            {
                Id = Guid.NewGuid(),
                NewStatus = LegalCaseStatus.Resolved,
                ResolutionSummary = summary,
                ResolutionDate = DateTime.UtcNow.AddDays(-1)
            });

        return Prop.ForAll(
            gen.ToArbitrary(),
            command =>
            {
                var result = _validator.TestValidate(command);
                result.ShouldNotHaveValidationErrorFor(x => x.ResolutionSummary);
                result.ShouldNotHaveValidationErrorFor(x => x.ResolutionDate);
                return true;
            });
    }

    /// <summary>
    /// Property 9d (continued): When NewStatus=Escalated and EscalationReason has ≥10 chars,
    /// the validator should ACCEPT the command.
    ///
    /// **Validates: Requirements 2.6**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property Escalated_WithValidEscalationReason_IsAccepted()
    {
        var gen = GenValidString(10).Select(reason =>
            new TransitionLegalCaseStatusCommand
            {
                Id = Guid.NewGuid(),
                NewStatus = LegalCaseStatus.Escalated,
                EscalationReason = reason
            });

        return Prop.ForAll(
            gen.ToArbitrary(),
            command =>
            {
                var result = _validator.TestValidate(command);
                result.ShouldNotHaveValidationErrorFor(x => x.EscalationReason);
                return true;
            });
    }

    /// <summary>
    /// Property 9d (continued): When NewStatus=OnHold and HoldReason has ≥10 chars,
    /// the validator should ACCEPT the command.
    ///
    /// **Validates: Requirements 2.7**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property OnHold_WithValidHoldReason_IsAccepted()
    {
        var gen = GenValidString(10).Select(reason =>
            new TransitionLegalCaseStatusCommand
            {
                Id = Guid.NewGuid(),
                NewStatus = LegalCaseStatus.OnHold,
                HoldReason = reason
            });

        return Prop.ForAll(
            gen.ToArbitrary(),
            command =>
            {
                var result = _validator.TestValidate(command);
                result.ShouldNotHaveValidationErrorFor(x => x.HoldReason);
                return true;
            });
    }

    #endregion
}
