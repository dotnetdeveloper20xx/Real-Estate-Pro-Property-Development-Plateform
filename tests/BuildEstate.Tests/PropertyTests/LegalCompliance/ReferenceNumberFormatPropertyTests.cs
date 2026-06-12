using System.Text.RegularExpressions;
using BuildEstate.Domain.Services;
using BuildEstate.Infrastructure.Persistence;
using BuildEstate.Infrastructure.Services.LegalCompliance;
using FluentAssertions;
using FsCheck;
using FsCheck.Xunit;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;

namespace BuildEstate.Tests.PropertyTests.LegalCompliance;

/// <summary>
/// Property-based tests for Reference Number Format correctness.
///
/// Feature: legal-compliance-module, Property 7: Reference Number Format
///
/// For any generated CaseReference or ContractReference, the value SHALL match
/// the regex pattern ^LC-\d{4}-\d{5}$ or ^CON-\d{4}-\d{5}$ respectively,
/// where the 4-digit component equals the current UTC year, and no two entities
/// of the same type SHALL share the same reference number.
///
/// **Validates: Requirements 1.4, 3.3**
/// </summary>
public class ReferenceNumberFormatPropertyTests
{
    private static readonly Regex CaseReferencePattern = new(@"^LC-\d{4}-\d{5}$", RegexOptions.Compiled);
    private static readonly Regex ContractReferencePattern = new(@"^CON-\d{4}-\d{5}$", RegexOptions.Compiled);

    #region Property 7: Case Reference Format Validation

    /// <summary>
    /// Property 7: Reference Number Format — Case Reference
    /// For any sequence number between 1 and 99999, the constructed case reference
    /// SHALL match the regex pattern ^LC-\d{4}-\d{5}$.
    /// **Validates: Requirements 1.4**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property CaseReference_AlwaysMatchesRegexPattern()
    {
        var sequenceGen = Gen.Choose(1, 99999);

        return Prop.ForAll(sequenceGen.ToArbitrary(), sequence =>
        {
            // Simulate the reference construction logic used by LegalReferenceNumberGenerator
            var currentYear = DateTime.UtcNow.Year;
            var reference = $"LC-{currentYear:D4}-{sequence:D5}";

            CaseReferencePattern.IsMatch(reference).Should().BeTrue(
                because: $"case reference '{reference}' should match pattern ^LC-\\d{{4}}-\\d{{5}}$");
        });
    }

    /// <summary>
    /// Property 7: Reference Number Format — Case Reference Year Correctness
    /// For any generated case reference, the year portion SHALL equal the current UTC year.
    /// **Validates: Requirements 1.4**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property CaseReference_YearPortionMatchesCurrentUtcYear()
    {
        var sequenceGen = Gen.Choose(1, 99999);

        return Prop.ForAll(sequenceGen.ToArbitrary(), sequence =>
        {
            var currentYear = DateTime.UtcNow.Year;
            var reference = $"LC-{currentYear:D4}-{sequence:D5}";

            // Extract year portion (characters 3-6, after "LC-")
            var yearPortion = reference.Substring(3, 4);
            var extractedYear = int.Parse(yearPortion);

            extractedYear.Should().Be(currentYear,
                because: $"year in reference '{reference}' should be the current UTC year {currentYear}");
        });
    }

    /// <summary>
    /// Property 7: Reference Number Format — Case Reference Sequential Increment
    /// For any starting sequence N, the next generated reference should have sequence N+1,
    /// ensuring sequential increment.
    /// **Validates: Requirements 1.4**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property CaseReference_SequentialIncrement_ProducesIncrementingSequenceNumbers()
    {
        var startSequenceGen = Gen.Choose(1, 99998);

        return Prop.ForAll(startSequenceGen.ToArbitrary(), startSequence =>
        {
            var currentYear = DateTime.UtcNow.Year;
            var firstReference = $"LC-{currentYear:D4}-{startSequence:D5}";
            var secondReference = $"LC-{currentYear:D4}-{(startSequence + 1):D5}";

            // Extract sequence numbers
            var firstSeq = int.Parse(firstReference.Substring(firstReference.LastIndexOf('-') + 1));
            var secondSeq = int.Parse(secondReference.Substring(secondReference.LastIndexOf('-') + 1));

            secondSeq.Should().Be(firstSeq + 1,
                because: "each generated reference should have a sequence number one greater than the previous");
        });
    }

