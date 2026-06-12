using BuildEstate.Application.Common;
using BuildEstate.Application.Features.PlanningApprovals.Applications.DTOs;
using BuildEstate.Domain.Common;
using BuildEstate.Domain.Entities.LandAcquisition;
using BuildEstate.Domain.Entities.PlanningApprovals;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace BuildEstate.Application.Features.PlanningApprovals.Applications.Queries.GetApplications;

/// <summary>
/// Handles retrieval of a paginated, filtered, sorted, and searchable list of planning applications.
/// Uses AsNoTracking with projection to ApplicationListItemDto for optimised read-only performance.
/// Joins to LandOpportunity for free-text search across the opportunity name.
/// </summary>
public sealed class GetApplicationsQueryHandler
    : IRequestHandler<GetApplicationsQuery, PagedResult<ApplicationListItemDto>>
{
    private readonly IRepository<PlanningApplication> _applicationRepository;
    private readonly IRepository<LandOpportunity> _opportunityRepository;

    public GetApplicationsQueryHandler(
        IRepository<PlanningApplication> applicationRepository,
        IRepository<LandOpportunity> opportunityRepository)
    {
        _applicationRepository = applicationRepository;
        _opportunityRepository = opportunityRepository;
    }

    public async Task<PagedResult<ApplicationListItemDto>> Handle(
        GetApplicationsQuery request,
        CancellationToken cancellationToken)
    {
        // Build base query with left join to LandOpportunity for name search/display
        var applications = _applicationRepository.Query().AsNoTracking();
        var opportunities = _opportunityRepository.Query().AsNoTracking();

        var query = from app in applications
                    join opp in opportunities
                        on app.OpportunityId equals opp.Id into oppGroup
                    from opp in oppGroup.DefaultIfEmpty()
                    select new ApplicationWithOpportunity
                    {
                        Id = app.Id,
                        OpportunityId = app.OpportunityId,
                        Description = app.Description,
                        ApplicationType = app.ApplicationType,
                        Status = app.Status,
                        ApplicationReference = app.ApplicationReference,
                        CouncilName = app.CouncilName,
                        OpportunityName = opp != null ? opp.Name : null,
                        SubmissionDate = app.SubmissionDate,
                        TargetDecisionDate = app.TargetDecisionDate,
                        CreatedAt = app.CreatedAt
                    };

        // Apply filters
        if (request.Status.HasValue)
        {
            query = query.Where(x => x.Status == request.Status.Value);
        }

        if (request.ApplicationType.HasValue)
        {
            query = query.Where(x => x.ApplicationType == request.ApplicationType.Value);
        }

        if (!string.IsNullOrWhiteSpace(request.CouncilName))
        {
            query = query.Where(x => x.CouncilName == request.CouncilName);
        }

        if (request.SubmissionDateFrom.HasValue)
        {
            query = query.Where(x => x.SubmissionDate >= request.SubmissionDateFrom.Value);
        }

        if (request.SubmissionDateTo.HasValue)
        {
            query = query.Where(x => x.SubmissionDate <= request.SubmissionDateTo.Value);
        }

        // Apply free-text search
        if (!string.IsNullOrWhiteSpace(request.SearchTerm))
        {
            var searchTerm = request.SearchTerm.Trim().ToLower();
            query = query.Where(x =>
                x.Description.ToLower().Contains(searchTerm) ||
                (x.ApplicationReference != null && x.ApplicationReference.ToLower().Contains(searchTerm)) ||
                x.CouncilName.ToLower().Contains(searchTerm) ||
                (x.OpportunityName != null && x.OpportunityName.ToLower().Contains(searchTerm)));
        }

        // Get total count before pagination
        var totalCount = await query.CountAsync(cancellationToken);

        // Apply sorting
        query = ApplySorting(query, request.SortBy, request.SortDirection);

        // Apply pagination with default guards
        var pageNumber = request.PageNumber < 1 ? 1 : request.PageNumber;
        var pageSize = request.PageSize < 1 ? 10 : request.PageSize;

        var items = await query
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(x => new ApplicationListItemDto
            {
                Id = x.Id,
                OpportunityId = x.OpportunityId,
                Description = x.Description,
                ApplicationType = x.ApplicationType.ToString(),
                Status = x.Status.ToString(),
                ApplicationReference = x.ApplicationReference,
                CouncilName = x.CouncilName,
                LandOpportunityName = x.OpportunityName,
                SubmissionDate = x.SubmissionDate,
                TargetDecisionDate = x.TargetDecisionDate,
                CreatedAt = x.CreatedAt
            })
            .ToListAsync(cancellationToken);

        return PagedResult<ApplicationListItemDto>.Create(items, totalCount, pageNumber, pageSize);
    }

    private static IQueryable<ApplicationWithOpportunity> ApplySorting(
        IQueryable<ApplicationWithOpportunity> query,
        string? sortBy,
        string? sortDirection)
    {
        var isDescending = string.Equals(sortDirection, "desc", StringComparison.OrdinalIgnoreCase);

        // Default sort: CreatedAt descending
        if (string.IsNullOrWhiteSpace(sortBy))
        {
            return query.OrderByDescending(x => x.CreatedAt);
        }

        return sortBy.ToLowerInvariant() switch
        {
            "description" => isDescending
                ? query.OrderByDescending(x => x.Description)
                : query.OrderBy(x => x.Description),
            "createdat" => isDescending
                ? query.OrderByDescending(x => x.CreatedAt)
                : query.OrderBy(x => x.CreatedAt),
            "submissiondate" => isDescending
                ? query.OrderByDescending(x => x.SubmissionDate)
                : query.OrderBy(x => x.SubmissionDate),
            "targetdecisiondate" => isDescending
                ? query.OrderByDescending(x => x.TargetDecisionDate)
                : query.OrderBy(x => x.TargetDecisionDate),
            "status" => isDescending
                ? query.OrderByDescending(x => x.Status)
                : query.OrderBy(x => x.Status),
            _ => query.OrderByDescending(x => x.CreatedAt)
        };
    }

    /// <summary>
    /// Internal projection class used as an intermediate step in the query pipeline.
    /// Allows strongly-typed sorting before the final DTO projection.
    /// </summary>
    private sealed class ApplicationWithOpportunity
    {
        public Guid Id { get; init; }
        public Guid OpportunityId { get; init; }
        public string Description { get; init; } = string.Empty;
        public Domain.Enums.PlanningApplicationType ApplicationType { get; init; }
        public Domain.Enums.PlanningApplicationStatus Status { get; init; }
        public string? ApplicationReference { get; init; }
        public string CouncilName { get; init; } = string.Empty;
        public string? OpportunityName { get; init; }
        public DateTime? SubmissionDate { get; init; }
        public DateTime? TargetDecisionDate { get; init; }
        public DateTime CreatedAt { get; init; }
    }
}
