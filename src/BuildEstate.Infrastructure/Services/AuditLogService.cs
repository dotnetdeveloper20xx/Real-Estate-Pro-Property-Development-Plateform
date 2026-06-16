using BuildEstate.Application.Common;
using BuildEstate.Application.Interfaces;
using BuildEstate.Domain.Entities.UserManagement;
using BuildEstate.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace BuildEstate.Infrastructure.Services;

/// <summary>
/// Provides append-only audit log operations.
/// Creates immutable audit entries and supports paginated querying with filters.
/// No update or delete methods are exposed — audit records are immutable by design.
/// </summary>
public sealed class AuditLogService : IAuditLogService
{
    private readonly BuildEstateDbContext _dbContext;
    private readonly ILogger<AuditLogService> _logger;

    public AuditLogService(
        BuildEstateDbContext dbContext,
        ILogger<AuditLogService> logger)
    {
        _dbContext = dbContext;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task LogAsync(AuditLogEntry entry, CancellationToken ct = default)
    {
        ArgumentNullException.ThrowIfNull(entry);

        // Ensure timestamp is set to UTC now if not already provided
        if (entry.Timestamp == default)
        {
            entry.Timestamp = DateTime.UtcNow;
        }

        // Ensure a unique ID is assigned
        if (entry.Id == Guid.Empty)
        {
            entry.Id = Guid.NewGuid();
        }

        await _dbContext.AuditLogEntries.AddAsync(entry, ct);
        await _dbContext.SaveChangesAsync(ct);

        _logger.LogInformation(
            "Audit log entry created: {Action} by {PerformedByUserId} targeting {TargetEntityType}/{TargetEntityId} [CorrelationId: {CorrelationId}]",
            entry.Action,
            entry.PerformedByUserId,
            entry.TargetEntityType,
            entry.TargetEntityId,
            entry.CorrelationId);
    }

    /// <inheritdoc />
    public async Task<PagedResult<AuditLogEntry>> QueryAsync(
        AuditLogQueryParams queryParams, CancellationToken ct = default)
    {
        ArgumentNullException.ThrowIfNull(queryParams);

        ValidateQueryParams(queryParams);

        var query = _dbContext.AuditLogEntries.AsNoTracking().AsQueryable();

        // Apply action type filter
        if (!string.IsNullOrWhiteSpace(queryParams.ActionType))
        {
            query = query.Where(a => a.Action == queryParams.ActionType);
        }

        // Apply user filter (PerformedByUserId)
        if (!string.IsNullOrWhiteSpace(queryParams.UserId))
        {
            query = query.Where(a => a.PerformedByUserId == queryParams.UserId);
        }

        // Apply date range filter
        if (queryParams.DateRangeStart.HasValue)
        {
            query = query.Where(a => a.Timestamp >= queryParams.DateRangeStart.Value);
        }

        if (queryParams.DateRangeEnd.HasValue)
        {
            query = query.Where(a => a.Timestamp <= queryParams.DateRangeEnd.Value);
        }

        // Order by timestamp descending (most recent first)
        query = query.OrderByDescending(a => a.Timestamp);

        // Get total count for pagination
        var totalCount = await query.CountAsync(ct);

        // Apply pagination
        var pageSize = NormalizePageSize(queryParams.PageSize);
        var page = Math.Max(1, queryParams.Page);
        var skip = (page - 1) * pageSize;

        var items = await query
            .Skip(skip)
            .Take(pageSize)
            .ToListAsync(ct);

        return PagedResult<AuditLogEntry>.Create(items, totalCount, page, pageSize);
    }

    /// <summary>
    /// Validates query parameters for business rule compliance.
    /// </summary>
    private static void ValidateQueryParams(AuditLogQueryParams queryParams)
    {
        // Validate date range span does not exceed 12 months
        if (queryParams.DateRangeStart.HasValue && queryParams.DateRangeEnd.HasValue)
        {
            var span = queryParams.DateRangeEnd.Value - queryParams.DateRangeStart.Value;
            var maxSpan = TimeSpan.FromDays(365); // approximately 12 months

            if (span > maxSpan)
            {
                throw new ArgumentException(
                    $"Date range cannot exceed {AuditLogQueryParams.MaxDateRangeMonths} months. " +
                    $"Requested range spans {span.Days} days.",
                    nameof(queryParams));
            }

            if (queryParams.DateRangeEnd.Value < queryParams.DateRangeStart.Value)
            {
                throw new ArgumentException(
                    "Date range end must be equal to or after the start date.",
                    nameof(queryParams));
            }
        }
    }

    /// <summary>
    /// Normalizes page size to one of the allowed values: 10, 25, 50, 100.
    /// Defaults to 25 if an unsupported page size is provided.
    /// </summary>
    private static int NormalizePageSize(int requestedPageSize)
    {
        return AuditLogQueryParams.AllowedPageSizes.Contains(requestedPageSize)
            ? requestedPageSize
            : 25;
    }
}
