using FluentValidation;

namespace BuildEstate.Application.Features.LegalCompliance.Insurance.Commands.UpdateInsuranceRecord;

/// <summary>
/// Validates the UpdateInsuranceRecordCommand input fields.
/// Id is always required; optional fields are only validated when provided (non-null).
/// </summary>
public sealed class UpdateInsuranceRecordCommandValidator : AbstractValidator<UpdateInsuranceRecordCommand>
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

    public UpdateInsuranceRecordCommandValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty()
            .WithMessage("Insurance record Id is required.");

        RuleFor(x => x.PolicyNumber)
            .MinimumLength(3)
            .WithMessage("Policy number must be at least 3 characters.")
            .MaximumLength(50)
            .WithMessage("Policy number must not exceed 50 characters.")
            .When(x => x.PolicyNumber is not null);

        RuleFor(x => x.Insurer)
            .MinimumLength(2)
            .WithMessage("Insurer must be at least 2 characters.")
            .MaximumLength(200)
            .WithMessage("Insurer must not exceed 200 characters.")
            .When(x => x.Insurer is not null);

        RuleFor(x => x.CoverAmount)
            .GreaterThan(0)
            .WithMessage("Cover amount must be greater than zero.")
            .When(x => x.CoverAmount.HasValue);

        RuleFor(x => x.Premium)
            .GreaterThan(0)
            .WithMessage("Premium must be greater than zero.")
            .When(x => x.Premium.HasValue);

        RuleFor(x => x.Currency)
            .Length(3)
            .WithMessage("Currency must be exactly 3 characters.")
            .Must(BeValidIsoCurrencyCode!)
            .WithMessage("Currency must be a valid ISO 4217 currency code.")
            .When(x => x.Currency is not null);
    }

    private static bool BeValidIsoCurrencyCode(string currency)
    {
        return !string.IsNullOrWhiteSpace(currency) && ValidCurrencyCodes.Contains(currency);
    }
}
