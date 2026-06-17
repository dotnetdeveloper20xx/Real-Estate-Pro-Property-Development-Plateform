using BuildEstate.Domain.Common;
using BuildEstate.Domain.Entities.LandAcquisition;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace BuildEstate.Application.Features.LandAcquisition.Dashboard.Queries.GetRecentActivity;

/// <summary>
/// Handles retrieval of the last 10 recently updated land opportunities,
/// projecting them into activity DTOs with timestamps and user names.
/// </summary>
public sealed class GetRecentActivityQueryHandler
    : IRequestHandler<GetRecentActivityQuery, List<RecentActivityDto>>
{
    private readonly IRepository<LandOpportunity> _repository;

    public GetRecentActivityQueryHandler(IRepository<LandOpportunity> repository)
    {
        _repository = repository;
    }

    public async Task<List<RecentActivityDto>> Handle(
        GetRecentActivityQuery request,
        CancellationToken cancellationToken)
    {
        var recentActivity = await _repository
            .Query()
            .AsNoTracking()
            .OrderByDescending(x => x.UpdatedAt ?? x.CreatedAt)
            .Take(10)
            .Select(x => new RecentActivityDto
            {
                OpportunityId = x.Id,
                OpportunityName = x.Name,
                Status = x.Status.ToString(),
                Timestamp = x.UpdatedAt ?? x.CreatedAt,
                UserName = x.UpdatedBy ?? x.CreatedBy
            })
            .ToListAsync(cancellationToken);

        return recentActivity;
    }
}