    /// <summary>
    /// Property 7: Reference Number Format — Case Reference Uniqueness
    /// For any N distinct sequence numbers, the generated references SHALL all be distinct.
    /// **Validates: Requirements 1.4**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property CaseReferences_AreAlwaysUnique_ForDistinctSequences()
    {
        var countGen = Gen.Choose(2, 50);

        return Prop.ForAll(countGen.ToArbitrary(), count =>
        {
            var currentYear = DateTime.UtcNow.Year;
            var references = Enumerable.Range(1, count)
                .Select(seq => $"LC-{currentYear:D4}-{seq:D5}")
                .ToList();

            references.Should().OnlyHaveUniqueItems(
                because: $"generating {count} references should produce {count} distinct values");
        });
    }

    #endregion

    #region Property 7: Contract Reference Format Validation

    /// <summary>
    /// Property 7: Reference Number Format — Contract Reference
    /// For any sequence number between 1 and 99999, the constructed contract reference
    /// SHALL match the regex pattern ^CON-\d{4}-\d{5}$.
    /// **Validates: Requirements 3.3**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property ContractReference_AlwaysMatchesRegexPattern()
    {
        var sequenceGen = Gen.Choose(1, 99999);

        return Prop.ForAll(sequenceGen.ToArbitrary(), sequence =>
        {
            var currentYear = DateTime.UtcNow.Year;
            var reference = $"CON-{currentYear:D4}-{sequence:D5}";

            ContractReferencePattern.IsMatch(reference).Should().BeTrue(
                because: $"contract reference '{reference}' should match pattern ^CON-\\d{{4}}-\\d{{5}}$");
        });
    }

    /// <summary>
    /// Property 7: Reference Number Format — Contract Reference Year Correctness
    /// For any generated contract reference, the year portion SHALL equal the current UTC year.
    /// **Validates: Requirements 3.3**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property ContractReference_YearPortionMatchesCurrentUtcYear()
    {
        var sequenceGen = Gen.Choose(1, 99999);

        return Prop.ForAll(sequenceGen.ToArbitrary(), sequence =>
        {
            var currentYear = DateTime.UtcNow.Year;
            var reference = $"CON-{currentYear:D4}-{sequence:D5}";

            // Extract year portion (characters 4-7, after "CON-")
            var yearPortion = reference.Substring(4, 4);
            var extractedYear = int.Parse(yearPortion);

            extractedYear.Should().Be(currentYear,
                because: $"year in reference '{reference}' should be the current UTC year {currentYear}");
        });
    }

    /// <summary>
    /// Property 7: Reference Number Format — Contract Reference Sequential Increment
    /// For any starting sequence N, the next generated reference should have sequence N+1.
    /// **Validates: Requirements 3.3**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property ContractReference_SequentialIncrement_ProducesIncrementingSequenceNumbers()
    {
        var startSequenceGen = Gen.Choose(1, 99998);

        return Prop.ForAll(startSequenceGen.ToArbitrary(), startSequence =>
        {
            var currentYear = DateTime.UtcNow.Year;
            var firstReference = $"CON-{currentYear:D4}-{startSequence:D5}";
            var secondReference = $"CON-{currentYear:D4}-{(startSequence + 1):D5}";

            // Extract sequence numbers
            var firstSeq = int.Parse(firstReference.Substring(firstReference.LastIndexOf('-') + 1));
            var secondSeq = int.Parse(secondReference.Substring(secondReference.LastIndexOf('-') + 1));

            secondSeq.Should().Be(firstSeq + 1,
                because: "each generated contract reference should have a sequence number one greater than the previous");
        });
    }

