using BuildEstate.Application.Common;
using BuildEstate.Application.Features.LegalCompliance.AuditTrail.DTOs;
using MediatR;

namespace BuildEstate.Application.Features.LegalCompliance.AuditTrail.Queries.GetAuditHistory;

/// <summary>
/// Handles retrieval of paginated, filtered audit trail history.
/// Delegates to IAuditTrailQueryService which provides read-only access to the AuditLogs table.
/// Uses AsNoTracking for optimised read-only performance.
/// </summary>
public sealed class GetAuditHistoryQueryHandler
    : IRequestHandler<GetAuditHistoryQuery, PagedResult<AuditHistoryDto>>
{
    private readonly IAuditTrailQueryService _auditTrailQueryService;

    public GetAuditHistoryQueryHandler(IAuditTrailQueryService auditTrailQueryService)
    {
        _auditTrailQueryService = auditTrailQueryService;
    }

    public async Task<PagedResult<AuditHistoryDto>> Handle(
        GetAuditHistoryQuery request,
        CancellationToken cancellationToken)
    {
        var pageNumber = request.PageNumber < 1 ? 1 : request.PageNumber;
        var pageSize = request.PageSize < 1 ? 20 : Math.Min(request.PageSize, 100);

        return await _auditTrailQueryService.GetAuditHistoryAsync(
            request.Action,
            request.EntityName,
            request.UserId,
            request.EntityId,
            request.FromDate,
            request.ToDate,
            pageNumber,
            pageSize,
            cancellationToken);
    }
}
