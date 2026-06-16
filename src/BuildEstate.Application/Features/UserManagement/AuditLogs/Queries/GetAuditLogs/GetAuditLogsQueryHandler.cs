using BuildEstate.Application.Common;
using BuildEstate.Application.Features.UserManagement.AuditLogs.DTOs;
using BuildEstate.Application.Interfaces;
using MediatR;
using Microsoft.Extensions.Logging;

namespace BuildEstate.Application.Features.UserManagement.AuditLogs.Queries.GetAuditLogs;

/// <summary>
/// Handles retrieval of paginated audit log entries by delegating to IAuditLogService.
/// Maps domain AuditLogEntry entities to AuditLogEntryDto for the API layer.
/// </summary>
public sealed class GetAuditLogsQueryHandler
    : IRequestHandler<GetAuditLogsQuery, GetAuditLogsResult>
{
    private readonly IAuditLogService _auditLogService;
    private readonly ILogger<GetAuditLogsQueryHandler> _logger;

    public GetAuditLogsQueryHandler(
        IAuditLogService auditLogService,
        ILogger<GetAuditLogsQueryHandler> logger)
    {
        _auditLogService = auditLogService;
        _logger = logger;
    }

    public async Task<GetAuditLogsResult> Handle(
        GetAuditLogsQuery request,
        CancellationToken cancellationToken)
    {
        var queryParams = new AuditLogQueryParams
        {
            ActionType = request.ActionType,
            UserId = request.UserId,
            DateRangeStart = request.DateRangeStart,
            DateRangeEnd = request.DateRangeEnd,
            Page = request.Page,
            PageSize = request.PageSize
        };

        var pagedEntries = await _auditLogService.QueryAsync(queryParams, cancellationToken);

        // Map domain entries to DTOs
        var dtos = pagedEntries.Items.Select(e => new AuditLogEntryDto
        {
            Id = e.Id,
            Timestamp = e.Timestamp,
            Action = e.Action,
            PerformedByUserName = e.PerformedByUserName,
            TargetUserName = e.TargetUserName,
            Details = e.Details,
            IpAddress = e.IpAddress
        }).ToList();

        var result = PagedResult<AuditLogEntryDto>.Create(
            dtos,
            pagedEntries.TotalCount,
            pagedEntries.PageNumber,
            pagedEntries.PageSize);

        _logger.LogInformation(
            "Audit log query returned {Count} entries (page {Page}/{TotalPages})",
            dtos.Count, result.PageNumber, result.TotalPages);

        return new GetAuditLogsResult { Entries = result };
    }
}
