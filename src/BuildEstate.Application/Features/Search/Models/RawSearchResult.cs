namespace BuildEstate.Application.Features.Search.Models;

/// <summary>
/// A single raw result from a search provider before scoring is applied.
/// Contains all searchable fields with their weights for the scoring service.
/// </summary>
public class RawSearchResult
{
    /// <summary>The unique identifier of the matched entity.</summary>
    public Guid EntityId { get; set; }

    /// <summary>The entity type name (e.g., "LandOpportunity").</summary>
    public string EntityType { get; set; } = string.Empty;

    /// <summary>The display title of the result.</summary>
    public string Title { get; set; } = string.Empty;

    /// <summary>The display subtitle / secondary information.</summary>
    public string Subtitle { get; set; } = string.Empty;

    /// <summary>Optional status value for display.</summary>
    public string? Status { get; set; }

    /// <summary>Optional status colour variant (e.g., "success", "warning").</summary>
    public string? StatusVariant { get; set; }

    /// <summary>Material Symbols Outlined icon name.</summary>
    public string Icon { get; set; } = string.Empty;

    /// <summary>Category name for grouping.</summary>
    public string Category { get; set; } = string.Empty;

    /// <summary>Module badge text.</summary>
    public string ModuleBadge { get; set; } = string.Empty;

    /// <summary>Navigation route to the entity detail page.</summary>
    public string NavigationRoute { get; set; } = string.Empty;

    /// <summary>Last modification timestamp.</summary>
    public DateTime ModifiedAt { get; set; }

    /// <summary>Optional breadcrumb context.</summary>
    public string? Breadcrumb { get; set; }

    /// <summary>User ID who created this entity.</summary>
    public string? CreatedBy { get; set; }

    /// <summary>Department associated with this entity.</summary>
    public string? Department { get; set; }

    /// <summary>View count for popularity boost.</summary>
    public int ViewCount { get; set; }

    /// <summary>
    /// Searchable fields with their values and weights for scoring.
    /// Key = field name, Value = (fieldValue, weight).
    /// </summary>
    public IReadOnlyList<SearchableField> SearchableFields { get; set; } = [];

    /// <summary>Quick actions available for this result.</summary>
    public IReadOnlyList<SearchQuickAction> QuickActions { get; set; } = [];
}

/// <summary>
/// Represents a single searchable field with its text value and scoring weight.
/// </summary>
public class SearchableField
{
    /// <summary>The name of the field.</summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>The text value of the field to match against.</summary>
    public string Value { get; set; } = string.Empty;

    /// <summary>The weight multiplier for scoring (e.g., 2.0 for names, 1.0 for status).</summary>
    public double Weight { get; set; } = 1.0;
}

/// <summary>
/// Represents a quick action available on a search result.
/// </summary>
public class SearchQuickAction
{
    public string Label { get; set; } = string.Empty;
    public string Icon { get; set; } = string.Empty;
    public string? Route { get; set; }
    public string? Action { get; set; }
    public string? Permission { get; set; }
}
