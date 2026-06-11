using BuildEstate.Application.Features.LandAcquisition.Acquisitions.Commands.CreateAcquisition;
using BuildEstate.Application.Features.LandAcquisition.Offers.Commands.CreateOffer;
using BuildEstate.Application.Features.LandAcquisition.Opportunities.Commands.CreateOpportunity;
using FluentAssertions;
using FluentValidation.TestHelper;
using FsCheck;
using FsCheck.Xunit;

namespace BuildEstate.Tests.PropertyTests;

/// <summary>
/// Property-based tests for input validation correctness across Land Acquisition validators.
/// Generates random inputs crossing constraint boundaries and verifies validators accept/reject correctly.
///
/// **Validates: Requirements 1.2, 3.4, 4.2, 6.2, 7.2, 8.3, 9.3, 10.2**
/// </summary>
public class InputValidationPropertyTests
{
    private readonly CreateOpportunityCommandValidator _opportunityValidator = new();
    private readonly CreateOfferCommandValidator _offerValidator = new();
    private readonly CreateAcquisitionCommandValidator _acquisitionValidator = new();

    #region Helpers

    /// <summary>
    /// Generates a random string of a specific length using alphanumeric characters.
    /// </summary>
    private static Gen<string> GenStringOfLength(int length)
    {
        if (length <= 0) return Gen.Constant(string.Empty);

        return Gen.ArrayOf(length, Gen.Elements(
                "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 ".ToCharArray()))
            .Select(chars => new string(chars));
    }

    /// <summary>
    /// Generates a random string within a length range [min, max].
    /// </summary>
    private static Gen<string> GenStringInRange(int min, int max)
    {
        return Gen.Choose(min, max).SelectMany(len => GenStringOfLength(len));
    }

    #endregion

    #region CreateOpportunityCommand Validation — Property 7 (Name, Location, LandSize)

    /// <summary>
    /// Property 7: For any valid inputs (Name 3-200 chars, Location 3-500 chars, LandSize > 0),
    /// the CreateOpportunityCommandValidator SHALL pass validation.
    /// </summary>
    [Property(MaxTest = 100)]
    public Property CreateOpportunity_ValidInputs_PassValidation()
    {
        var validCommandGen = from name in GenStringInRange(3, 200)
                              from location in GenStringInRange(3, 500)
                              from landSize in Gen.Choose(1, 1_000_000).Select(x => (decimal)x / 100)
                              select new CreateOpportunityCommand
                              {
                                  Name = name,
                                  Location = location,
                                  LandSize = landSize
                              };

        return Prop.ForAll(
            validCommandGen.ToArbitrary(),
            command =>
            {
                var result = _opportunityValidator.TestValidate(command);
                return result.IsValid
                    .Label($"Valid command should pass: Name({command.Name.Length}), Location({command.Location.Length}), LandSize({command.LandSize})");
            });
    }

    /// <summary>
    /// Property 7: For any Name shorter than 3 characters, the validator SHALL reject.
    /// </summary>
    [Property(MaxTest = 100)]
    public Property CreateOpportunity_NameTooShort_FailsValidation()
    {
        var shortNameGen = from nameLen in Gen.Choose(0, 2)
                           from name in GenStringOfLength(nameLen)
                           from location in GenStringInRange(3, 500)
                           from landSize in Gen.Choose(1, 1_000_000).Select(x => (decimal)x / 100)
                           select new CreateOpportunityCommand
                           {
                               Name = name,
                               Location = location,
                               LandSize = landSize
                           };

        return Prop.ForAll(
            shortNameGen.ToArbitrary(),
            command =>
            {
                var result = _opportunityValidator.TestValidate(command);
                return (!result.IsValid)
                    .Label($"Name with length {command.Name.Length} should fail validation");
            });
    }

    /// <summary>
    /// Property 7: For any Name longer than 200 characters, the validator SHALL reject.
    /// </summary>
    [Property(MaxTest = 100)]
    public Property CreateOpportunity_NameTooLong_FailsValidation()
    {
        var longNameGen = from nameLen in Gen.Choose(201, 300)
                          from name in GenStringOfLength(nameLen)
                          from location in GenStringInRange(3, 500)
                          from landSize in Gen.Choose(1, 1_000_000).Select(x => (decimal)x / 100)
                          select new CreateOpportunityCommand
                          {
                              Name = name,
                              Location = location,
                              LandSize = landSize
                          };

        return Prop.ForAll(
            longNameGen.ToArbitrary(),
            command =>
            {
                var result = _opportunityValidator.TestValidate(command);
                return (!result.IsValid)
                    .Label($"Name with length {command.Name.Length} should fail validation");
            });
    }

