using BuildEstate.Application.Features.PlanningApprovals.Milestones.DTOs;
using BuildEstate.Domain.Common;
using BuildEstate.Domain.Entities.PlanningApprovals;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace BuildEstate.Application.Features.PlanningApprovals.Milestones.Queries.GetMilestones;

/// <summary>
/// Handles retrieval of all planning milestones for a given application,
/// ordered by TargetDate ascending. Uses AsNoTracking with projection to
/// MilestoneDto for optimised read-only performance.
/// </summary>
public sealed class GetMilestonesQueryHandler
    : IRequestHandler<GetMilestonesQuery, List<MilestoneDto>>
{
    private readonly IRepository<PlanningMilestone> _milestoneRepository;

    public GetMilestonesQueryHandler(IRepository<PlanningMilestone> milestoneRepository)
    {
        _milestoneRepository = milestoneRepository;
    }

    public async Task<List<MilestoneDto>> Handle(
        GetMilestonesQuery request,
        CancellationToken cancellationToken)
    {
        var milestones = await _milestoneRepository.Query()
            .AsNoTracking()
            .Where(m => m.ApplicationId == request.ApplicationId)
            .OrderBy(m => m.TargetDate)
            .Select(m => new MilestoneDto
            {
                Id = m.Id,
                ApplicationId = m.ApplicationId,
                MilestoneType = m.MilestoneType.ToString(),
                Status = m.Status.ToString(),
                TargetDate = m.TargetDate,
                ActualDate = m.ActualDate,
                VarianceDays = m.VarianceDays,
                CreatedAt = m.CreatedAt
            })
            .ToListAsync(cancellationToken);

        return milestones;
    }
}
