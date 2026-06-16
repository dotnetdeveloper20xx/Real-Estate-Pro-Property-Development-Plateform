using BuildEstate.Application.Common;
using BuildEstate.Application.Features.UserManagement.Users.DTOs;
using BuildEstate.Application.Features.UserManagement.Users.Queries.GetUsers;
using BuildEstate.Application.Interfaces;
using BuildEstate.Infrastructure.Identity;
using BuildEstate.Infrastructure.Persistence;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace BuildEstate.Infrastructure.Services;

/// <summary>
/// Provides paginated, searchable, and filterable user queries.
/// Uses ASP.NET Identity's UserManager for user data and role lookup,
/// and the DbContext for session, password history, and audit log queries.
/// </summary>
public sealed class UserQueryService : IUserQueryService
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly BuildEstateDbContext _dbContext;

    public UserQueryService(
        UserManager<ApplicationUser> userManager,
        BuildEstateDbContext dbContext)
    {
        _userManager = userManager;
        _dbContext = dbContext;
    }

    /// <inheritdoc />
    public async Task<PagedResult<UserListItemDto>> GetUsersAsync(
        int page,
        int pageSize,
        string? searchTerm,
        UserStatusFilter statusFilter,
        CancellationToken ct = default)
    {
        var query = _userManager.Users.AsNoTracking();

        // Apply status filter
        query = ApplyStatusFilter(query, statusFilter);

        // Apply case-insensitive search across FirstName, LastName, Email
        query = ApplySearch(query, searchTerm);

        // Get total count before pagination
        var totalCount = await query.CountAsync(ct);

        // Apply ordering (by LastName, then FirstName for consistent results)
        query = query.OrderBy(u => u.LastName).ThenBy(u => u.FirstName);

        // Apply pagination
        var users = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        // Project to DTOs with roles
        var items = new List<UserListItemDto>(users.Count);
        foreach (var user in users)
        {
            var roles = await _userManager.GetRolesAsync(user);
            items.Add(new UserListItemDto
            {
                Id = user.Id,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Email = user.Email ?? string.Empty,
                Roles = roles.ToArray(),
                IsActive = user.IsActive,
                LastLoginAt = user.LastLoginAt
            });
        }

        return PagedResult<UserListItemDto>.Create(items, totalCount, page, pageSize);
    }

    /// <inheritdoc />
    public async Task<UserDetailDto?> GetUserByIdAsync(string userId, CancellationToken ct = default)
    {
        var user = await _userManager.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == userId, ct);

        if (user is null)
        {
            return null;
        }

        var roles = await _userManager.GetRolesAsync(user);

        // Get last password change date from history
        var passwordLastChanged = await _dbContext.PasswordHistories
            .Where(ph => ph.UserId == userId)
            .OrderByDescending(ph => ph.CreatedAt)
            .Select(ph => (DateTime?)ph.CreatedAt)
            .FirstOrDefaultAsync(ct);

        // Get last audit activity for this user
        var lastAuditActivity = await _dbContext.AuditLogEntries
            .Where(a => a.PerformedByUserId == userId)
            .OrderByDescending(a => a.Timestamp)
            .Select(a => (DateTime?)a.Timestamp)
            .FirstOrDefaultAsync(ct);

        // Get active sessions (non-revoked, non-expired)
        var sessions = await _dbContext.UserSessions
            .Where(s => s.UserId == userId && !s.IsRevoked && s.ExpiresAt > DateTime.UtcNow)
            .OrderByDescending(s => s.LastActiveAt)
            .Select(s => new UserSessionDto
            {
                Id = s.Id,
                DeviceInfo = s.DeviceInfo,
                Browser = s.Browser,
                OperatingSystem = s.OperatingSystem,
                IpAddress = s.IpAddress,
                City = s.City,
                Country = s.Country,
                LastActiveAt = s.LastActiveAt,
                IsRevoked = s.IsRevoked,
                CreatedAt = s.CreatedAt
            })
            .ToListAsync(ct);

        return new UserDetailDto
        {
            Id = user.Id,
            FirstName = user.FirstName,
            LastName = user.LastName,
            Email = user.Email ?? string.Empty,
            IsActive = user.IsActive,
            CreatedAt = user.CreatedAt,
            Roles = roles.ToArray(),
            LastLoginAt = user.LastLoginAt,
            PasswordLastChangedAt = passwordLastChanged,
            FailedLoginAttempts = user.AccessFailedCount,
            LastAuditActivity = lastAuditActivity,
            Sessions = sessions.ToArray()
        };
    }

    private static IQueryable<ApplicationUser> ApplyStatusFilter(
        IQueryable<ApplicationUser> query,
        UserStatusFilter statusFilter)
    {
        return statusFilter switch
        {
            UserStatusFilter.Active => query.Where(u => u.IsActive),
            UserStatusFilter.Inactive => query.Where(u => !u.IsActive),
            _ => query // All — no filter
        };
    }

    private static IQueryable<ApplicationUser> ApplySearch(
        IQueryable<ApplicationUser> query,
        string? searchTerm)
    {
        if (string.IsNullOrWhiteSpace(searchTerm))
        {
            return query;
        }

        var term = searchTerm.Trim().ToLower();

        return query.Where(u =>
            u.FirstName.ToLower().Contains(term) ||
            u.LastName.ToLower().Contains(term) ||
            (u.Email != null && u.Email.ToLower().Contains(term)));
    }
}
