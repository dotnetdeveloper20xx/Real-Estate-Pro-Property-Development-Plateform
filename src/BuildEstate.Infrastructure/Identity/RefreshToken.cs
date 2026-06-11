namespace BuildEstate.Infrastructure.Identity;

public class RefreshToken
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public string UserId { get; set; } = string.Empty;

    public string Token { get; set; } = string.Empty;

    public DateTime ExpiresAt { get; set; }

    public bool IsUsed { get; set; } = false;

    public bool IsRevoked { get; set; } = false;

    public DateTime CreatedAt { get; set; }

    // Navigation property
    public ApplicationUser User { get; set; } = null!;
}
