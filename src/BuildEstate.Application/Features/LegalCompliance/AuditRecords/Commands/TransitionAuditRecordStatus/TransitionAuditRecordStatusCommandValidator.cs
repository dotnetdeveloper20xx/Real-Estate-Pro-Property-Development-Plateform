using BuildEstate.Domain.Enums;
using FluentValidation;

namespace BuildEstate.Application.Features.LegalCompliance.AuditRecords.Commands.TransitionAuditRecordStatus;

/// <summary>
/// Validates the TransitionAuditRecordStatusCommand input.
/// Enforces status-specific field requirements:
/// - FindingsRecorded: Findings NotEmpty MinLength(20), RiskRating NotNull IsInEnum
/// - ActionsRequired: Recommendations NotEmpty MinLength(20), ActionDueDate NotNull GreaterThan(UTC now)
/// </summary>
public sealed class TransitionAuditRecordStatusCommandValidator
    : AbstractValidator<TransitionAuditRecordStatusCommand>
{
    public TransitionAuditRecordStatusCommandValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty()
            .WithMessage("Id is required.");

        RuleFor(x => x.NewStatus)
            .IsInEnum()
            .WithMessage("NewStatus must be a valid AuditRecordStatus value.");

        // WHEN NewStatus = FindingsRecorded
        When(x => x.NewStatus == AuditRecordStatus.FindingsRecorded, () =>
        {
            RuleFor(x => x.Findings)
                .NotEmpty()
                .WithMessage("Findings is required when transitioning to FindingsRecorded.")
                .MinimumLength(20)
                .WithMessage("Findings must be at least 20 characters.");

            RuleFor(x => x.RiskRating)
                .NotNull()
                .WithMessage("RiskRating is required when transitioning to FindingsRecorded.")
                .IsInEnum()
                .WithMessage("RiskRating must be a valid RiskRating value.");
        });

        // WHEN NewStatus = ActionsRequired
        When(x => x.NewStatus == AuditRecordStatus.ActionsRequired, () =>
        {
            RuleFor(x => x.Recommendations)
                .NotEmpty()
                .WithMessage("Recommendations is required when transitioning to ActionsRequired.")
                .MinimumLength(20)
                .WithMessage("Recommendations must be at least 20 characters.");

            RuleFor(x => x.ActionDueDate)
                .NotNull()
                .WithMessage("ActionDueDate is required when transitioning to ActionsRequired.")
                .GreaterThan(DateTime.UtcNow)
                .WithMessage("ActionDueDate must be a future UTC date.");
        });
    }
}
