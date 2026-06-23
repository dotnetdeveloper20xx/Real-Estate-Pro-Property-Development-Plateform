# Search Provider Template

## Purpose

This template provides everything a developer needs to create a new search provider for BuildEstate Pro's Global Search infrastructure. Copy, fill in the blanks, register, and test.

---

## 1. C# Search Provider Template

Copy this file and replace all `{PLACEHOLDER}` values with your entity's specifics.

```csharp
// File: src/BuildEstate.Application/Features/{ModuleName}/Search/{EntityName}SearchProvider.cs

using System.Security.Claims;
using BuildEstate.Application.Common.Interfaces;
using BuildEstate.Application.Common.Models.Search;
using BuildEstate.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace BuildEstate.Application.Features.{ModuleName}.Search;

/// <summary>
/// Search provider for {EntityDisplayName} entities.
/// Implements the global search contract for the {ModuleName} module.
/// </summary>
public class {EntityName}SearchProvider : ISearchProvider
{
    private readonly ApplicationDbContext _context;

    public {EntityName}SearchProvider(ApplicationDbContext context)
    {
        _context = context;
    }

    // ─── Required Metadata ───────────────────────────────────────────────────

    public string ModuleId => "{module-id}";           // e.g., "land-acquisition"
    public string EntityName => "{EntityDisplayName}"; // e.g., "Land Opportunity"
    public string CategoryName => "{CategoryName}";    // e.g., "Land Acquisition"
    public string Icon => "{icon_name}";               // e.g., "landscape" (Material Symbols Outlined)
    public int Priority => {priority};                 // 1 = highest, 10 = lowest

    // ─── Search Implementation ───────────────────────────────────────────────

    public async Task<SearchProviderResult> SearchAsync(
        SearchRequest request,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        // Step 1: Apply permission filtering
        var query = _context.{DbSetName}
            .AsNoTracking()
            .Where(e => !e.IsDeleted);

        // Step 2: Apply permission-based filtering
        // Replace with your module's permission logic
        var userId = user.FindFirstValue(ClaimTypes.NameIdentifier);
        // Example: Filter by user's department, role, or ownership
        // query = query.Where(e => e.CreatedBy == userId || user.IsInRole("SuperAdmin"));

        // Step 3: Apply search text matching
        if (!string.IsNullOrWhiteSpace(request.Query))
        {
            var searchTerm = request.Query.ToLower().Trim();
            var tokens = searchTerm.Split(' ', StringSplitOptions.RemoveEmptyEntries);

            query = query.Where(e =>
                // Primary fields (weight 2.0+)
                e.{PrimaryField1}.ToLower().Contains(searchTerm) ||
                // Secondary fields (weight 1.0-1.5)
                e.{SecondaryField1}.ToLower().Contains(searchTerm) ||
                // Supplementary fields (weight 0.5-0.8)
                (e.{SupplementaryField1} != null && e.{SupplementaryField1}!.ToLower().Contains(searchTerm))
            );
        }

        // Step 4: Get total count for this category
        var totalCount = await query.CountAsync(cancellationToken);

        // Step 5: Apply pagination and project to search results
        var results = await query
            .OrderByDescending(e => e.UpdatedAt ?? e.CreatedAt)
            .Skip(request.Skip)
            .Take(request.Take)
            .Select(e => new SearchResultItem
            {
                Id = e.Id.ToString(),
                Title = e.{TitleField},
                Subtitle = e.{SubtitleField},
                Status = e.{StatusField}.ToString(),
                Description = e.{DescriptionField},
                Icon = Icon,
                Category = CategoryName,
                EntityType = EntityName,
                NavigationRoute = $"/{ModuleId}/{route-segment}/{e.Id}",
                Timestamp = e.UpdatedAt ?? e.CreatedAt,
                RelevancyScore = CalculateRelevancy(e, request.Query)
            })
            .ToListAsync(cancellationToken);

        return new SearchProviderResult
        {
            Results = results,
            TotalCount = totalCount,
            ModuleId = ModuleId,
            CategoryName = CategoryName
        };
    }

    public async Task<int> CountAsync(
        string query,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        var dbQuery = _context.{DbSetName}
            .AsNoTracking()
            .Where(e => !e.IsDeleted);

        // Apply same permission filtering as SearchAsync
        // ...

        if (!string.IsNullOrWhiteSpace(query))
        {
            var searchTerm = query.ToLower().Trim();
            dbQuery = dbQuery.Where(e =>
                e.{PrimaryField1}.ToLower().Contains(searchTerm) ||
                e.{SecondaryField1}.ToLower().Contains(searchTerm)
            );
        }

        return await dbQuery.CountAsync(cancellationToken);
    }

    // ─── Relevancy Scoring ───────────────────────────────────────────────────

    private double CalculateRelevancy({EntityClass} entity, string? query)
    {
        if (string.IsNullOrWhiteSpace(query)) return 0;

        double score = 0;
        var term = query.ToLower().Trim();

        // Primary field — weight {PrimaryWeight}
        if (!string.IsNullOrEmpty(entity.{PrimaryField1}))
        {
            var field = entity.{PrimaryField1}.ToLower();
            if (field == term) score += 5.0 * {PrimaryWeight};
            else if (field.StartsWith(term)) score += 3.0 * {PrimaryWeight};
            else if (field.Contains(term)) score += 1.5 * {PrimaryWeight};
        }

        // Secondary field — weight {SecondaryWeight}
        if (!string.IsNullOrEmpty(entity.{SecondaryField1}))
        {
            var field = entity.{SecondaryField1}.ToLower();
            if (field == term) score += 5.0 * {SecondaryWeight};
            else if (field.StartsWith(term)) score += 3.0 * {SecondaryWeight};
            else if (field.Contains(term)) score += 1.5 * {SecondaryWeight};
        }

        // Supplementary field — weight {SupplementaryWeight}
        if (!string.IsNullOrEmpty(entity.{SupplementaryField1}))
        {
            var field = entity.{SupplementaryField1}.ToLower();
            if (field.Contains(term)) score += 1.5 * {SupplementaryWeight};
        }

        return score;
    }
}
```

