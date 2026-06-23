# Adding Search to a New Module — Step-by-Step Guide

## Overview

This guide walks you through adding Global Search support to a new module in BuildEstate Pro. Follow each step in order. By the end, your module's entities will appear in global search results with proper relevancy, permissions, and navigation.

**Time estimate:** 2-4 hours per entity (including tests)

**Prerequisites:**
- Module has at least one entity with a detail page route
- Entity has a DbContext registration and EF Core configuration
- You've read `.kiro/steering/search-module-registration.md`
- You've reviewed `docs/templates/search-provider-template.md`

---

## Step 1: Define Your Searchable Entities

Before writing code, identify which entities in your module should be searchable and what fields matter most.

### Questions to Answer:

| Question | Your Answer |
|----------|-------------|
| What entities does your module manage? | |
| Which entities do users actively search for? | |
| What fields would a user type to find this entity? | |
| What icon represents this entity? | |
| What route shows the entity detail? | |
| What permission controls access? | |

### Example (Land Acquisition Module):

```
Entities:
1. Land Opportunity — primary entity, always searchable
2. Land Owner — users search by owner name
3. Due Diligence — users search by type/status
4. Offer — users search by status/amount
5. Contract — users search by status/type
6. Acquisition — users search by registry reference
```

### Decision Matrix:

| Entity | Standalone Detail Page? | Users Search For It? | Include in Search? |
|--------|------------------------|---------------------|--------------------|
| Land Opportunity | ✅ Yes | ✅ Yes | ✅ Yes |
| Land Owner | ❌ No (nested tab) | ✅ Yes | ✅ Yes (link to parent) |
| Audit Log Entry | ❌ No | ❌ No | ❌ No |

**Rule:** If an entity has no detail page AND users wouldn't search for it directly, skip it.

---

## Step 2: Choose Field Weights

For each searchable entity, assign weights using this table:

| Weight | Category | Use When |
|--------|----------|----------|
| 2.5 – 3.0 | Critical Identifier | Users memorize and search by this (reference numbers, case IDs) |
| 2.0 – 2.5 | Primary Name | The main name/title of the entity |
| 1.5 – 2.0 | Strong Context | Location, site name, important classification |
| 1.0 – 1.5 | Standard | Status, type, category |
| 0.8 – 1.0 | Supporting | Description, notes |
| 0.5 – 0.8 | Supplementary | Monetary values, secondary details |
| 0.3 – 0.5 | Low | Dates, rarely-searched values |

### Example — Planning Application:

```
Fields:
- ReferenceNumber → 2.5 (users search "PA/2024/001")
- SiteName → 2.0 (users search "Croydon Development")
- LocalAuthority → 1.5 (users filter "Bromley Council")
- Status → 1.0 (users filter "Approved")
- Description → 0.8 (supporting context)
```

### Validation Rules:
- ✅ At least one field with weight ≥ 2.0
- ✅ Maximum 8 searchable fields per entity
- ✅ Primary identifiers always ranked highest
- ❌ Don't weight everything at 1.0 (kills relevancy)

---

## Step 3: Create Your Provider Class

Copy from the template and fill in your specifics.

### 3.1 Create the file:

```
src/BuildEstate.Application/Features/{YourModule}/Search/{EntityName}SearchProvider.cs
```

### 3.2 Implementation:

