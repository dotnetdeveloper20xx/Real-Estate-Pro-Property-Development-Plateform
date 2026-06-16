using FluentValidation;

namespace BuildEstate.Application.Features.UserManagement.Users.Commands.BulkImport;

/// <summary>
/// Validates the BulkImportUsersCommand before the handler executes.
/// Performs top-level validation on the command properties.
/// Row-level validation is handled inside the handler itself since each row
/// must be validated independently and errors reported per row.
/// </summary>
public sealed class BulkImportUsersCommandValidator : AbstractValidator<BulkImportUsersCommand>
{
    public BulkImportUsersCommandValidator()
    {
        RuleFor(x => x.CsvContent)
            .NotEmpty()
            .WithMessage("CSV content is required.");

        RuleFor(x => x.AdminUserId)
            .NotEmpty()
            .WithMessage("Admin user ID is required.");

        RuleFor(x => x.IpAddress)
            .NotEmpty()
            .WithMessage("IP address is required.");

        RuleFor(x => x.CorrelationId)
            .NotEmpty()
            .WithMessage("Correlation ID is required.");
    }
}
