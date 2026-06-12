using BuildEstate.Application.Features.LegalCompliance.AuditTrail.DTOs;
using MediatR;

namespace BuildEstate.Application.Features.LegalCompliance.AuditTrail.Queries.ExportAuditTrail;

/// <summary>
/// Query to export audit trail data for a specified date range and optional entity type in CSV format.
/// Returns a byte array containing the UTF-8 encoded CSV content for compliance reviews.
/// </summary>
public sealed record ExportAuditTrailQuery : IRequest<ExportAuditTrailResult>
{
    /// <summary>Required inclusive start of the export date range (UTC).</summary>
    public DateTime FromDate { get; init; }

    /// <summary>Required inclusive end of the export date range (UTC).</summary>
    public DateTime ToDate { get; init; }

    /// <summary>Optional filter by entity type name (e.g., LegalCase, Contract).</summary>
    public string? EntityName { get; init; }
}

/// <summary>
/// Result containing the CSV export content and metadata.
/// </summary>
public sealed record ExportAuditTrailResult
{
    /// <summary>UTF-8 encoded CSV content.</summary>
    public byte[] Content { get; init; } = Array.Empty<byte>();

    /// <summary>Suggested filename for the download.</summary>
    public string FileName { get; init; } = string.Empty;

    /// <summary>MIME content type for the response.</summary>
    public string ContentType { get; init; } = "text/csv";
}