    /// <summary>
    /// Property 7: For any Location shorter than 3 characters, the validator SHALL reject.
    /// </summary>
    [Property(MaxTest = 100)]
    public Property CreateOpportunity_LocationTooShort_FailsValidation()
    {
        var shortLocGen = from name in GenStringInRange(3, 200)
                          from locLen in Gen.Choose(0, 2)
                          from location in GenStringOfLength(locLen)
                          from landSize in Gen.Choose(1, 1_000_000).Select(x => (decimal)x / 100)
                          select new CreateOpportunityCommand
                          {
                              Name = name,
                              Location = location,
                              LandSize = landSize
                          };

        return Prop.ForAll(
            shortLocGen.ToArbitrary(),
            command =>
            {
                var result = _opportunityValidator.TestValidate(command);
                return (!result.IsValid)
                    .Label($"Location with length {command.Location.Length} should fail validation");
            });
    }

    /// <summary>
    /// Property 7: For any Location longer than 500 characters, the validator SHALL reject.
    /// </summary>
    [Property(MaxTest = 100)]
    public Property CreateOpportunity_LocationTooLong_FailsValidation()
    {
        var longLocGen = from name in GenStringInRange(3, 200)
                         from locLen in Gen.Choose(501, 600)
                         from location in GenStringOfLength(locLen)
                         from landSize in Gen.Choose(1, 1_000_000).Select(x => (decimal)x / 100)
                         select new CreateOpportunityCommand
                         {
                             Name = name,
                             Location = location,
                             LandSize = landSize
                         };

        return Prop.ForAll(
            longLocGen.ToArbitrary(),
            command =>
            {
                var result = _opportunityValidator.TestValidate(command);
                return (!result.IsValid)
                    .Label($"Location with length {command.Location.Length} should fail validation");
            });
    }

    /// <summary>
    /// Property 7: For any LandSize less than or equal to zero, the validator SHALL reject.
    /// </summary>
    [Property(MaxTest = 100)]
    public Property CreateOpportunity_LandSizeZeroOrNegative_FailsValidation()
    {
        var invalidLandSizeGen = from name in GenStringInRange(3, 200)
                                 from location in GenStringInRange(3, 500)
                                 from landSize in Gen.Choose(-10000, 0).Select(x => (decimal)x / 100)
                                 select new CreateOpportunityCommand
                                 {
                                     Name = name,
                                     Location = location,
                                     LandSize = landSize
                                 };

        return Prop.ForAll(
            invalidLandSizeGen.ToArbitrary(),
            command =>
            {
                var result = _opportunityValidator.TestValidate(command);
                return (!result.IsValid)
                    .Label($"LandSize={command.LandSize} should fail validation");
            });
    }

    #endregion

    #region CreateOfferCommand Validation — Property 7 (Amount, Currency, ValidUntil)

    /// <summary>
    /// Property 7: For any valid offer inputs (Amount > 0, Currency matches ^[A-Z]{3}$, ValidUntil future),
    /// the CreateOfferCommandValidator SHALL pass validation.
    /// </summary>
    [Property(MaxTest = 100)]
    public Property CreateOffer_ValidInputs_PassValidation()
    {
        var validCurrencyGen = Gen.ArrayOf(3, Gen.Elements("ABCDEFGHIJKLMNOPQRSTUVWXYZ".ToCharArray()))
            .Select(chars => new string(chars));

        var validCommandGen = from amount in Gen.Choose(1, 10_000_000).Select(x => (decimal)x / 100)
                              from currency in validCurrencyGen
                              from daysAhead in Gen.Choose(1, 365)
                              select new CreateOfferCommand
                              {
                                  OpportunityId = Guid.NewGuid(),
                                  Amount = amount,
                                  Currency = currency,
                                  ValidUntil = DateTime.UtcNow.AddDays(daysAhead)
                              };

        return Prop.ForAll(
            validCommandGen.ToArbitrary(),
            command =>
            {
                var result = _offerValidator.TestValidate(command);
                return result.IsValid
                    .Label($"Valid offer should pass: Amount={command.Amount}, Currency={command.Currency}, ValidUntil={command.ValidUntil}");
            });
    }