```csharp
using System.Security.Claims;
using BuildEstate.Application.Common.Interfaces;
using BuildEstate.Application.Common.Models.Search;
using BuildEstate.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace BuildEstate.Application.Features.ProjectManagement.Search;

public class ProjectSearchProvider : ISearchProvider
{
    private readonly ApplicationDbContext _context;

    public ProjectSearchProvider(ApplicationDbContext context)
    {
        _context = context;
    }

    public string ModuleId => "project-management";
    public string EntityName => "Project";
    public string CategoryName => "Project Management";
    public string Icon => "engineering";
    public int Priority => 1;

    public async Task<SearchProviderResult> SearchAsync(
        SearchRequest request,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        var query = _context.Projects
            .AsNoTracking()
            .Where(p => !p.IsDeleted);

        // Permission filtering
        if (!user.IsInRole("SuperAdmin") && !user.IsInRole("ProjectManager"))
        {
            var userId = user.FindFirstValue(ClaimTypes.NameIdentifier);
            query = query.Where(p =>
                p.CreatedBy == userId ||
                p.ProjectManagerId == userId);
        }

        // Text search
        if (!string.IsNullOrWhiteSpace(request.Query))
        {
            var term = request.Query.ToLower().Trim();
            query = query.Where(p =>
                p.Name.ToLower().Contains(term) ||                    // weight 2.5
                p.ReferenceNumber.ToLower().Contains(term) ||         // weight 2.5
                p.Location.ToLower().Contains(term) ||                // weight 1.5
                p.Status.ToString().ToLower().Contains(term) ||       // weight 1.0
                (p.Description != null && p.Description.ToLower().Contains(term)) // weight 0.8
            );
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var results = await query
            .OrderByDescending(p => p.UpdatedAt ?? p.CreatedAt)
            .Skip(request.Skip)
            .Take(request.Take)
            .Select(p => new SearchResultItem
            {
                Id = p.Id.ToString(),
                Title = p.Name,
                Subtitle = $"{p.ReferenceNumber} • {p.Location}",
                Status = p.Status.ToString(),
                Description = p.Description,
                Icon = "engineering",
                Category = "Project Management",
                EntityType = "Project",
                NavigationRoute = $"/project-management/projects/{p.Id}",
                Timestamp = p.UpdatedAt ?? p.CreatedAt,
                RelevancyScore = CalculateRelevancy(p, request.Query)
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
        var dbQuery = _context.Projects
            .AsNoTracking()
            .Where(p => !p.IsDeleted);

        if (!user.IsInRole("SuperAdmin") && !user.IsInRole("ProjectManager"))
        {
            var userId = user.FindFirstValue(ClaimTypes.NameIdentifier);
            dbQuery = dbQuery.Where(p =>
                p.CreatedBy == userId ||
                p.ProjectManagerId == userId);
        }

        if (!string.IsNullOrWhiteSpace(query))
        {
            var term = query.ToLower().Trim();
            dbQuery = dbQuery.Where(p =>
                p.Name.ToLower().Contains(term) ||
                p.ReferenceNumber.ToLower().Contains(term));
        }

        return await dbQuery.CountAsync(cancellationToken);
    }

    private double CalculateRelevancy(dynamic entity, string? query)
    {
        if (string.IsNullOrWhiteSpace(query)) return 0;
        double score = 0;
        var term = query.ToLower().Trim();

        // Name — weight 2.5
        var name = (entity.Name as string ?? "").ToLower();
        if (name == term) score += 5.0 * 2.5;
        else if (name.StartsWith(term)) score += 3.0 * 2.5;
        else if (name.Contains(term)) score += 1.5 * 2.5;

        // ReferenceNumber — weight 2.5
        var refNum = (entity.ReferenceNumber as string ?? "").ToLower();
        if (refNum == term) score += 5.0 * 2.5;
        else if (refNum.StartsWith(term)) score += 3.0 * 2.5;
        else if (refNum.Contains(term)) score += 1.5 * 2.5;

        // Location — weight 1.5
        var location = (entity.Location as string ?? "").ToLower();
        if (location.Contains(term)) score += 1.5 * 1.5;

        return score;
    }
}
```

---

## Step 4: Register in DI Container

Add your provider to the module's service registration.

### 4.1 If your module already has a registration file:

```csharp
// File: src/BuildEstate.Infrastructure/DependencyInjection/ProjectManagementServiceRegistration.cs

public static class ProjectManagementServiceRegistration
{
    public static IServiceCollection AddProjectManagementServices(this IServiceCollection services)
    {
        // Existing registrations...

        // Add search providers
        services.AddScoped<ISearchProvider, ProjectSearchProvider>();
        services.AddScoped<ISearchProvider, MilestoneSearchProvider>();
        services.AddScoped<ISearchProvider, TaskSearchProvider>();

        return services;
    }
}
```

