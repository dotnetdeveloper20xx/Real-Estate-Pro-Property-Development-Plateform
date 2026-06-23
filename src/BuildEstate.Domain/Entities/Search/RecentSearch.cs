using BuildEstate.Domain.Common;

namespace BuildEstate.Domain.Entities.Search;

/// <summary>
/// Represents a previously executed search query stored for the user's recent searches history.
/// </summary>
public class RecentSearch : BaseEntity
{
    public string UserId { get; set; } = string.Empty;
    public string Query { get; set; } = string.Empty;
    public int ResultCount { get; set; }
    public DateTime SearchedAt { get; set; }
}