---

## 2. Required Fields to Declare

Every search provider MUST declare the following metadata properties:

| Property | Type | Description | Example |
|----------|------|-------------|---------|
| `ModuleId` | `string` | Kebab-case module identifier | `"land-acquisition"` |
| `EntityName` | `string` | Human-readable entity name (singular) | `"Land Opportunity"` |
| `CategoryName` | `string` | Tab/group name in search results | `"Land Acquisition"` |
| `Icon` | `string` | Material Symbols Outlined icon name | `"landscape"` |
| `Priority` | `int` | Sort order within category (1 = highest) | `1` |

### Icon Selection Guide

| Domain | Suggested Icons |
|--------|----------------|
| Land / Property | `landscape`, `terrain`, `real_estate_agent`, `location_on` |
| Planning | `assignment`, `checklist`, `pending_actions` |
| Legal | `gavel`, `verified`, `policy`, `description` |
| Finance | `account_balance`, `payments`, `receipt_long` |
| Construction | `construction`, `engineering`, `build` |
| Users / People | `person`, `group`, `admin_panel_settings` |
| Documents | `article`, `folder_open`, `attach_file` |
| Sales | `storefront`, `point_of_sale`, `shopping_cart` |
| Projects | `engineering`, `timeline`, `task_alt` |

---

## 3. Permission Pattern Example

