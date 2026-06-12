using FluentValidation;

namespace BuildEstate.Application.Features.LegalCompliance.Insurance.Commands.CreateInsuranceRecord;

/// <summary>
/// Validates the CreateInsuranceRecordCommand input fields.
/// Enforces PolicyNumber length (3-50), Insurer length (2-200), valid CoverageType enum,
/// positive CoverAmount and Premium, valid ISO 4217 Currency, and StartDate before ExpiryDate.
/// </summary>
public sealed class CreateInsuranceRecordCommandValidator : AbstractValidator<CreateInsuranceRecordCommand>
{
    /// <summary>
    /// Common ISO 4217 currency codes accepted by the system.
    /// </summary>
    private static readonly HashSet<string> ValidCurrencyCodes = new(StringComparer.OrdinalIgnoreCase)
    {
        "GBP", "USD", "EUR", "CHF", "JPY", "AUD", "CAD", "NZD",
        "SEK", "NOK", "DKK", "SGD", "HKD", "ZAR", "INR", "BRL",
        "CNY", "AED", "SAR", "PLN", "CZK", "HUF", "TRY", "MXN"
    };

    public CreateInsuranceRecordCommandValidator()
    {
        RuleFor(x => x.PolicyNumber)
            .NotEmpty()
            .WithMessage("Policy number is required.")
            .MinimumLength(3)
            .WithMessage("Policy number must be at least 3 characters.")
            .MaximumLength(50)
            .WithMessage("Policy number must not exceed 50 characters.");

        RuleFor(x => x.Insurer)
            .NotEmpty()
            .WithMessage("Insurer is required.")
            .MinimumLength(2)
            .WithMessage("Insurer must be at least 2 characters.")
            .MaximumLength(200)
            .WithMessage("Insurer must not exceed 200 characters.");

        RuleFor(x => x.CoverageType)
            .IsInEnum()
            .WithMessage("Coverage type must be a valid CoverageType value.");

        RuleFor(x => x.CoverAmount)
            .GreaterThan(0)
            .WithMessage("Cover amount must be greater than zero.");

        RuleFor(x => x.Premium)
            .GreaterThan(0)
            .WithMessage("Premium must be greater than zero.");

        RuleFor(x => x.Currency)
            .NotEmpty()
            .WithMessage("Currency is required.")
            .Length(3)
            .WithMessage("Currency must be exactly 3 characters.")
            .Must(BeValidIsoCurrencyCode)
            .WithMessage("Currency must be a valid ISO 4217 currency code.");

        RuleFor(x => x.StartDate)
            .NotEmpty()
            .WithMessage("Start date is required.");

        RuleFor(x => x.ExpiryDate)
            .NotEmpty()
            .WithMessage("Expiry date is required.");

        RuleFor(x => x.StartDate)
            .LessThan(x => x.ExpiryDate)
            .WithMessage("Start date must be before the expiry date.");
    }

    private static bool BeValidIsoCurrencyCode(string currency)
    {
        return !string.IsNullOrWhiteSpace(currency) && ValidCurrencyCodes.Contains(currency);
    }
}
