using BuildEstate.Application.Features.PlanningApprovals.Applications.DTOs;
using BuildEstate.Domain.Common;
using BuildEstate.Domain.Entities.PlanningApprovals;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace BuildEstate.Application.Features.PlanningApprovals.Applications.Queries.GetApplicationsByOpportunity;

/// <summary>
/// Handles retrieval of all planning applications for a given land opportunity.
/// Uses AsNoTracking with direct projection to ApplicationSummaryDto for optimal
/// read performance. No pagination since one opportunity typically has few applications.
/// </summary>
public sealed class GetApplicationsByOpportunityQueryHandler
    : IRequestHandler<GetApplicationsByOpportunityQuery, List<ApplicationSummaryDto>>
{
    private readonly IRepository<PlanningApplication> _repository;

    public GetApplicationsByOpportunityQueryHandler(IRepository<PlanningApplication> repository)
    {
        _repository = repository;
    }

    public async Task<List<ApplicationSummaryDto>> Handle(
        GetApplicationsByOpportunityQuery request,
        CancellationToken cancellationToken)
    {
        var applications = await _repository
            .Query()
            .AsNoTracking()
            .Where(a => a.OpportunityId == request.OpportunityId)
            .OrderByDescending(a => a.CreatedAt)
            .Select(a => new ApplicationSummaryDto
            {
                Id = a.Id,
                Description = a.Description,
                ApplicationType = a.ApplicationType.ToString(),
                Status = a.Status.ToString(),
                CouncilName = a.CouncilName,
                SubmissionDate = a.SubmissionDate,
                CreatedAt = a.CreatedAt
            })
            .ToListAsync(cancellationToken);

        return applications;
    }
}