### 4.2 Call it from Program.cs:

```csharp
// File: src/BuildEstate.API/Program.cs

builder.Services.AddProjectManagementServices();
```

### 4.3 Verify registration works:

```csharp
// Quick verification in a test:
var providers = serviceProvider.GetServices<ISearchProvider>();
providers.Should().Contain(p => p.ModuleId == "project-management");
```

---

## Step 5: Verify Permission Filtering

Permission filtering is the #1 security requirement for search. Test it explicitly.

### 5.1 Write permission tests:

```csharp
[Fact]
public async Task SearchAsync_UserWithoutAccess_ReturnsEmpty()
{
    // Arrange
    var restrictedUser = CreateUser("no-access-user", "Viewer");
    var request = new SearchRequest { Query = "Secret Project", Skip = 0, Take = 10 };

    // Seed a project owned by a different user
    _context.Projects.Add(new Project
    {
        Name = "Secret Project",
        CreatedBy = "other-user-id",
        ProjectManagerId = "other-manager-id"
    });
    await _context.SaveChangesAsync();

    // Act
    var result = await _provider.SearchAsync(request, restrictedUser, CancellationToken.None);

    // Assert
    result.Results.Should().BeEmpty("restricted users should not see other users' projects");
}

[Fact]
public async Task SearchAsync_AdminUser_SeesEverything()
{
    // Arrange
    var adminUser = CreateUser("admin-id", "SuperAdmin");
    var request = new SearchRequest { Query = "Any Project", Skip = 0, Take = 10 };

    // Act
    var result = await _provider.SearchAsync(request, adminUser, CancellationToken.None);

    // Assert
    result.Results.Should().NotBeEmpty("admins should see all entities");
}
```

### 5.2 Permission Decision Tree:

```
Is user SuperAdmin?
  → YES: Return all matching results
  → NO: Does user have module-level read permission?
    → NO: Return empty results
    → YES: Filter by ownership/department/assignment
```

---

## Step 6: Verify Navigation Route Exists

Before registration is complete, verify the route actually works.

### 6.1 Check `app.routes.ts` or feature routes file:

```typescript
// Verify this route exists in your feature routes:
{
  path: 'projects/:id',
  loadComponent: () =>
    import('./containers/project-detail/project-detail.component').then(
      m => m.ProjectDetailComponent
    ),
  data: { breadcrumb: 'Project Detail' }
}
```

### 6.2 Manual verification steps:

1. Navigate to `/project-management/projects/{valid-guid}` in the browser
2. Confirm the detail page loads
3. Confirm the breadcrumb shows correct hierarchy
4. Confirm the back button returns to the list/search
5. Confirm an invalid GUID shows an appropriate error (404 or empty state)

### 6.3 If using nested entities (no standalone detail page):

```typescript
// For entities accessed via a parent's tab, link to parent with query params:
NavigationRoute = $"/land-acquisition/opportunities/{entity.OpportunityId}?tab=due-diligence"
```

---

## Step 7: Run Tests

### 7.1 Run your provider tests:

```bash
dotnet test --filter "FullyQualifiedName~{EntityName}SearchProviderTests"
```

### 7.2 Run the full solution build:

```bash
dotnet build BuildEstate.slnx --no-restore
```

### 7.3 Expected test coverage (minimum):

| Test | Purpose |
|------|---------|
| Metadata tests (ModuleId, EntityName, etc.) | Verify constants are correct |
| Exact match returns #1 | Relevancy works |
| Partial match in top 5 | Fuzzy matching works |
| Unauthorized user sees nothing | Permission filtering works |
| Deleted entities excluded | Soft delete respected |
| Empty query handled | No crash on empty input |
| Navigation routes valid | Results link to real pages |
| Required fields present | UI won't crash on null fields |