```csharp
// Permission filtering must happen BEFORE returning results.
// Never return entities the user cannot access.

public async Task<SearchProviderResult> SearchAsync(
    SearchRequest request,
    ClaimsPrincipal user,
    CancellationToken cancellationToken)
{
    var query = _context.LandOpportunities
        .AsNoTracking()
        .Where(e => !e.IsDeleted);

    // Option A: Role-based filtering
    if (!user.IsInRole("SuperAdmin") && !user.IsInRole("AcquisitionManager"))
    {
        // Non-privileged users only see their own entities
        var userId = user.FindFirstValue(ClaimTypes.NameIdentifier);
        query = query.Where(e => e.CreatedBy == userId);
    }

    // Option B: Department-based filtering
    var department = user.FindFirstValue("department");
    if (!string.IsNullOrEmpty(department))
    {
        query = query.Where(e => e.Department == department);
    }

    // Option C: Policy-based (use IAuthorizationService)
    // For complex scenarios, inject IAuthorizationService and check per-entity

    // ... rest of search logic
}
```

---

## 4. Field Weight Guidance

| Weight | Category | Use For | Examples |
|--------|----------|---------|----------|
| 3.0 | Critical Identifier | Unique reference numbers users memorize | `ReferenceNumber`, `CaseRef`, `RegistryRef` |
| 2.5 | Primary Identifier | Entity's main searchable name | `Name`, `Title`, `FullName` |
| 2.0 | Strong Identifier | Important distinguishing fields | `Email`, `Location`, `SiteName` |
| 1.5 | Important Context | Fields users commonly filter by | `LocalAuthority`, `Type`, `Category`, `Tags` |
| 1.0 | Standard | Regular searchable content | `Status`, `Description`, `ContactDetails` |
| 0.8 | Supporting | Useful but not primary search targets | `Source`, `Notes`, `Comments` |
| 0.5 | Supplementary | Rarely searched directly | `Currency`, `PurchasePrice`, `Amount` |
| 0.3 | Low Priority | Almost never text-searched | `CreatedAt`, `DueDate` |

### Rules:
- Every entity MUST have at least one field with weight ≥ 2.0
- Total weighted fields should not exceed 8 per entity
- Field weights must be justified in the PR description

---

## 5. Navigation Route Pattern

The `NavigationRoute` must resolve to a valid Angular route that displays the entity detail.

```csharp
// Pattern: /{module-path}/{entity-segment}/{id}
NavigationRoute = $"/land-acquisition/opportunities/{entity.Id}"

// For nested entities (accessed via parent detail page):
NavigationRoute = $"/land-acquisition/opportunities/{entity.OpportunityId}?tab=due-diligence&highlight={entity.Id}"

// For admin entities:
NavigationRoute = $"/admin/users/{entity.Id}"
```

### Route Naming Convention:
- Module path: kebab-case module name from `app.routes.ts`
- Entity segment: plural kebab-case entity name
- ID: GUID of the entity

---

## 6. Quick Actions Pattern

Quick actions appear on hover/focus of search result cards. Define relevant actions per entity type:

```csharp
// In your search result mapping:
QuickActions = new List<QuickAction>
{
    new QuickAction
    {
        Label = "View",
        Icon = "visibility",
        Route = $"/land-acquisition/opportunities/{entity.Id}",
        Permission = "Opportunities.Read"
    },
    new QuickAction
    {
        Label = "Edit",
        Icon = "edit",
        Route = $"/land-acquisition/opportunities/{entity.Id}/edit",
        Permission = "Opportunities.Write"
    },
    new QuickAction
    {
        Label = "Copy Link",
        Icon = "content_copy",
        Action = "copyLink"  // Handled by frontend
    }
}
```

### Standard Quick Actions (Include These By Default):

| Action | Icon | Permission Required | Notes |
|--------|------|-------------------|-------|
| View | `visibility` | `{Entity}.Read` | Always include |
| Edit | `edit` | `{Entity}.Write` | Include if edit route exists |
| Copy Link | `content_copy` | None | Frontend clipboard action |
| Delete | `delete` | `{Entity}.Delete` | Only for entities with direct delete |

---

## 7. DI Registration Example

Register your search provider in the module's dependency injection configuration:

