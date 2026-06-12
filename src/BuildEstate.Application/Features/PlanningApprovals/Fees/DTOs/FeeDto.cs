namespace BuildEstate.Application.Features.PlanningApprovals.Fees.DTOs;

/// <summary>
/// Response DTO for a created or retrieved planning fee record.
/// </summary>
public sealed record FeeDto
{
    public Guid Id { get; init; }
    public Guid ApplicationId { get; init; }
    public decimal Amount { get; init; }
    public string Currency { get; init; } = string.Empty;
    public string FeeType { get; init; } = string.Empty;
    public string Description { get; init; } = string.Empty;
    public string PaymentStatus { get; init; } = string.Empty;
    public string? ApprovedBy { get; init; }
    public DateTime? ApprovedAt { get; init; }
    public string? ApprovalNotes { get; init; }
    public DateTime CreatedAt { get; init; }
}
