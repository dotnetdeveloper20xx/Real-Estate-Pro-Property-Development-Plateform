using BuildEstate.Domain.Enums;

namespace BuildEstate.Application.Features.LegalCompliance.LegalCases.DTOs;

/// <summary>
/// Lightweight summary DTO for cross-module integration.
/// Consumed by Land Acquisition and Planning modules to display legal case status
/// without requiring access to full case details.
/// </summary>
public sealed record LegalCaseSummaryDto
{
    public Guid Id { get; init; }
    public string CaseReference { get; init; } = string.Empty;
    public string Title { get; init; } = string.Empty;
    public LegalCaseStatus Status { get; init; }
    public LegalCasePriority Priority { get; init; }
    public LegalCaseType CaseType { get; init; }
    public int OpenContractsCount { get; init; }
}