```csharp
// File: src/BuildEstate.Infrastructure/DependencyInjection/{ModuleName}ServiceRegistration.cs
// OR: src/BuildEstate.Application/Features/{ModuleName}/DependencyInjection.cs

using Microsoft.Extensions.DependencyInjection;
using BuildEstate.Application.Features.{ModuleName}.Search;

public static class {ModuleName}ServiceRegistration
{
    public static IServiceCollection Add{ModuleName}Services(this IServiceCollection services)
    {
        // Register search provider(s) for this module
        services.AddScoped<ISearchProvider, {EntityName}SearchProvider>();

        // If module has multiple searchable entities, register all:
        // services.AddScoped<ISearchProvider, LandOpportunitySearchProvider>();
        // services.AddScoped<ISearchProvider, LandOwnerSearchProvider>();
        // services.AddScoped<ISearchProvider, DueDiligenceSearchProvider>();

        return services;
    }
}
```

Then in `Program.cs` or the main DI configuration:

```csharp
// File: src/BuildEstate.API/Program.cs

builder.Services.AddLandAcquisitionServices();
builder.Services.AddPlanningServices();
builder.Services.AddLegalComplianceServices();
// ... add each module's services
```

---

## 8. Frontend Result Card Rendering Expectations

The frontend search result card must display the following for every result:

```typescript
// File: client-app/src/app/features/global-search/models/search-result.model.ts

export interface SearchResultItem {
  id: string;
  title: string;                    // Displayed as card heading (bold)
  subtitle: string;                 // Displayed below title (muted)
  status: string;                   // Rendered as status badge
  description?: string;             // Optional preview text (truncated 120 chars)
  icon: string;                     // Material Symbols Outlined icon name
  category: string;                 // Used for tab grouping
  entityType: string;               // Displayed as entity type label
  navigationRoute: string;          // Full route for click-through
  timestamp: string;                // ISO date, displayed as "Updated X ago"
  relevancyScore: number;           // Used for sort order (not displayed)
  quickActions: QuickAction[];      // Hover/focus action buttons
  matchHighlights?: MatchHighlight[]; // Matched text with positions for highlighting
}
```

### Visual Layout Expectation:

```
┌─────────────────────────────────────────────────────────────────┐
│ [icon]  Entity Type Label                        [timestamp]    │
│         Title (with match highlighting)                         │
│         Subtitle                                [status badge]  │
│         Description preview...                                  │
│                                                                 │
│         [View] [Edit] [Copy Link]              ← quick actions  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 9. Unit Test Template

Every search provider must have unit tests. Copy this template:

```csharp
// File: tests/BuildEstate.Application.Tests/Features/{ModuleName}/Search/{EntityName}SearchProviderTests.cs

using System.Security.Claims;
using BuildEstate.Application.Features.{ModuleName}.Search;
using BuildEstate.Infrastructure.Persistence;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace BuildEstate.Application.Tests.Features.{ModuleName}.Search;

public class {EntityName}SearchProviderTests : IDisposable
{
    private readonly ApplicationDbContext _context;
    private readonly {EntityName}SearchProvider _provider;
    private readonly ClaimsPrincipal _adminUser;
    private readonly ClaimsPrincipal _restrictedUser;

    public {EntityName}SearchProviderTests()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new ApplicationDbContext(options);
        _provider = new {EntityName}SearchProvider(_context);

        _adminUser = CreateUser("admin-id", "SuperAdmin");
        _restrictedUser = CreateUser("restricted-id", "Viewer");

