using FluentValidation;

namespace BuildEstate.Application.Features.LegalCompliance.Contracts.Commands.CreateContract;

/// <summary>
/// Validates the CreateContractCommand input fields including LegalCaseId, title length,
/// contract type, counterparty name, contract value, ISO 4217 currency, and date range.
/// </summary>
public sealed class CreateContractCommandValidator : AbstractValidator<CreateContractCommand>
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

    public CreateContractCommandValidator()
    {
        RuleFor(x => x.LegalCaseId)
            .NotEmpty()
            .WithMessage("Legal Case Id is required.");

        RuleFor(x => x.Title)
            .NotEmpty()
            .WithMessage("Title is required.")
            .MinimumLength(5)
            .WithMessage("Title must be at least 5 characters.")
            .MaximumLength(300)
            .WithMessage("Title must not exceed 300 characters.");

        RuleFor(x => x.ContractType)
            .IsInEnum()
            .WithMessage("Contract type must be a valid value.");

        RuleFor(x => x.CounterpartyName)
            .NotEmpty()
            .WithMessage("Counterparty name is required.")
            .MinimumLength(2)
            .WithMessage("Counterparty name must be at least 2 characters.")
            .MaximumLength(200)
            .WithMessage("Counterparty name must not exceed 200 characters.");

        RuleFor(x => x.ContractValue)
            .GreaterThan(0)
            .WithMessage("Contract value must be greater than zero.");

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

        RuleFor(x => x.EndDate)
            .NotEmpty()
            .WithMessage("End date is required.");

        RuleFor(x => x.StartDate)
            .LessThanOrEqualTo(x => x.EndDate)
            .WithMessage("Start date must be on or before the end date.");
    }

    private static bool BeValidIsoCurrencyCode(string currency)
    {
        return !string.IsNullOrWhiteSpace(currency) && ValidCurrencyCodes.Contains(currency);
    }
}
