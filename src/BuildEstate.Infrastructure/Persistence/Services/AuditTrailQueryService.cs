using BuildEstate.Application.Common;
using BuildEstate.Application.Features.LegalCompliance.AuditTrail;
using BuildEstate.Application.Features.LegalCompliance.AuditTrail.DTOs;
using Microsoft.EntityFrameworkCore;

namespace BuildEstate.Infrastructure.Persistence.Services;

/// <summary>
/// Infrastructure implementation of IAuditTrailQueryService.
/// Provides read-only access to audit log entries via the BuildEstateDbContext.
/// All queries use AsNoTracking for optimised read-only performance.
/// </summary>
public sealed class AuditTrailQueryService : IAuditTrailQueryService
{
    private readonly BuildEstateDbContext _context;

    public AuditTrailQueryService(BuildEstateDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResult<AuditHistoryDto>> GetAuditHistoryAsync(
        string? action,
        string? entityName,
        string? userId,
        string? entityId,
        DateTime? fromDate,
        DateTime? toDate,
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        var query = _context.AuditLogs.AsNoTracking().AsQueryable();

        // Apply filters
        if (!string.IsNullOrWhiteSpace(action))
        {
            query = query.Where(a => a.Action == action);
        }

        if (!string.IsNullOrWhiteSpace(entityName))
        {
            query = query.Where(a => a.EntityName == entityName);
        }

        if (!string.IsNullOrWhiteSpace(userId))
        {
            query = query.Where(a => a.UserId == userId);
        }

        if (!string.IsNullOrWhiteSpace(entityId))
        {
            query = query.Where(a => a.EntityId == entityId);
        }

        if (fromDate.HasValue)
        {
            query = query.Where(a => a.Timestamp >= fromDate.Value);
        }

        if (toDate.HasValue)
        {
            query = query.Where(a => a.Timestamp <= toDate.Value);
        }

        // Get total count before pagination
        var totalCount = await query.CountAsync(cancellationToken);

        // Order by timestamp descending (newest first)
        var items = await query
            .OrderByDescending(a => a.Timestamp)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(a => new AuditHistoryDto
            {
                Id = a.Id,
                UserId = a.UserId,
                UserName = a.UserName,
                Action = a.Action,
                EntityName = a.EntityName,
                EntityId = a.EntityId,
                OldValues = a.OldValues,
                NewValues = a.NewValues,
                AffectedColumns = a.AffectedColumns,
                Timestamp = a.Timestamp,
                IpAddress = a.IpAddress,
                CorrelationId = a.CorrelationId
            })
            .ToListAsync(cancellationToken);

        return PagedResult<AuditHistoryDto>.Create(items, totalCount, pageNumber, pageSize);
    }

    public async Task<List<AuditExportDto>> GetAuditTrailForExportAsync(
        string? entityName,
        DateTime fromDate,
        DateTime toDate,
        CancellationToken cancellationToken = default)
    {
        var query = _context.AuditLogs
            .AsNoTracking()
            .Where(a => a.Timestamp >= fromDate && a.Timestamp <= toDate);

        if (!string.IsNullOrWhiteSpace(entityName))
        {
            query = query.Where(a => a.EntityName == entityName);
        }

        return await query
            .OrderBy(a => a.Timestamp)
            .Select(a => new AuditExportDto
            {
                Id = a.Id,
                UserId = a.UserId,
                UserName = a.UserName,
                Action = a.Action,
                EntityName = a.EntityName,
                EntityId = a.EntityId,
                OldValues = a.OldValues,
                NewValues = a.NewValues,
                AffectedColumns = a.AffectedColumns,
                Timestamp = a.Timestamp,
                IpAddress = a.IpAddress,
                CorrelationId = a.CorrelationId
            })
            .ToListAsync(cancellationToken);
    }
}
