namespace BuildEstate.Application.Features.PlanningApprovals.Documents.DTOs;

/// <summary>
/// Response DTO representing a planning document associated with a planning application.
/// </summary>
public sealed record DocumentDto
{
    public Guid Id { get; init; }
    public Guid ApplicationId { get; init; }
    public string DocumentType { get; init; } = string.Empty;
    public string FileName { get; init; } = string.Empty;
    public string ContentType { get; init; } = string.Empty;
    public long FileSizeBytes { get; init; }
    public string StoragePath { get; init; } = string.Empty;
    public DateTime UploadedAt { get; init; }
    public string UploadedBy { get; init; } = string.Empty;
    public DateTime CreatedAt { get; init; }
}
