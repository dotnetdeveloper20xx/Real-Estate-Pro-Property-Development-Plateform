using System.ComponentModel.DataAnnotations;
using BuildEstate.Domain.Entities.UserManagement;
using Microsoft.AspNetCore.Identity;

namespace BuildEstate.Infrastructure.Identity;

/// <summary>
/// Extended Identity user with audit fields, activity tracking, and navigation properties
/// for sessions, refresh tokens, and password history.
/// </summary>
public class ApplicationUser : IdentityUser
{
    [MaxLength(128)]
    public string FirstName { get; set; } = string.Empty;

    [MaxLength(128)]
    public string LastName { get; set; } = string.Empty;

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [MaxLength(450)]
    public string? CreatedBy { get; set; }

    public DateTime? UpdatedAt { get; set; }

    [MaxLength(450)]
    public string? UpdatedBy { get; set; }

    /// <summary>
    /// Timestamp of the user's most recent successful login.
    /// </summary>
    public DateTime? LastLoginAt { get; set; }

    // Navigation properties
    public ICollection<RefreshToken> RefreshTokens { get; set; } = [];
    public ICollection<UserSession> Sessions { get; set; } = [];
    public ICollection<PasswordHistory> PasswordHistories { get; set; } = [];
}