    /// <summary>
    /// Property 7: For any Amount less than or equal to zero, the validator SHALL reject.
    /// </summary>
    [Property(MaxTest = 100)]
    public Property CreateOffer_AmountZeroOrNegative_FailsValidation()
    {
        var invalidAmountGen = from amount in Gen.Choose(-10000, 0).Select(x => (decimal)x / 100)
                               from daysAhead in Gen.Choose(1, 365)
                               select new CreateOfferCommand
                               {
                                   OpportunityId = Guid.NewGuid(),
                                   Amount = amount,
                                   Currency = "GBP",
                                   ValidUntil = DateTime.UtcNow.AddDays(daysAhead)
                               };

        return Prop.ForAll(
            invalidAmountGen.ToArbitrary(),
            command =>
            {
                var result = _offerValidator.TestValidate(command);
                return (!result.IsValid)
                    .Label($"Amount={command.Amount} should fail validation");
            });
    }

    /// <summary>
    /// Property 7: For any Currency that does not match ^[A-Z]{3}$ (lowercase, wrong length, digits),
    /// the validator SHALL reject.
    /// </summary>
    [Property(MaxTest = 100)]
    public Property CreateOffer_InvalidCurrency_FailsValidation()
    {
        // Generate currencies that violate the pattern: lowercase, digits, wrong lengths
        var invalidCurrencyGen = Gen.OneOf(
            // Lowercase letters
            Gen.ArrayOf(3, Gen.Elements("abcdefghijklmnopqrstuvwxyz".ToCharArray()))
                .Select(chars => new string(chars)),
            // Too short (1-2 uppercase)
            Gen.Choose(1, 2).SelectMany(len =>
                Gen.ArrayOf(len, Gen.Elements("ABCDEFGHIJKLMNOPQRSTUVWXYZ".ToCharArray()))
                    .Select(chars => new string(chars))),
            // Too long (4-6 uppercase)
            Gen.Choose(4, 6).SelectMany(len =>
                Gen.ArrayOf(len, Gen.Elements("ABCDEFGHIJKLMNOPQRSTUVWXYZ".ToCharArray()))
                    .Select(chars => new string(chars))),
            // Contains digits
            Gen.Constant("1AB"),
            Gen.Constant("A2B"),
            Gen.Constant("AB3")
        );

        var invalidCommandGen = from currency in invalidCurrencyGen
                                from daysAhead in Gen.Choose(1, 365)
                                select new CreateOfferCommand
                                {
                                    OpportunityId = Guid.NewGuid(),
                                    Amount = 100_000m,
                                    Currency = currency,
                                    ValidUntil = DateTime.UtcNow.AddDays(daysAhead)
                                };

        return Prop.ForAll(
            invalidCommandGen.ToArbitrary(),
            command =>
            {
                var result = _offerValidator.TestValidate(command);
                return (!result.IsValid)
                    .Label($"Currency='{command.Currency}' should fail validation");
            });
    }

    /// <summary>
    /// Property 7: For any ValidUntil date that is in the past, the validator SHALL reject.
    /// </summary>
    [Property(MaxTest = 100)]
    public Property CreateOffer_ValidUntilInPast_FailsValidation()
    {
        var pastDateGen = from daysBack in Gen.Choose(1, 365)
                          select new CreateOfferCommand
                          {
                              OpportunityId = Guid.NewGuid(),
                              Amount = 100_000m,
                              Currency = "GBP",
                              ValidUntil = DateTime.UtcNow.AddDays(-daysBack)
                          };

        return Prop.ForAll(
            pastDateGen.ToArbitrary(),
            command =>
            {
                var result = _offerValidator.TestValidate(command);
                return (!result.IsValid)
                    .Label($"ValidUntil={command.ValidUntil} (past date) should fail validation");
            });
    }

    #endregion

    #region CreateAcquisitionCommand Validation — Property 7 (PurchasePrice, CompletionDate, RegistryRef)

    /// <summary>
    /// Property 7: For any valid acquisition inputs (PurchasePrice > 0, CompletionDate <= UtcNow,
    /// RegistryRef 3-50 chars), the CreateAcquisitionCommandValidator SHALL pass validation.
    /// </summary>
    [Property(MaxTest = 100)]
    public Property CreateAcquisition_ValidInputs_PassValidation()
    {
        var validCommandGen = from price in Gen.Choose(1, 50_000_000).Select(x => (decimal)x / 100)
                              from daysBack in Gen.Choose(0, 365)
                              from refLen in Gen.Choose(3, 50)
                              from registryRef in GenStringOfLength(refLen)
                              select new CreateAcquisitionCommand
                              {
                                  OpportunityId = Guid.NewGuid(),
                                  PurchasePrice = price,
                                  CompletionDate = DateTime.UtcNow.AddDays(-daysBack),
                                  RegistryRef = registryRef
                              };

        return Prop.ForAll(
            validCommandGen.ToArbitrary(),
            command =>
            {
                var result = _acquisitionValidator.TestValidate(command);
                return result.IsValid
                    .Label($"Valid acquisition should pass: Price={command.PurchasePrice}, Date={command.CompletionDate}, Ref({command.RegistryRef.Length})");
            });
    }

