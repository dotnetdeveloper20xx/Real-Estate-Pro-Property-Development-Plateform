namespace BuildEstate.Application.Features.LegalCompliance.AuditRecords.DTOs;

/// <summary>
/// Lightweight DTO for the audit records list/table view.
/// Contains the key fields needed for filtering, sorting, and quick identification.
/// </summary>
public sealed record AuditRecordListItemDto
{
    public Guid Id { get; init; }
    public string AuditType { get; init; } = string.Empty;
    public string Scope { get; init; } = string.Empty;
    public string AuditorName { get; init; } = string.Empty;
    public DateTime AuditDate { get; init; }
    public string Status { get; init; } = string.Empty;
    public string? RiskRating { get; init; }
    public bool IsOverdue { get; init; }
    public DateTime? ActionDueDate { get; init; }
}
