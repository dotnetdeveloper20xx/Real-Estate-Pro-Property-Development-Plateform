using BuildEstate.Application.Interfaces;
using BuildEstate.Infrastructure.Persistence;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BuildEstate.API.Controllers;

/// <summary>
/// Provides endpoints for managing user notifications.
/// Supports listing notifications, marking as read, and retrieving unread count.
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
    /// Gets the most recent 20 notifications for the current user, ordered by SentAt descending.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetNotifications(CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserId ?? string.Empty;

        var notifications = await _context.Notifications
            .AsNoTracking()
            .Where(n => n.RecipientUserId == userId && !n.IsDeleted)
            .OrderByDescending(n => n.SentAt)
            .Take(20)
            .Select(n => new
            {
                n.Id,
                n.EventType,
                n.Message,
                n.RelatedEntityId,
                n.IsRead,
                n.SentAt
            })
            .ToListAsync(cancellationToken);

        return Ok(new { success = true, data = notifications, errors = Array.Empty<string>() });
    }

    /// <summary>
    /// Marks a specific notification as read.
    /// </summary>
    [HttpPatch("{id:guid}/read")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
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
        notification.UpdatedAt = DateTime.UtcNow;
        notification.UpdatedBy = userId;

        await _context.SaveChangesAsync(cancellationToken);

        return NoContent();
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

        return Ok(new { success = true, data = count, errors = Array.Empty<string>() });
    }
}
