namespace BuildEstate.Application.Features.Search.Models;

/// <summary>
/// Contextual information used by the scoring service to apply boost rules
/// (recently viewed, user department, etc.).
/// </summary>
public class SearchBoostContext
{
    /// <summary>The current authenticated user's ID.</summary>
    public string CurrentUserId { get; set; } = string.Empty;

    /// <summary>The current user's department.</summary>
    public string? UserDepartment { get; set; }

    /// <summary>Entity IDs recently viewed by the current user (within last 30 days).</summary>
    public IReadOnlySet<Guid> RecentlyViewedIds { get; set; } = new HashSet<Guid>();

    /// <summary>Entity IDs frequently accessed (10+ views within last 30 days).</summary>
    public IReadOnlySet<Guid> FrequentlyAccessedIds { get; set; } = new HashSet<Guid>();
}
