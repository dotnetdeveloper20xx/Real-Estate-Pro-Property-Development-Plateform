using System.Globalization;
using System.Text;
using BuildEstate.Application.Features.LegalCompliance.AuditTrail.DTOs;
using MediatR;

namespace BuildEstate.Application.Features.LegalCompliance.AuditTrail.Queries.ExportAuditTrail;

/// <summary>
/// Handles the export of audit trail data to CSV format for compliance reviews.
/// Retrieves all matching audit entries and formats them as a UTF-8 encoded CSV file.
/// </summary>
public sealed class ExportAuditTrailQueryHandler
    : IRequestHandler<ExportAuditTrailQuery, ExportAuditTrailResult>
{
    private readonly IAuditTrailQueryService _auditTrailQueryService;

    public ExportAuditTrailQueryHandler(IAuditTrailQueryService auditTrailQueryService)
    {
        _auditTrailQueryService = auditTrailQueryService;
    }

    public async Task<ExportAuditTrailResult> Handle(
        ExportAuditTrailQuery request,
        CancellationToken cancellationToken)
    {
        var entries = await _auditTrailQueryService.GetAuditTrailForExportAsync(
            request.EntityName,
            request.FromDate,
            request.ToDate,
            cancellationToken);

        var csv = GenerateCsv(entries);

        var fileName = $"audit-trail-{request.FromDate:yyyy-MM-dd}_to_{request.ToDate:yyyy-MM-dd}.csv";

        return new ExportAuditTrailResult
        {
            Content = Encoding.UTF8.GetBytes(csv),
            FileName = fileName,
            ContentType = "text/csv"
        };
    }

    private static string GenerateCsv(List<AuditExportDto> entries)
    {
        var sb = new StringBuilder();

        // Header row
        sb.AppendLine("Id,UserId,UserName,Action,EntityName,EntityId,OldValues,NewValues,AffectedColumns,Timestamp,IpAddress,CorrelationId");

        // Data rows
        foreach (var entry in entries)
        {
            sb.Append(entry.Id);
            sb.Append(',');
            sb.Append(EscapeCsvField(entry.UserId));
            sb.Append(',');
            sb.Append(EscapeCsvField(entry.UserName));
            sb.Append(',');
            sb.Append(EscapeCsvField(entry.Action));
            sb.Append(',');
            sb.Append(EscapeCsvField(entry.EntityName));
            sb.Append(',');
            sb.Append(EscapeCsvField(entry.EntityId));
            sb.Append(',');
            sb.Append(EscapeCsvField(entry.OldValues ?? string.Empty));
            sb.Append(',');
            sb.Append(EscapeCsvField(entry.NewValues ?? string.Empty));
            sb.Append(',');
            sb.Append(EscapeCsvField(entry.AffectedColumns ?? string.Empty));
            sb.Append(',');
            sb.Append(entry.Timestamp.ToString("O", CultureInfo.InvariantCulture));
            sb.Append(',');
            sb.Append(EscapeCsvField(entry.IpAddress ?? string.Empty));
            sb.Append(',');
            sb.Append(EscapeCsvField(entry.CorrelationId ?? string.Empty));
            sb.AppendLine();
        }

        return sb.ToString();
    }

    /// <summary>
    /// Escapes a CSV field value by wrapping in double quotes if it contains
    /// commas, double quotes, or newlines. Internal double quotes are doubled.
    /// </summary>
    private static string EscapeCsvField(string value)
    {
        if (string.IsNullOrEmpty(value))
        {
            return string.Empty;
        }

        if (value.Contains(',') || value.Contains('"') || value.Contains('\n') || value.Contains('\r'))
        {
            return $"\"{value.Replace("\"", "\"\"")}\"";
        }

        return value;
    }
}
