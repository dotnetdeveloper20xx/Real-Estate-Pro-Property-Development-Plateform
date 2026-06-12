using FluentValidation;

namespace BuildEstate.Application.Features.LegalCompliance.Contracts.Commands.UpdateContract;

/// <summary>
/// Validates the UpdateContractCommand input fields.
/// Id is always required; optional fields are only validated when provided (non-null).
/// </summary>
public sealed class UpdateContractCommandValidator : AbstractValidator<UpdateContractCommand>
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

    public UpdateContractCommandValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty()
            .WithMessage("Contract Id is required.");

        RuleFor(x => x.Title)
            .MinimumLength(5)
            .WithMessage("Title must be at least 5 characters.")
            .MaximumLength(300)
            .WithMessage("Title must not exceed 300 characters.")
            .When(x => x.Title is not null);

        RuleFor(x => x.CounterpartyName)
            .MinimumLength(2)
            .WithMessage("Counterparty name must be at least 2 characters.")
            .MaximumLength(200)
            .WithMessage("Counterparty name must not exceed 200 characters.")
            .When(x => x.CounterpartyName is not null);

        RuleFor(x => x.ContractValue)
            .GreaterThan(0)
            .WithMessage("Contract value must be greater than zero.")
            .When(x => x.ContractValue.HasValue);

        RuleFor(x => x.Currency)
            .Length(3)
            .WithMessage("Currency must be exactly 3 characters.")
            .Must(BeValidIsoCurrencyCode!)
            .WithMessage("Currency must be a valid ISO 4217 currency code.")
            .When(x => x.Currency is not null);

        RuleFor(x => x.StartDate)
            .LessThanOrEqualTo(x => x.EndDate!.Value)
            .WithMessage("Start date must be on or before the end date.")
            .When(x => x.StartDate.HasValue && x.EndDate.HasValue);

        RuleFor(x => x.TerminationClause)
            .MaximumLength(1000)
            .WithMessage("Termination clause must not exceed 1000 characters.")
            .When(x => x.TerminationClause is not null);

        RuleFor(x => x.SpecialConditions)
            .MaximumLength(2000)
            .WithMessage("Special conditions must not exceed 2000 characters.")
            .When(x => x.SpecialConditions is not null);

        RuleFor(x => x.PaymentTerms)
            .MaximumLength(500)
            .WithMessage("Payment terms must not exceed 500 characters.")
            .When(x => x.PaymentTerms is not null);
    }

    private static bool BeValidIsoCurrencyCode(string currency)
    {
        return !string.IsNullOrWhiteSpace(currency) && ValidCurrencyCodes.Contains(currency);
    }
}
