using MediatR;

namespace BuildEstate.Application.Features.UserManagement.Users.Commands.BulkImport;

/// <summary>
/// Command to bulk import users from CSV content.
/// CSV format: FirstName,LastName,Email,Password,Roles
/// Each row is validated independently. Valid rows are imported; invalid rows are reported with error details.
/// </summary>
public sealed record BulkImportUsersCommand : IRequest<BulkImportResult>
{
    /// <summary>The raw CSV content including header row.</summary>
    public string CsvContent { get; init; } = string.Empty;

    /// <summary>The ID of the admin performing the bulk import.</summary>
    public string AdminUserId { get; init; } = string.Empty;

    /// <summary>Client IP address for audit logging.</summary>
    public string IpAddress { get; init; } = string.Empty;

    /// <summary>Correlation ID for distributed tracing.</summary>
    public string CorrelationId { get; init; } = string.Empty;
}

/// <summary>
/// Result of the bulk import operation containing success/failure counts and row-level errors.
/// </summary>
public sealed record BulkImportResult
{
    /// <summary>Number of users successfully created.</summary>
    public int SuccessCount { get; init; }

    /// <summary>Number of rows that failed validation or creation.</summary>
    public int FailedCount { get; init; }

    /// <summary>Row-level error details for failed rows.</summary>
    public IReadOnlyList<BulkImportRowError> RowErrors { get; init; } = [];

    /// <summary>Overall errors not specific to a row (e.g., empty CSV).</summary>
    public IReadOnlyList<string> Errors { get; init; } = [];
}

/// <summary>
/// Error details for a single failed row in the bulk import.
/// </summary>
public sealed record BulkImportRowError
{
    /// <summary>1-based row number (excluding the header row).</summary>
    public int RowNumber { get; init; }

    /// <summary>Validation or creation errors for this row.</summary>
    public IReadOnlyList<string> Errors { get; init; } = [];
}
