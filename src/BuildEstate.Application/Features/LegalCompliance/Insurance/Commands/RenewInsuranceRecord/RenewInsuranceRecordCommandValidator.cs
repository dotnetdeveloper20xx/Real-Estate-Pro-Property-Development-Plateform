using FluentValidation;

namespace BuildEstate.Application.Features.LegalCompliance.Insurance.Commands.RenewInsuranceRecord;

/// <summary>
/// Validates the RenewInsuranceRecordCommand input fields.
/// Enforces Id not empty, positive NewCoverAmount and NewPremium,
/// valid ISO 4217 Currency, and NewStartDate before NewExpiryDate.
/// </summary>
public sealed class RenewInsuranceRecordCommandValidator : AbstractValidator<RenewInsuranceRecordCommand>
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

    public RenewInsuranceRecordCommandValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty()
            .WithMessage("Insurance record Id is required.");

        RuleFor(x => x.NewCoverAmount)
            .GreaterThan(0)
            .WithMessage("New cover amount must be greater than zero.");

        RuleFor(x => x.NewPremium)
            .GreaterThan(0)
            .WithMessage("New premium must be greater than zero.");

        RuleFor(x => x.Currency)
            .NotEmpty()
            .WithMessage("Currency is required.")
            .Length(3)
            .WithMessage("Currency must be exactly 3 characters.")
            .Must(BeValidIsoCurrencyCode)
            .WithMessage("Currency must be a valid ISO 4217 currency code.");

        RuleFor(x => x.NewStartDate)
            .NotEmpty()
            .WithMessage("New start date is required.");

        RuleFor(x => x.NewExpiryDate)
            .NotEmpty()
            .WithMessage("New expiry date is required.");

        RuleFor(x => x.NewStartDate)
            .LessThan(x => x.NewExpiryDate)
            .WithMessage("New start date must be before the new expiry date.");
    }

    private static bool BeValidIsoCurrencyCode(string currency)
    {
        return !string.IsNullOrWhiteSpace(currency) && ValidCurrencyCodes.Contains(currency);
    }
}