        SeedTestData();
    }

    // ─── Metadata Tests ──────────────────────────────────────────────────────

    [Fact]
    public void ModuleId_ShouldBeCorrect()
    {
        _provider.ModuleId.Should().Be("{module-id}");
    }

    [Fact]
    public void EntityName_ShouldBeCorrect()
    {
        _provider.EntityName.Should().Be("{EntityDisplayName}");
    }

    [Fact]
    public void CategoryName_ShouldBeCorrect()
    {
        _provider.CategoryName.Should().Be("{CategoryName}");
    }

    [Fact]
    public void Priority_ShouldBePositive()
    {
        _provider.Priority.Should().BeGreaterThan(0);
    }

    // ─── Search Tests ────────────────────────────────────────────────────────

    [Fact]
    public async Task SearchAsync_ExactNameMatch_ReturnsAsFirstResult()
    {
        // Arrange
        var request = new SearchRequest { Query = "{ExactTestName}", Skip = 0, Take = 10 };

        // Act
        var result = await _provider.SearchAsync(request, _adminUser, CancellationToken.None);

        // Assert
        result.Results.Should().NotBeEmpty();
        result.Results.First().Title.Should().Be("{ExactTestName}");
    }

    [Fact]
    public async Task SearchAsync_PartialMatch_ReturnsWithinTopFive()
    {
        // Arrange
        var request = new SearchRequest { Query = "{PartialQuery}", Skip = 0, Take = 10 };

        // Act
        var result = await _provider.SearchAsync(request, _adminUser, CancellationToken.None);

        // Assert
        result.Results.Should().NotBeEmpty();
        result.Results.Take(5).Should().Contain(r => r.Title.Contains("{ExpectedMatch}"));
    }

    [Fact]
    public async Task SearchAsync_UnauthorizedUser_ReturnsNoResults()
    {
        // Arrange
        var request = new SearchRequest { Query = "{ExactTestName}", Skip = 0, Take = 10 };

        // Act
        var result = await _provider.SearchAsync(request, _restrictedUser, CancellationToken.None);

        // Assert
        result.Results.Should().BeEmpty();
    }

    [Fact]
    public async Task SearchAsync_EmptyQuery_ReturnsEmptyOrRecentItems()
    {
        // Arrange
        var request = new SearchRequest { Query = "", Skip = 0, Take = 10 };

        // Act
        var result = await _provider.SearchAsync(request, _adminUser, CancellationToken.None);

        // Assert
        // Empty query should return either empty or recent items (implementation choice)
        result.Should().NotBeNull();
    }

    [Fact]
    public async Task SearchAsync_DeletedEntity_IsExcluded()
    {
        // Arrange
        var request = new SearchRequest { Query = "Deleted Entity Name", Skip = 0, Take = 10 };

        // Act
        var result = await _provider.SearchAsync(request, _adminUser, CancellationToken.None);

        // Assert
        result.Results.Should().NotContain(r => r.Title == "Deleted Entity Name");
    }

    [Fact]
    public async Task CountAsync_ReturnsCorrectCount()
    {
        // Arrange & Act
        var count = await _provider.CountAsync("{ExactTestName}", _adminUser, CancellationToken.None);

        // Assert
        count.Should().BeGreaterThan(0);
    }

    [Fact]
    public async Task SearchAsync_ResultsHaveValidNavigationRoutes()
    {
        // Arrange
        var request = new SearchRequest { Query = "{ExactTestName}", Skip = 0, Take = 10 };

        // Act
        var result = await _provider.SearchAsync(request, _adminUser, CancellationToken.None);

        // Assert
        result.Results.Should().AllSatisfy(r =>
        {
            r.NavigationRoute.Should().NotBeNullOrWhiteSpace();
            r.NavigationRoute.Should().StartWith("/{module-path}/");
            r.NavigationRoute.Should().MatchRegex(@"\/[a-f0-9\-]{36}$");
        });
    }

    [Fact]
    public async Task SearchAsync_ResultsHaveRequiredFields()
    {
        // Arrange
        var request = new SearchRequest { Query = "{ExactTestName}", Skip = 0, Take = 10 };

        // Act
        var result = await _provider.SearchAsync(request, _adminUser, CancellationToken.None);

        // Assert
        result.Results.Should().AllSatisfy(r =>
        {
            r.Title.Should().NotBeNullOrWhiteSpace();
            r.Icon.Should().NotBeNullOrWhiteSpace();
            r.Category.Should().NotBeNullOrWhiteSpace();
            r.EntityType.Should().NotBeNullOrWhiteSpace();
            r.NavigationRoute.Should().NotBeNullOrWhiteSpace();
        });
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private ClaimsPrincipal CreateUser(string userId, string role)
    {
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, userId),
            new Claim(ClaimTypes.Role, role)
        };
        return new ClaimsPrincipal(new ClaimsIdentity(claims, "TestAuth"));
    }

    private void SeedTestData()
    {
        // Add test entities to in-memory database
        // Replace with your entity seeding logic
        _context.{DbSetName}.AddRange(
            new {EntityClass} { Id = Guid.NewGuid(), /* ... seed fields ... */ },
            new {EntityClass} { Id = Guid.NewGuid(), /* ... seed fields ... */ },
            new {EntityClass} { Id = Guid.NewGuid(), IsDeleted = true, /* deleted entity */ }
        );
        _context.SaveChanges();
    }

    public void Dispose()
    {
        _context.Dispose();
    }
}
```

---

## 10. Checklist Before PR Approval

Copy into your PR description and tick all boxes:

```markdown
### Search Provider PR Checklist