---

## Step 8: Update search-module-registration.md

Add your entity to the registry in `.kiro/steering/search-module-registration.md`:

### 8.1 Add to Current Module Registry section:

```markdown
### Project Management Module

| Entity | Icon | Category | Search Fields | Weight |
|--------|------|----------|---------------|--------|
| Project | `engineering` | Project Management | Name (2.5), ReferenceNumber (2.5), Location (1.5), Status (1.0), Description (0.8) | High |
| Milestone | `flag` | Project Management | Name (2.0), Status (1.0), DueDate (0.5) | Medium |
| Task | `task_alt` | Project Management | Title (2.0), AssignedTo (1.5), Status (1.0), Priority (1.0) | Medium |
| Risk | `warning` | Project Management | Title (2.0), Severity (1.5), Status (1.0) | Medium |
```

### 8.2 Remove from Future Modules section:

If your module was listed under "Future Modules (To Be Registered)", remove it and move to the Current Module Registry.

---

## Step 9: PR Checklist

Include this in your Pull Request description:

```markdown
## Search Integration PR

### Entity: {EntityName}
### Module: {ModuleName}

#### Checklist
- [ ] Search provider implements `ISearchProvider`
- [ ] ModuleId, EntityName, CategoryName, Icon, Priority declared
- [ ] Searchable fields defined with weights (at least one ≥ 2.0)
- [ ] Permission filtering applied server-side
- [ ] Soft-deleted entities excluded
- [ ] Navigation route verified (loads correct detail page)
- [ ] Quick actions defined (View + Edit minimum)
- [ ] Provider registered in DI container
- [ ] Unit tests pass (8 minimum test cases)
- [ ] `search-module-registration.md` updated
- [ ] `dotnet build` passes
- [ ] `npx tsc --noEmit` passes (from client-app)
- [ ] Search response < 300ms verified

#### Evidence
- Test run output attached
- Screenshot of search result rendering
- Route navigation verified (manual or E2E test)
```

---

## Common Pitfalls & Solutions

| Pitfall | Symptom | Solution |
|---------|---------|----------|
| Forgot permission filter | Other users' data shows in search | Add role/ownership check before query execution |
| Invalid navigation route | Click on result → 404 or white page | Verify route exists in feature routes file |
| No `IsDeleted` filter | Deleted items appear in search | Add `.Where(e => !e.IsDeleted)` to query |
| All weights at 1.0 | Exact matches buried in results | Primary fields must be 2.0+ |
| Missing `AsNoTracking()` | Slow search, high memory | Always use for read-only search queries |
| No `CancellationToken` | User can't cancel slow searches | Pass token to every async DB call |
| Null fields in result | UI crashes on render | Handle nulls with `?? ""` or null-conditional |
| Provider not registered in DI | Entity never appears in search | Verify `services.AddScoped<ISearchProvider, ...>()` |

---

## Summary Flowchart

```
┌──────────────────────┐
│ 1. Define Entities   │
│    & Fields          │
└──────────┬───────────┘
           │
┌──────────▼───────────┐
│ 2. Assign Weights    │
│    (2.0+ primary)    │
└──────────┬───────────┘
           │
┌──────────▼───────────┐
│ 3. Create Provider   │
│    (copy template)   │
└──────────┬───────────┘
           │
┌──────────▼───────────┐
│ 4. Register in DI    │
└──────────┬───────────┘
           │
┌──────────▼───────────┐
│ 5. Permission Tests  │
└──────────┬───────────┘
           │
┌──────────▼───────────┐
│ 6. Verify Route      │
└──────────┬───────────┘
           │
┌──────────▼───────────┐
│ 7. Run All Tests     │
└──────────┬───────────┘
           │
┌──────────▼───────────┐
│ 8. Update Registry   │
└──────────┬───────────┘
           │
┌──────────▼───────────┐
│ 9. Submit PR         │
│    (with checklist)  │
└──────────┴───────────┘
```
