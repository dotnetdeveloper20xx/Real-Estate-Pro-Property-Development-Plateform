using BuildEstate.Application.Features.LegalCompliance.ComplianceRequirements.DTOs;
using BuildEstate.Domain.Common;
using BuildEstate.Domain.Entities.LegalCompliance;
using BuildEstate.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace BuildEstate.Application.Features.LegalCompliance.ComplianceRequirements.Queries.GetComplianceChecklist;

/// <summary>
/// Handles retrieval of the compliance checklist view.
/// Returns all active requirements with their most recent check, next due date,
/// and a color-coded status indicator based on compliance health.
/// </summary>
public sealed class GetComplianceChecklistQueryHandler
    : IRequestHandler<GetComplianceChecklistQuery, List<ComplianceChecklistDto>>
{
    private readonly IRepository<ComplianceRequirement> _repository;

    public GetComplianceChecklistQueryHandler(IRepository<ComplianceRequirement> repository)
    {
        _repository = repository;
    }

    public async Task<List<ComplianceChecklistDto>> Handle(
        GetComplianceChecklistQuery request,
        CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;

        var requirements = await _repository.Query()
            .AsNoTracking()
            .Where(r => r.Status == ComplianceRequirementStatus.Active)
            .Select(r => new
            {
                r.Id,
                r.Name,
                r.Category,
                r.Frequency,
                r.NextDueDate,
                r.ResponsibleRole,
                LastCheck = r.Checks
                    .OrderByDescending(c => c.CheckDate)
                    .Select(c => new { c.CheckDate, c.Outcome })
                    .FirstOrDefault()
            })
            .ToListAsync(cancellationToken);

        var result = requirements.Select(r => new ComplianceChecklistDto
        {
            Id = r.Id,
            Name = r.Name,
            Category = r.Category,
            Frequency = r.Frequency,
            LastCheckDate = r.LastCheck?.CheckDate,
            LastOutcome = r.LastCheck?.Outcome,
            NextDueDate = r.NextDueDate,
            ResponsibleRole = r.ResponsibleRole,
            StatusIndicator = DetermineStatusIndicator(
                r.LastCheck?.Outcome,
                r.NextDueDate,
                r.LastCheck != null,
                now)
        }).ToList();

        return result;
    }

    /// <summary>
    /// Determines the color-coded status indicator for a compliance requirement:
    /// - "green": last check was Compliant and NextDueDate is in the future
    /// - "amber": NextDueDate is within 7 days
    /// - "red": overdue (NextDueDate has passed) or last check was NonCompliant
    /// - "grey": no checks have been recorded
    /// </summary>
    private static string DetermineStatusIndicator(
        ComplianceCheckOutcome? lastOutcome,
        DateTime? nextDueDate,
        bool hasChecks,
        DateTime now)
    {
        if (!hasChecks)
        {
            return "grey";
        }

        if (lastOutcome == ComplianceCheckOutcome.NonCompliant)
        {
            return "red";
        }

        if (nextDueDate.HasValue && nextDueDate.Value < now)
        {
            return "red";
        }

        if (nextDueDate.HasValue && nextDueDate.Value <= now.AddDays(7))
        {
            return "amber";
        }

        if (lastOutcome == ComplianceCheckOutcome.Compliant && (!nextDueDate.HasValue || nextDueDate.Value > now))
        {
            return "green";
        }

        // Default fallback for PartiallyCompliant or NotApplicable with no due date concerns
        return "green";
    }
}
