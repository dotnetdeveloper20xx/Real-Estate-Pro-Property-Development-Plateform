using System.Text.Json;
using BuildEstate.Domain.Common;
using BuildEstate.Infrastructure.Persistence.Entities;
using BuildEstate.Application.Interfaces;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Diagnostics;

namespace BuildEstate.Infrastructure.Persistence.Interceptors;

/// <summary>
/// EF Core SaveChanges interceptor that automatically populates audit columns,
/// converts hard deletes to soft deletes, and writes AuditLog records for every mutation.
/// </summary>
public sealed class AuditInterceptor : SaveChangesInterceptor
{
    private readonly ICurrentUserService _currentUserService;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public AuditInterceptor(
        ICurrentUserService currentUserService,
        IHttpContextAccessor httpContextAccessor)
    {
        _currentUserService = currentUserService;
        _httpContextAccessor = httpContextAccessor;
    }

    /// <summary>
    /// Synchronous SaveChanges is not supported. Use SaveChangesAsync instead.
    /// </summary>
    public override InterceptionResult<int> SavingChanges(
        DbContextEventData eventData,
        InterceptionResult<int> result)
    {
        throw new NotSupportedException(
            "Synchronous SaveChanges is not supported. Use SaveChangesAsync instead.");
    }

    public override ValueTask<InterceptionResult<int>> SavingChangesAsync(
        DbContextEventData eventData,
        InterceptionResult<int> result,
        CancellationToken cancellationToken = default)
    {
        if (eventData.Context is null)
        {
            return base.SavingChangesAsync(eventData, result, cancellationToken);
        }

        var context = eventData.Context;
        var userId = GetCurrentUserId();
        var userName = GetCurrentUserName();
        var utcNow = DateTime.UtcNow;
        var ipAddress = GetIpAddress();
        var correlationId = GetCorrelationId();

        var auditEntries = new List<AuditLog>();

        foreach (var entry in context.ChangeTracker.Entries<BaseEntity>().ToList())
        {
            switch (entry.State)
            {
                case EntityState.Added:
                    ProcessAdded(entry, userId, utcNow);
                    auditEntries.Add(CreateAuditLogForAdded(entry, userId, userName, utcNow, ipAddress, correlationId));
                    break;

                case EntityState.Modified:
                    ProcessModified(entry, userId, utcNow);
                    auditEntries.Add(CreateAuditLogForModified(entry, userId, userName, utcNow, ipAddress, correlationId));
                    break;

                case EntityState.Deleted:
                    ProcessDeleted(entry, userId, utcNow);
                    auditEntries.Add(CreateAuditLogForDeleted(entry, userId, userName, utcNow, ipAddress, correlationId));
                    break;
            }
        }

        // Add audit log entries to the same DbContext (same transaction)
        if (auditEntries.Count > 0)
        {
            context.Set<AuditLog>().AddRange(auditEntries);
        }

        return base.SavingChangesAsync(eventData, result, cancellationToken);
    }

    private static void ProcessAdded(EntityEntry<BaseEntity> entry, string userId, DateTime utcNow)
    {
        entry.Entity.CreatedAt = utcNow;
        entry.Entity.CreatedBy = userId;
    }

    private static void ProcessModified(EntityEntry<BaseEntity> entry, string userId, DateTime utcNow)
    {
        entry.Entity.UpdatedAt = utcNow;
        entry.Entity.UpdatedBy = userId;

        // Do NOT modify CreatedAt or CreatedBy
        entry.Property(nameof(BaseEntity.CreatedAt)).IsModified = false;
        entry.Property(nameof(BaseEntity.CreatedBy)).IsModified = false;
    }

    private static void ProcessDeleted(EntityEntry<BaseEntity> entry, string userId, DateTime utcNow)
    {
        // Convert hard delete to soft delete
        entry.State = EntityState.Modified;
        entry.Entity.IsDeleted = true;
        entry.Entity.DeletedAt = utcNow;
        entry.Entity.DeletedBy = userId;
    }

    private AuditLog CreateAuditLogForAdded(
        EntityEntry<BaseEntity> entry,
        string userId,
        string userName,
        DateTime utcNow,
        string? ipAddress,
        string? correlationId)
    {
        var newValues = SerializeProperties(entry.Properties
            .Where(p => p.CurrentValue != null)
            .ToDictionary(p => p.Metadata.Name, p => p.CurrentValue));

        return new AuditLog
        {
            UserId = userId,
            UserName = userName,
            Action = "Create",
            EntityName = entry.Entity.GetType().Name,
            EntityId = entry.Entity.Id.ToString(),
            OldValues = null,
            NewValues = newValues,
            AffectedColumns = null,
            Timestamp = utcNow,
            IpAddress = ipAddress,
            CorrelationId = correlationId
        };
    }

    private AuditLog CreateAuditLogForModified(
        EntityEntry<BaseEntity> entry,
        string userId,
        string userName,
        DateTime utcNow,
        string? ipAddress,
        string? correlationId)
    {
        var modifiedProperties = entry.Properties
            .Where(p => p.IsModified)
            .ToList();

        var oldValues = SerializeProperties(
            modifiedProperties.ToDictionary(p => p.Metadata.Name, p => p.OriginalValue));

        var newValues = SerializeProperties(
            modifiedProperties.ToDictionary(p => p.Metadata.Name, p => p.CurrentValue));

        var affectedColumns = string.Join(",",
            modifiedProperties.Select(p => p.Metadata.Name));

        return new AuditLog
        {
            UserId = userId,
            UserName = userName,
            Action = "Update",
            EntityName = entry.Entity.GetType().Name,
            EntityId = entry.Entity.Id.ToString(),
            OldValues = oldValues,
            NewValues = newValues,
            AffectedColumns = affectedColumns,
            Timestamp = utcNow,
            IpAddress = ipAddress,
            CorrelationId = correlationId
        };
    }

    private AuditLog CreateAuditLogForDeleted(
        EntityEntry<BaseEntity> entry,
        string userId,
        string userName,
        DateTime utcNow,
        string? ipAddress,
        string? correlationId)
    {
        var oldValues = SerializeProperties(entry.Properties
            .Where(p => p.OriginalValue != null)
            .ToDictionary(p => p.Metadata.Name, p => p.OriginalValue));

        return new AuditLog
        {
            UserId = userId,
            UserName = userName,
            Action = "Delete",
            EntityName = entry.Entity.GetType().Name,
            EntityId = entry.Entity.Id.ToString(),
            OldValues = oldValues,
            NewValues = null,
            AffectedColumns = null,
            Timestamp = utcNow,
            IpAddress = ipAddress,
            CorrelationId = correlationId
        };
    }

    private string GetCurrentUserId()
    {
        var userId = _currentUserService.UserId;
        return string.IsNullOrEmpty(userId) ? "System" : userId;
    }

    private string GetCurrentUserName()
    {
        var userName = _currentUserService.UserName;
        return string.IsNullOrEmpty(userName) ? "System" : userName;
    }

    private string? GetIpAddress()
    {
        return _httpContextAccessor.HttpContext?.Connection.RemoteIpAddress?.ToString();
    }

    private string? GetCorrelationId()
    {
        if (_httpContextAccessor.HttpContext?.Items.TryGetValue("CorrelationId", out var correlationId) == true)
        {
            return correlationId?.ToString();
        }

        return null;
    }

    private static string? SerializeProperties(Dictionary<string, object?> properties)
    {
        if (properties.Count == 0)
        {
            return null;
        }

        return JsonSerializer.Serialize(properties, new JsonSerializerOptions
        {
            WriteIndented = false
        });
    }
}
