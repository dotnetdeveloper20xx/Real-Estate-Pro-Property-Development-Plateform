using BuildEstate.Application.Common;
using BuildEstate.Application.Features.UserManagement.Users.DTOs;
using BuildEstate.Application.Features.UserManagement.Users.Queries.GetUsers;

namespace BuildEstate.Application.Interfaces;

/// <summary>
/// Abstracts user query operations for the Application layer.
/// Enables paginated, searchable, and filterable user listing
/// without direct dependency on Infrastructure Identity types.
/// </summary>
public interface IUserQueryService
{
    /// <summary>
    /// Retrieves a paginated list of users with optional search and status filtering.
    /// Search is case-insensitive across FirstName, LastName, and Email.
    /// Each user includes their assigned roles as a string array.
    /// </summary>
    /// <param name="page">1-based page number.</param>
    /// <param name="pageSize">Number of items per page (10, 25, or 50).</param>
    /// <param name="searchTerm">Optional case-insensitive search term.</param>
    /// <param name="statusFilter">Status filter (All, Active, Inactive).</param>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>Paginated result of user list items with roles.</returns>
    Task<PagedResult<UserListItemDto>> GetUsersAsync(
        int page,
        int pageSize,
        string? searchTerm,
        UserStatusFilter statusFilter,
        CancellationToken ct = default);

    /// <summary>
    /// Retrieves full user detail information by ID including security summary,
    /// active sessions, and assigned roles. Returns null if the user is not found.
    /// </summary>
    /// <param name="userId">The unique identifier of the user to retrieve.</param>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>A <see cref="UserDetailDto"/> with full detail, or null if not found.</returns>
    Task<UserDetailDto?> GetUserByIdAsync(string userId, CancellationToken ct = default);
}
