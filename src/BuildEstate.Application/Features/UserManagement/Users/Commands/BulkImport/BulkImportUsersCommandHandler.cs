using System.Text.RegularExpressions;
using BuildEstate.Application.Interfaces;
using BuildEstate.Domain.Entities.UserManagement;
using MediatR;
using Microsoft.Extensions.Logging;

namespace BuildEstate.Application.Features.UserManagement.Users.Commands.BulkImport;

/// <summary>
/// Handles bulk user import by:
/// 1. Parsing the CSV content (skipping the header row)
/// 2. Validating each row independently (email format, email uniqueness, password policy, roles exist)
/// 3. For valid rows: creating the user, assigning roles, recording password history
/// 4. For invalid rows: collecting error messages with row number
/// 5. Returning BulkImportResult with success count, failed count, and row-level errors
/// </summary>
public sealed class BulkImportUsersCommandHandler : IRequestHandler<BulkImportUsersCommand, BulkImportResult>
{
    private readonly IUserIdentityService _userIdentityService;
    private readonly IPasswordHistoryService _passwordHistoryService;
    private readonly IAuditLogService _auditLogService;
    private readonly ILogger<BulkImportUsersCommandHandler> _logger;

    private static readonly Regex EmailRegex = new(
        @"^[^@\s]+@[^@\s]+\.[^@\s]+$",
        RegexOptions.Compiled | RegexOptions.IgnoreCase);

    private static readonly Regex UppercaseRegex = new("[A-Z]", RegexOptions.Compiled);
    private static readonly Regex DigitRegex = new("[0-9]", RegexOptions.Compiled);
    private static readonly Regex SpecialCharRegex = new(
        @"[!@#$%^&*()\-_+=\[\]{}|;:',.<>?/`~]", RegexOptions.Compiled);

    public BulkImportUsersCommandHandler(
        IUserIdentityService userIdentityService,
        IPasswordHistoryService passwordHistoryService,
        IAuditLogService auditLogService,
        ILogger<BulkImportUsersCommandHandler> logger)
    {
        _userIdentityService = userIdentityService;
        _passwordHistoryService = passwordHistoryService;
        _auditLogService = auditLogService;
        _logger = logger;
    }

    public async Task<BulkImportResult> Handle(BulkImportUsersCommand request, CancellationToken cancellationToken)
    {
        var lines = request.CsvContent
            .Split(["\r\n", "\n", "\r"], StringSplitOptions.None)
            .Where(line => !string.IsNullOrWhiteSpace(line))
            .ToList();

        if (lines.Count < 2)
        {
            return new BulkImportResult
            {
                Errors = ["CSV must contain a header row and at least one data row."]
            };
        }

        // Skip the header row
        var dataLines = lines.Skip(1).ToList();
        var rowErrors = new List<BulkImportRowError>();
        var successCount = 0;

        var adminDisplayName = await _userIdentityService.GetUserDisplayNameAsync(
            request.AdminUserId, cancellationToken);

        for (var i = 0; i < dataLines.Count; i++)
        {
            var rowNumber = i + 1; // 1-based row number (data rows only)
            var line = dataLines[i];

            var parseResult = ParseCsvRow(line, rowNumber);
            if (!parseResult.IsValid)
            {
                rowErrors.Add(new BulkImportRowError
                {
                    RowNumber = rowNumber,
                    Errors = parseResult.Errors
                });
                continue;
            }

            var row = parseResult.Row!;

            // Validate row
            var validationErrors = await ValidateRowAsync(row, rowNumber, cancellationToken);
            if (validationErrors.Count > 0)
            {
                rowErrors.Add(new BulkImportRowError
                {
                    RowNumber = rowNumber,
                    Errors = validationErrors
                });
                continue;
            }

            // Create user
            var createResult = await _userIdentityService.CreateUserAsync(
                row.FirstName, row.LastName, row.Email, row.Password,
                request.AdminUserId, cancellationToken);

            if (!createResult.Succeeded)
            {
                rowErrors.Add(new BulkImportRowError
                {
                    RowNumber = rowNumber,
                    Errors = createResult.Errors.ToList()
                });
                continue;
            }

            var userId = createResult.UserId!;

            // Assign roles
            if (row.Roles.Count > 0)
            {
                var roleResult = await _userIdentityService.AssignRolesAsync(
                    userId, row.Roles, cancellationToken);

                if (!roleResult.Succeeded)
                {
                    rowErrors.Add(new BulkImportRowError
                    {
                        RowNumber = rowNumber,
                        Errors = roleResult.Errors.ToList()
                    });
                    continue;
                }
            }

            // Record password history
            if (!string.IsNullOrEmpty(createResult.PasswordHash))
            {
                await _passwordHistoryService.RecordPasswordChangeAsync(
                    userId, createResult.PasswordHash, cancellationToken);
            }

            successCount++;
        }

        // Log a single audit entry for the bulk import operation
        await _auditLogService.LogAsync(new AuditLogEntry
        {
            Action = "BulkUserImport",
            PerformedByUserId = request.AdminUserId,
            PerformedByUserName = adminDisplayName ?? "System",
            TargetEntityType = "User",
            IpAddress = request.IpAddress,
            CorrelationId = request.CorrelationId,
            Details = $"Bulk import completed. {successCount} users created successfully, {rowErrors.Count} rows failed."
        }, cancellationToken);

        _logger.LogInformation(
            "Bulk import completed by admin {AdminUserId}: {SuccessCount} succeeded, {FailedCount} failed",
            request.AdminUserId, successCount, rowErrors.Count);

        return new BulkImportResult
        {
            SuccessCount = successCount,
            FailedCount = rowErrors.Count,
            RowErrors = rowErrors
        };
    }