#### Implementation
- [ ] Provider implements `ISearchProvider` interface
- [ ] `ModuleId` is kebab-case and matches module path
- [ ] `EntityName` is human-readable singular form
- [ ] `CategoryName` matches module display name
- [ ] `Icon` is a valid Material Symbols Outlined name
- [ ] `Priority` is set (1-10 scale)
- [ ] All searchable fields have defined weights
- [ ] At least one field has weight ≥ 2.0

#### Security
- [ ] Permission filtering applied BEFORE returning results
- [ ] Soft-deleted entities excluded (`IsDeleted` filter)
- [ ] No sensitive data exposed in search result fields
- [ ] CancellationToken passed to all async operations

#### Quality
- [ ] Exact match returns as #1 result (test passes)
- [ ] Partial match returns within top 5 (test passes)
- [ ] Unauthorized user sees no results (test passes)
- [ ] Navigation route resolves to a real Angular page
- [ ] Quick actions have correct permissions
- [ ] Result card displays: icon, title, subtitle, status, timestamp

#### Registration
- [ ] Provider registered in DI container (`services.AddScoped<ISearchProvider, ...>()`)
- [ ] Frontend result type added to search result union type
- [ ] `.kiro/steering/search-module-registration.md` updated with new entity row
- [ ] `docs/backend/search-architecture.md` updated

#### Performance
- [ ] Database indexes exist on all searchable fields
- [ ] Query uses `.AsNoTracking()`
- [ ] Query uses projection (no `SELECT *`)
- [ ] Pagination applied (Skip/Take)
- [ ] Response time < 300ms verified

#### Tests
- [ ] Metadata tests pass (ModuleId, EntityName, CategoryName, Priority)
- [ ] Exact match test passes
- [ ] Partial match test passes
- [ ] Permission filter test passes
- [ ] Empty query test passes
- [ ] Deleted entity exclusion test passes
- [ ] Navigation route validation test passes
- [ ] Required fields test passes
```

---

## Quick Reference: Common Mistakes

| Mistake | Impact | Fix |
|---------|--------|-----|
| No permission filter | Data leakage — users see entities they shouldn't | Always filter by role/department/ownership |
| Hardcoded route without `:id` | Search results all link to same page | Use `$"/{module}/{entities}/{entity.Id}"` |
| Missing `.AsNoTracking()` | Unnecessary memory and CPU overhead | Add to all read-only queries |
| Weight all fields at 1.0 | Poor relevancy — exact matches buried | Primary identifiers must be 2.0+ |
| No `IsDeleted` filter | Deleted entities appear in search | Always include `.Where(e => !e.IsDeleted)` |
| No `CancellationToken` | Requests cannot be cancelled | Pass token to every `async` call |
| Testing only happy path | Permission bugs go to production | Test unauthorized access explicitly |
