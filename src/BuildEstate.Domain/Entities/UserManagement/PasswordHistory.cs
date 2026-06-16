namespace BuildEstate.Domain.Entities.UserManagement;

/// <summary>
/// Records historical password hashes to enforce password reuse policy.
/// The system checks the last 5 entries to prevent password recycling.
/// </summary>
public class PasswordHistory
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public string UserId { get; set; } = string.Empty;

    /// <summary>
    /// The hashed password value (same format as Identity's password hash).
    /// </summary>
    public string PasswordHash { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