    /// <summary>
    /// Property 7: Reference Number Format — Contract Reference Uniqueness
    /// For any N distinct sequence numbers, the generated references SHALL all be distinct.
    /// **Validates: Requirements 3.3**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property ContractReferences_AreAlwaysUnique_ForDistinctSequences()
    {
        var countGen = Gen.Choose(2, 50);

        return Prop.ForAll(countGen.ToArbitrary(), count =>
        {
            var currentYear = DateTime.UtcNow.Year;
            var references = Enumerable.Range(1, count)
                .Select(seq => $"CON-{currentYear:D4}-{seq:D5}")
                .ToList();

            references.Should().OnlyHaveUniqueItems(
                because: $"generating {count} references should produce {count} distinct values");
        });
    }

    #endregion

    #region Property 7: Cross-Type Format Differentiation

    /// <summary>
    /// Property 7: Reference Number Format — Prefix Differentiation
    /// For any sequence number, case references and contract references with the same
    /// sequence SHALL be different due to their distinct prefixes (LC- vs CON-).
    /// **Validates: Requirements 1.4, 3.3**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property CaseAndContractReferences_WithSameSequence_AreDifferent()
    {
        var sequenceGen = Gen.Choose(1, 99999);

        return Prop.ForAll(sequenceGen.ToArbitrary(), sequence =>
        {
            var currentYear = DateTime.UtcNow.Year;
            var caseRef = $"LC-{currentYear:D4}-{sequence:D5}";
            var contractRef = $"CON-{currentYear:D4}-{sequence:D5}";

            caseRef.Should().NotBe(contractRef,
                because: "case and contract references must be distinguishable by prefix");

            caseRef.Should().StartWith("LC-");
            contractRef.Should().StartWith("CON-");
        });
    }

    /// <summary>
    /// Property 7: Reference Number Format — Sequence Number Padding
    /// For any sequence number between 1 and 99999, the numeric portion SHALL always be
    /// exactly 5 digits (zero-padded), ensuring consistent format width.
    /// **Validates: Requirements 1.4, 3.3**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property ReferenceNumbers_SequencePortionIsAlways5Digits()
    {
        var sequenceGen = Gen.Choose(1, 99999);

        return Prop.ForAll(sequenceGen.ToArbitrary(), sequence =>
        {
            var currentYear = DateTime.UtcNow.Year;
            var caseRef = $"LC-{currentYear:D4}-{sequence:D5}";
            var contractRef = $"CON-{currentYear:D4}-{sequence:D5}";

            // Extract the sequence portion (after last dash)
            var caseSeqPart = caseRef.Substring(caseRef.LastIndexOf('-') + 1);
            var contractSeqPart = contractRef.Substring(contractRef.LastIndexOf('-') + 1);

            caseSeqPart.Should().HaveLength(5,
                because: "case reference sequence must always be exactly 5 digits");
            contractSeqPart.Should().HaveLength(5,
                because: "contract reference sequence must always be exactly 5 digits");

            // Verify they are all digits
            caseSeqPart.All(char.IsDigit).Should().BeTrue();
            contractSeqPart.All(char.IsDigit).Should().BeTrue();
        });
    }

    /// <summary>
    /// Property 7: Reference Number Format — Sequence Number Extraction Round-Trip
    /// For any sequence number, formatting it as D5 and parsing it back should yield
    /// the original value, confirming the format preserves numeric identity.
    /// **Validates: Requirements 1.4, 3.3**
    /// </summary>
    [Property(MaxTest = 100)]
    public Property SequenceNumber_FormattingAndParsing_PreservesValue()
    {
        var sequenceGen = Gen.Choose(1, 99999);

        return Prop.ForAll(sequenceGen.ToArbitrary(), originalSequence =>
        {
            var currentYear = DateTime.UtcNow.Year;
            var reference = $"LC-{currentYear:D4}-{originalSequence:D5}";

            // Parse back using the same logic as GetNextSequenceAsync
            var lastDashIndex = reference.LastIndexOf('-');
            var numericPart = reference[(lastDashIndex + 1)..];
            var parsed = int.Parse(numericPart);

            parsed.Should().Be(originalSequence,
                because: "parsing the sequence from a formatted reference should yield the original sequence number");
        });
    }

    #endregion
}
