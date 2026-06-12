using BuildEstate.Application.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace BuildEstate.Infrastructure.Persistence.Services;

/// <summary>
/// Infrastructure implementation of IAuditLogQueryService.
/// Provides read-only access to audit log entries via the BuildEstateDbContext.
/// </summary>
public sealed class AuditLogQueryService : IAuditLogQueryService
{
    private readonly BuildEstateDbContext _context;

    public AuditLogQueryService(BuildEstateDbContext context)
    {
        _context = context;
    }

    public async Task<List<AuditEntryDto>> GetRecentChangesAsync(
        string entityName,
        string affectedColumn,
        int count,
        CancellationToken cancellationToken = default)
    {
        return await _context.AuditLogs
            .AsNoTracking()
            .Where(a => a.EntityName == entityName
                        && a.Action == "Update"
                        && a.AffectedColumns != null
                        && a.AffectedColumns.Contains(affectedColumn))
            .OrderByDescending(a => a.Timestamp)
            .Take(count)
            .Select(a => new AuditEntryDto
            {
                EntityId = a.EntityId,
                OldValues = a.OldValues,
                NewValues = a.NewValues,
                UserName = a.UserName,
                Timestamp = a.Timestamp
            })
            .ToListAsync(cancellationToken);
    }
}