    private static CsvParseResult ParseCsvRow(string line, int rowNumber)
    {
        var columns = SplitCsvLine(line);

        if (columns.Count < 5)
        {
            return CsvParseResult.Invalid(
                [$"Row {rowNumber}: Expected 5 columns (FirstName, LastName, Email, Password, Roles), but found {columns.Count}."]);
        }

        return CsvParseResult.Valid(new CsvRow
        {
            FirstName = columns[0].Trim(),
            LastName = columns[1].Trim(),
            Email = columns[2].Trim(),
            Password = columns[3].Trim(),
            Roles = columns[4]
                .Split(';', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .ToList()
        });
    }

    /// <summary>
    /// Splits a CSV line respecting quoted fields.
    /// </summary>
    private static List<string> SplitCsvLine(string line)
    {
        var result = new List<string>();
        var current = string.Empty;
        var inQuotes = false;

        for (var i = 0; i < line.Length; i++)
        {
            var c = line[i];

            if (c == '"')
            {
                if (inQuotes && i + 1 < line.Length && line[i + 1] == '"')
                {
                    current += '"';
                    i++; // Skip escaped quote
                }
                else
                {
                    inQuotes = !inQuotes;
                }
            }
            else if (c == ',' && !inQuotes)
            {
                result.Add(current);
                current = string.Empty;
            }
            else
            {
                current += c;
            }
        }

        result.Add(current);
        return result;
    }

    private async Task<List<string>> ValidateRowAsync(CsvRow row, int rowNumber, CancellationToken ct)
    {
        var errors = new List<string>();

        // Validate FirstName
        if (string.IsNullOrWhiteSpace(row.FirstName))
        {
            errors.Add($"Row {rowNumber}: First name is required.");
        }
        else if (row.FirstName.Length > 100)
        {
            errors.Add($"Row {rowNumber}: First name must not exceed 100 characters.");
        }

        // Validate LastName
        if (string.IsNullOrWhiteSpace(row.LastName))
        {
            errors.Add($"Row {rowNumber}: Last name is required.");
        }
        else if (row.LastName.Length > 100)
        {
            errors.Add($"Row {rowNumber}: Last name must not exceed 100 characters.");
        }

        // Validate Email format
        if (string.IsNullOrWhiteSpace(row.Email))
        {
            errors.Add($"Row {rowNumber}: Email is required.");
        }
        else if (!EmailRegex.IsMatch(row.Email))
        {
            errors.Add($"Row {rowNumber}: Email format is invalid.");
        }
        else
        {
            // Check email uniqueness
            var emailExists = await _userIdentityService.EmailExistsAsync(row.Email, ct);
            if (emailExists)
            {
                errors.Add($"Row {rowNumber}: Email '{row.Email}' is already in use.");
            }
        }

        // Validate Password policy
        ValidatePassword(row.Password, rowNumber, errors);

        // Validate Roles exist
        foreach (var role in row.Roles)
        {
            var roleExists = await _userIdentityService.RoleExistsAsync(role, ct);
            if (!roleExists)
            {
                errors.Add($"Row {rowNumber}: Role '{role}' does not exist.");
            }
        }

        return errors;
    }

    private static void ValidatePassword(string password, int rowNumber, List<string> errors)
    {
        if (string.IsNullOrWhiteSpace(password))
        {
            errors.Add($"Row {rowNumber}: Password is required.");
            return;
        }

        if (password.Length < 8)
        {
            errors.Add($"Row {rowNumber}: Password must be at least 8 characters.");
        }

        if (password.Length > 128)
        {
            errors.Add($"Row {rowNumber}: Password must not exceed 128 characters.");
        }

        if (!UppercaseRegex.IsMatch(password))
        {
            errors.Add($"Row {rowNumber}: Password must contain at least 1 uppercase letter.");
        }

        if (!DigitRegex.IsMatch(password))
        {
            errors.Add($"Row {rowNumber}: Password must contain at least 1 number.");
        }

        if (!SpecialCharRegex.IsMatch(password))
        {
            errors.Add($"Row {rowNumber}: Password must contain at least 1 special character.");
        }
    }

    private sealed record CsvRow
    {
        public string FirstName { get; init; } = string.Empty;
        public string LastName { get; init; } = string.Empty;
        public string Email { get; init; } = string.Empty;
        public string Password { get; init; } = string.Empty;
        public List<string> Roles { get; init; } = [];
    }

    private sealed record CsvParseResult
    {
        public bool IsValid { get; init; }
        public CsvRow? Row { get; init; }
        public IReadOnlyList<string> Errors { get; init; } = [];

        public static CsvParseResult Valid(CsvRow row) => new() { IsValid = true, Row = row };
        public static CsvParseResult Invalid(IReadOnlyList<string> errors) => new() { IsValid = false, Errors = errors };
    }
}
