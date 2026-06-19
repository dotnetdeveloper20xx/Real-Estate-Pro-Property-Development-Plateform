using BuildEstate.Application.Interfaces;
using BuildEstate.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BuildEstate.API.Controllers;

/// <summary>
/// Provides endpoints for managing user notifications.
/// Supports listing notifications, marking as read, retrieving unread count,
/// and admin-level access to all notifications (history).
/// </summary>
[Route("api/v1/notifications")]
public class NotificationsController : BaseApiController
{
    private readonly BuildEstateDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public NotificationsController(
        BuildEstateDbContext context,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    /// <summary>
    /// Gets the most recent notifications for the current user.
    /// Returns data shaped for the NotificationPanelComponent frontend.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetNotifications(
        [FromQuery] int limit = 20,
        CancellationToken cancellationToken = default)
    {
        var userId = _currentUserService.UserId ?? string.Empty;

        var notifications = await _context.Notifications
            .AsNoTracking()
            .Where(n => n.RecipientUserId == userId && !n.IsDeleted)
            .OrderByDescending(n => n.SentAt)
            .Take(limit)
            .Select(n => new
            {
                id = n.Id.ToString(),
                eventType = n.EventType,
                title = string.IsNullOrEmpty(n.Title) ? n.EventType : n.Title,
                description = n.Message,
                entityId = n.RelatedEntityId.HasValue ? n.RelatedEntityId.Value.ToString() : "",
                entityType = n.RelatedEntityType ?? "",
                isRead = n.IsRead,
                createdAt = n.SentAt.ToString("o")
            })
            .ToListAsync(cancellationToken);

        return Ok(new { success = true, data = notifications, errors = Array.Empty<string>() });
    }

    /// <summary>
    /// Marks a specific notification as read.
    /// </summary>
    [HttpPatch("{id:guid}/read")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> MarkAsRead(Guid id, CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserId ?? string.Empty;

        var notification = await _context.Notifications
            .FirstOrDefaultAsync(n => n.Id == id && n.RecipientUserId == userId && !n.IsDeleted, cancellationToken);

        if (notification is null)
        {
            return NotFound();
        }

        notification.IsRead = true;
        notification.ReadAt = DateTime.UtcNow;
        notification.UpdatedAt = DateTime.UtcNow;
        notification.UpdatedBy = userId;

        await _context.SaveChangesAsync(cancellationToken);

        return Ok(new { success = true, data = (object?)null, errors = Array.Empty<string>() });
    }

    /// <summary>
    /// Gets the count of unread notifications for the current user.
    /// </summary>
    [HttpGet("unread-count")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetUnreadCount(CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserId ?? string.Empty;

        var count = await _context.Notifications
            .AsNoTracking()
            .CountAsync(n => n.RecipientUserId == userId && !n.IsRead && !n.IsDeleted, cancellationToken);

        return Ok(new { success = true, data = new { count }, errors = Array.Empty<string>() });
    }

    /// <summary>
    /// Admin endpoint: Gets all notifications across all users with filtering and pagination.
    /// </summary>
    [HttpGet("all")]
    [Authorize(Roles = "SuperAdmin")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAllNotifications(
        [FromQuery] string? module,
        [FromQuery] string? eventType,
        [FromQuery] string? recipientUserId,
        [FromQuery] bool? isRead,
        [FromQuery] DateTime? startDate,
        [FromQuery] DateTime? endDate,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 25,
        CancellationToken cancellationToken = default)
    {
        var query = _context.Notifications
            .AsNoTracking()
            .Where(n => !n.IsDeleted);

        if (!string.IsNullOrWhiteSpace(module))
            query = query.Where(n => n.Module == module);

        if (!string.IsNullOrWhiteSpace(eventType))
            query = query.Where(n => n.EventType == eventType);

        if (!string.IsNullOrWhiteSpace(recipientUserId))
            query = query.Where(n => n.RecipientUserId == recipientUserId);

        if (isRead.HasValue)
            query = query.Where(n => n.IsRead == isRead.Value);

        if (startDate.HasValue)
            query = query.Where(n => n.SentAt >= startDate.Value);

        if (endDate.HasValue)
            query = query.Where(n => n.SentAt <= endDate.Value.AddDays(1));

        var totalCount = await query.CountAsync(cancellationToken);
        var totalPages = (int)Math.Ceiling((double)totalCount / pageSize);

        var notifications = await query
            .OrderByDescending(n => n.SentAt)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(n => new
            {
                n.Id,
                n.RecipientUserId,
                recipientName = n.RecipientUserId, // In a real system we'd join to Users table
                n.EventType,
                n.Module,
                title = string.IsNullOrEmpty(n.Title) ? n.EventType : n.Title,
                message = n.Message,
                n.Severity,
                n.Priority,
                n.IsRead,
                n.Channel,
                n.DeliveryStatus,
                sentAt = n.SentAt.ToString("o"),
                createdAt = n.CreatedAt.ToString("o")
            })
            .ToListAsync(cancellationToken);

        return Ok(new
        {
            success = true,
            data = notifications,
            errors = Array.Empty<string>(),
            pagination = new
            {
                pageNumber,
                pageSize,
                totalCount,
                totalPages
            }
        });
    }
}
