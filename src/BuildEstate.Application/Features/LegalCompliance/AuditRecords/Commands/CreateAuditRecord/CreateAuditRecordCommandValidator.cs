using FluentValidation;

namespace BuildEstate.Application.Features.LegalCompliance.AuditRecords.Commands.CreateAuditRecord;

/// <summary>
/// Validates the CreateAuditRecordCommand input fields.
/// Enforces AuditType is a valid enum, Scope length (10-1000), AuditorName length (2-150),
/// and AuditDate is not empty.
/// </summary>
public sealed class CreateAuditRecordCommandValidator : AbstractValidator<CreateAuditRecordCommand>
{
    public CreateAuditRecordCommandValidator()
    {
        RuleFor(x => x.AuditType)
            .IsInEnum()
            .WithMessage("Audit type must be a valid AuditType value (Internal, External, Regulatory, or Spot Check).");

        RuleFor(x => x.Scope)
            .NotEmpty()
            .WithMessage("Scope is required.")
            .MinimumLength(10)
            .WithMessage("Scope must be at least 10 characters.")
            .MaximumLength(1000)
            .WithMessage("Scope must not exceed 1000 characters.");

        RuleFor(x => x.AuditorName)
            .NotEmpty()
            .WithMessage("Auditor name is required.")
            .MinimumLength(2)
            .WithMessage("Auditor name must be at least 2 characters.")
            .MaximumLength(150)
            .WithMessage("Auditor name must not exceed 150 characters.");

        RuleFor(x => x.AuditDate)
            .NotEmpty()
            .WithMessage("Audit date is required.");
    }
}