    /// <summary>
    /// Property 7: For any PurchasePrice less than or equal to zero, the validator SHALL reject.
    /// </summary>
    [Property(MaxTest = 100)]
    public Property CreateAcquisition_PurchasePriceZeroOrNegative_FailsValidation()
    {
        var invalidPriceGen = from price in Gen.Choose(-10_000_000, 0).Select(x => (decimal)x / 100)
                              from daysBack in Gen.Choose(1, 365)
                              select new CreateAcquisitionCommand
                              {
                                  OpportunityId = Guid.NewGuid(),
                                  PurchasePrice = price,
                                  CompletionDate = DateTime.UtcNow.AddDays(-daysBack),
                                  RegistryRef = "REF-001"
                              };

        return Prop.ForAll(
            invalidPriceGen.ToArbitrary(),
            command =>
            {
                var result = _acquisitionValidator.TestValidate(command);
                return (!result.IsValid)
                    .Label($"PurchasePrice={command.PurchasePrice} should fail validation");
            });
    }

    /// <summary>
    /// Property 7: For any CompletionDate in the future, the validator SHALL reject.
    /// </summary>
    [Property(MaxTest = 100)]
    public Property CreateAcquisition_CompletionDateInFuture_FailsValidation()
    {
        var futureDateGen = from daysAhead in Gen.Choose(1, 365)
                            select new CreateAcquisitionCommand
                            {
                                OpportunityId = Guid.NewGuid(),
                                PurchasePrice = 500_000m,
                                CompletionDate = DateTime.UtcNow.AddDays(daysAhead),
                                RegistryRef = "REF-001"
                            };

        return Prop.ForAll(
            futureDateGen.ToArbitrary(),
            command =>
            {
                var result = _acquisitionValidator.TestValidate(command);
                return (!result.IsValid)
                    .Label($"CompletionDate={command.CompletionDate} (future) should fail validation");
            });
    }

    /// <summary>
    /// Property 7: For any RegistryRef shorter than 3 characters, the validator SHALL reject.
    /// </summary>
    [Property(MaxTest = 100)]
    public Property CreateAcquisition_RegistryRefTooShort_FailsValidation()
    {
        var shortRefGen = from refLen in Gen.Choose(0, 2)
                          from registryRef in GenStringOfLength(refLen)
                          from daysBack in Gen.Choose(1, 365)
                          select new CreateAcquisitionCommand
                          {
                              OpportunityId = Guid.NewGuid(),
                              PurchasePrice = 500_000m,
                              CompletionDate = DateTime.UtcNow.AddDays(-daysBack),
                              RegistryRef = registryRef
                          };

        return Prop.ForAll(
            shortRefGen.ToArbitrary(),
            command =>
            {
                var result = _acquisitionValidator.TestValidate(command);
                return (!result.IsValid)
                    .Label($"RegistryRef with length {command.RegistryRef.Length} should fail validation");
            });
    }

    /// <summary>
    /// Property 7: For any RegistryRef longer than 50 characters, the validator SHALL reject.
    /// </summary>
    [Property(MaxTest = 100)]
    public Property CreateAcquisition_RegistryRefTooLong_FailsValidation()
    {
        var longRefGen = from refLen in Gen.Choose(51, 100)
                         from registryRef in GenStringOfLength(refLen)
                         from daysBack in Gen.Choose(1, 365)
                         select new CreateAcquisitionCommand
                         {
                             OpportunityId = Guid.NewGuid(),
                             PurchasePrice = 500_000m,
                             CompletionDate = DateTime.UtcNow.AddDays(-daysBack),
                             RegistryRef = registryRef
                         };

        return Prop.ForAll(
            longRefGen.ToArbitrary(),
            command =>
            {
                var result = _acquisitionValidator.TestValidate(command);
                return (!result.IsValid)
                    .Label($"RegistryRef with length {command.RegistryRef.Length} should fail validation");
            });
    }

    #endregion
}
