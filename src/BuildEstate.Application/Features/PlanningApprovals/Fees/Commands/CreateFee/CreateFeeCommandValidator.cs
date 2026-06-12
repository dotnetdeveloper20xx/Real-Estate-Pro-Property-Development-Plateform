using System.Text.RegularExpressions;
using FluentValidation;

namespace BuildEstate.Application.Features.PlanningApprovals.Fees.Commands.CreateFee;

/// <summary>
/// Validates the CreateFeeCommand input fields.
/// Ensures Amount is positive with max precision (18,2), Currency is a valid ISO 4217 3-letter code,
/// FeeType is a valid enum, and Description is provided.
/// </summary>
public sealed partial class CreateFeeCommandValidator : AbstractValidator<CreateFeeCommand>
{
    /// <summary>
    /// Regex pattern enforcing 3 uppercase letters (ISO 4217 format).
    /// </summary>
    [GeneratedRegex(@"^[A-Z]{3}$")]
    private static partial Regex CurrencyCodeRegex();

    public CreateFeeCommandValidator()
    {
        RuleFor(x => x.ApplicationId)
            .NotEmpty()
            .WithMessage("ApplicationId is required.");

        RuleFor(x => x.Amount)
            .GreaterThan(0)
            .WithMessage("Amount must be a positive value.")
            .PrecisionScale(18, 2, ignoreTrailingZeros: true)
            .WithMessage("Amount must have a maximum precision of 18 digits with 2 decimal places.");

        RuleFor(x => x.Currency)
            .NotEmpty()
            .WithMessage("Currency is required.")
            .Length(3)
            .WithMessage("Currency must be a 3-letter ISO 4217 code.")
            .Matches(CurrencyCodeRegex())
            .WithMessage("Currency must be a valid 3-letter uppercase ISO 4217 code (e.g. GBP, USD, EUR).");

        RuleFor(x => x.FeeType)
            .IsInEnum()
            .WithMessage("FeeType must be a valid fee type.");

        RuleFor(x => x.Description)
            .NotEmpty()
            .WithMessage("Description is required.")
            .MaximumLength(500)
            .WithMessage("Description must not exceed 500 characters.");
    }
}
