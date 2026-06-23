# Global Search — Backend Architecture

## Overview

Global Search is an enterprise-grade, cross-module search system built with ASP.NET Core following Clean Architecture (CQRS/MediatR). It provides intelligent, fast, permission-aware search across all modules with layered relevancy scoring, parallel provider execution, in-memory caching, and rate limiting.

**Target performance:** Sub-300ms response times under normal load with datasets up to 100,000 records per module.

---

## 1. Architecture Layers

```
API Layer (SearchController)
    ↓ [Authorize] + [RateLimit]
Application Layer (MediatR Handlers)
    ↓ SearchAggregator orchestrates
Search Providers (14 module-specific, parallel execution)
    ↓ Each queries its own DbSet
Infrastructure (EF Core, SQL Server, Full-Text Indexes)
```

### Layer Responsibilities

| Layer | Responsibility | Key Files |
|-------|---------------|-----------|
| **API** | Thin controller, auth, rate limiting, input binding | `SearchController.cs` |
| **Application** | CQRS handlers, validators, services, DTOs, interfaces | `Features/Search/` |
| **Infrastructure** | EF Core providers, DB configs, caching, DI registration | `Search/Providers/`, `Persistence/` |
| **Domain** | Entities (RecentSearch, PinnedItem, SavedSearch) | `Entities/Search/` |

---

## 2. API Endpoints (10 total)

All endpoints require authentication (`[Authorize]`) and are rate-limited (`[EnableRateLimiting("SearchRateLimit")]`).

| HTTP | Path | Purpose | Handler |
|------|------|---------|---------|
| GET | `/api/v1/search` | Main search with filters and pagination | `ExecuteSearchQueryHandler` |
| GET | `/api/v1/search/suggestions` | Autocomplete (prefix, limit) | `GetSuggestionsQueryHandler` |
| GET | `/api/v1/search/recent` | User's recent searches | `GetRecentSearchesQueryHandler` |
| POST | `/api/v1/search/recent` | Persist a recent search | `AddRecentSearchCommandHandler` |
| GET | `/api/v1/search/pinned` | User's pinned items | `GetPinnedItemsQueryHandler` |
| POST | `/api/v1/search/pinned` | Pin an entity | `PinItemCommandHandler` |
| DELETE | `/api/v1/search/pinned/{id}` | Unpin an entity | `UnpinItemCommandHandler` |
| GET | `/api/v1/search/saved` | User's saved searches | `GetSavedSearchesQueryHandler` |
| POST | `/api/v1/search/saved` | Save a search preset | `SaveSearchCommandHandler` |
| DELETE | `/api/v1/search/saved/{id}` | Delete a saved search | `DeleteSavedSearchCommandHandler` |

### Main Search Query Parameters

```
GET /api/v1/search?q=croydon&modules=land-acquisition,planning&statuses=Active&dateFrom=2024-01-01&dateTo=2024-12-31&createdBy=user-123&page=1&pageSize=10&maxPerCategory=50
```

---

## 3. Search Algorithm (7-Layer Scoring)

Implemented in `SearchScoringService.cs` (`CalculateFieldScore` method):

| Layer | Multiplier | Algorithm | When It Fires |
|-------|-----------|-----------|---------------|
| 1. Exact Match | 5.0x | `fieldValue == query` | "Croydon Site A" matches "croydon site a" |
| 2. Starts With | 3.0x | `fieldValue.StartsWith(query)` | "Croyd" matches "Croydon Development" |
| 3. Contains | 1.5x | `fieldValue.Contains(query)` | "develop" matches "Croydon Development Site" |
| 4. Token Match | 2.0x/token | Per-token contains check | "croydon residential" → each token scored |
| 5. Fuzzy (Levenshtein) | 0.8x | Edit distance ≤2 (short) or ≤3 (long) | "Croydun" → "Croydon" (distance 1) |
| 6. Phonetic (Soundex) | 0.5x | 4-char Soundex code comparison | "Smithe" → "Smith" (same code S530) |
| 7. Synonym | 0.7x | Dictionary lookup + expansion | "flat" → also matches "apartment", "unit" |

### Scoring Formula

```
FinalScore = Σ (MatchScore × FieldWeight × LayerMultiplier) + BoostScore
```

### Boost Rules (6)

| Condition | Points | Implementation |
|-----------|--------|----------------|
| Recently viewed by user (30 days) | +2.0 | `RecentlyViewedIds.Contains(entityId)` |
| Recently modified (<7 days) | +1.5 | `ModifiedAt > UtcNow - 7 days` |
| Active status | +1.0 | `Status == "Active"` |
| Created by current user | +0.5 | `CreatedBy == currentUserId` |
| Matches user department | +1.0 | `Department == userDepartment` |
| Frequently accessed (10+ views) | +0.8 | `FrequentlyAccessedIds.Contains(entityId)` |

### Additional Scoring Features

- **Same-field bonus (+1.0):** All query tokens match within one field
- **Feature flags:** Fuzzy and phonetic matching can be disabled via `SearchSettings`
- **Normalization:** Lowercase, trim, collapse spaces, remove diacritics, expand abbreviations

---

## 4. Query Normalization

Implemented in `SearchNormalizationService.cs` (static utility):

1. Trim leading/trailing whitespace
2. Convert to lowercase (invariant)
3. Collapse multiple whitespace to single space
4. Remove diacritical marks (é → e, ñ → n) via Unicode decomposition
5. Expand abbreviations ("dev" → "development", "acq" → "acquisition", etc.)
6. Truncate to 200 characters maximum

### Abbreviation Dictionary (15 entries)

```
app → application, dev → development, mgmt → management, ref → reference,
dept → department, acq → acquisition, prop → property, doc → document,
env → environmental, fin → financial, auth → authority, cert → certificate,
insp → inspection, maint → maintenance, proj → project
```

---

## 5. Synonym Expansion

Implemented in `SearchSynonymService.cs` (16 dictionary entries):

```
flat → apartment, unit
house → dwelling, property, home
land → site, plot, parcel
planning → permission, consent, approval
legal → compliance, regulatory, statutory
finance → budget, cost, financial
construction → build, development, works
owner → proprietor, landlord
tenant → lessee, occupier, renter
contract → agreement, deed
purchase → acquisition, buy
sale → disposal, sell
risk → issue, concern, threat
document → file, attachment, record
project → scheme, development
inspection → survey, assessment, review
```

Controlled by `SearchSettings.EnableSynonyms` flag.

---

## 6. Search Providers (14 registered)

Each provider implements `ISearchProvider` and is registered in DI as a scoped service.

| # | Provider | Module | Entity | Priority | Permission Required | Field Weights |
|---|----------|--------|--------|----------|--------------------|----|
| 1 | `LandOpportunitySearchProvider` | land-acquisition | Land Opportunity | 1 | AcquisitionManager / SuperAdmin | Name(2.0), Location(1.5), Status(1.0), Source(0.8) |
| 2 | `LandOwnerSearchProvider` | land-acquisition | Land Owner | 2 | AcquisitionManager / SuperAdmin | Name(2.0), Contact(1.0), Address(1.0) |
| 3 | `DueDiligenceSearchProvider` | land-acquisition | Due Diligence | 3 | AcquisitionManager / SuperAdmin | Type(1.5), Status(1.0), Findings(1.0) |
| 4 | `OfferSearchProvider` | land-acquisition | Offer | 4 | AcquisitionManager / SuperAdmin | Amount(1.0), Status(1.5), Currency(0.5) |
| 5 | `ContractSearchProvider` | land-acquisition | Contract | 5 | AcquisitionManager / SuperAdmin | Status(1.5), SolicitorFirm(1.0) |
| 6 | `AcquisitionSearchProvider` | land-acquisition | Acquisition | 6 | AcquisitionManager / SuperAdmin | RegistryRef(2.0), Status(1.0), Price(0.8) |
| 7 | `PlanningApplicationSearchProvider` | planning | Planning Application | 10 | PlanningManager / SuperAdmin | Reference(2.5), Description(2.0), Status(1.0), Council(1.5) |
| 8 | `PlanningConditionSearchProvider` | planning | Planning Condition | 11 | PlanningManager / SuperAdmin | Description(1.5), Status(1.0) |
| 9 | `LegalCaseSearchProvider` | legal | Legal Case | 20 | LegalOfficer / SuperAdmin | CaseRef(2.5), Title(2.0), Status(1.0), Type(1.0) |
| 10 | `ComplianceCheckSearchProvider` | legal | Compliance Check | 21 | LegalOfficer / SuperAdmin | CheckType(1.5), Outcome(1.0), Category(1.0) |
| 11 | `UserSearchProvider` | users | User | 30 | SuperAdmin only | FullName(2.5), Email(2.0), Role(1.5), Department(1.0) |
| 12 | `RoleSearchProvider` | users | Role | 31 | SuperAdmin only | Name(2.0), Description(1.0) |
| 13 | `DocumentSearchProvider` | documents | Document | 40 | Any authenticated user | FileName(2.0), DocType(1.5), Description(1.0), Tags(1.5) |
| 14 | `NotificationSearchProvider` | notifications | Notification | 50 | Own notifications only | Title(2.0), Message(1.0), Type(1.0) |

### Provider Contract

```csharp
public interface ISearchProvider
{
    string ModuleId { get; }
    string EntityName { get; }
    string CategoryName { get; }
    string Icon { get; }
    int Priority { get; }
    Task<SearchProviderResult> SearchAsync(SearchRequest request, ClaimsPrincipal user, CancellationToken ct);
    Task<int> CountAsync(string query, ClaimsPrincipal user, CancellationToken ct);
}
```

---

## 7. Search Aggregator

Implemented in `SearchAggregator.cs` — orchestrates the entire search pipeline:

1. **Normalize** the query
2. **Expand** with synonyms
3. **Filter** providers by requested modules (or query all)
4. **Execute** all providers in **parallel** via `Task.WhenAll`
5. **Timeout** handling: per-provider 5-second `CancellationTokenSource.CreateLinkedTokenSource`
6. **Score** all results via `SearchScoringService`
7. **Group** by category
8. **Limit** max 50 per category, max 200 total
9. **Order** groups by provider priority (ascending)
10. **Highlight** matched text via `SearchHighlightService`
11. **Cache** response with 30-second TTL (per-user, per-query)
12. **Return** `AggregatedSearchResponse` with categories, totalCount, timedOutModules

---

## 8. Highlighting (XSS-Safe)

Implemented in `SearchHighlightService.cs`:

- Splits query into tokens
- Finds all case-insensitive occurrences in text
- Merges overlapping intervals
- Wraps matches in `<mark>` elements
- **HTML-encodes ALL text** (matched and non-matched) via `WebUtility.HtmlEncode()`
- Respects `EnableHighlights` flag (returns plain encoded text when disabled)
- Original case preserved in output

---

## 9. Database Schema

### Search Tables (Migration: `20260720120000_AddSearchTables`)

| Table | Purpose | Indexes |
|-------|---------|---------|
| `RecentSearches` | User's search history | `IX_RecentSearches_UserId_SearchedAt` (composite, descending) |
| `PinnedItems` | User's bookmarked entities | `IX_PinnedItems_UserId_EntityId` (unique, filtered on IsDeleted=0) |
| `SavedSearches` | Named search presets | `IX_SavedSearches_UserId` |

### Search Performance Indexes on Existing Tables

| Table | Index | Purpose |
|-------|-------|---------|
| `LandOpportunities` | `IX_LandOpportunities_Name`, `IX_LandOpportunities_Location` | Fast text lookups |
| `LegalCases` | `IX_LegalCases_Title` | Fast title search |
| `Documents` | `IX_Documents_FileName` | Fast filename search |

### Full-Text Indexes (SQL Server FTS)

| Table | Columns | Catalog |
|-------|---------|---------|
| `LandOpportunities` | Name, Location | `FT_CATALOG_BuildEstate` |
| `PlanningApplications` | Description | `FT_CATALOG_BuildEstate` |
| `LegalCases` | Title, Description | `FT_CATALOG_BuildEstate` |
| `Documents` | FileName | `FT_CATALOG_BuildEstate` |

### Entity Design

All search entities extend `BaseEntity` with: Id (Guid), CreatedAt, CreatedBy, UpdatedAt, UpdatedBy, IsDeleted, DeletedAt, DeletedBy, RowVersion. Soft-delete query filter applied on all.

---

## 10. Security

| Concern | Implementation |
|---------|----------------|
| Authentication | `[Authorize]` on entire `SearchController` class |
| Rate limiting | `[EnableRateLimiting("SearchRateLimit")]` — 10 req/sec per user |
| Permission filtering | Every provider checks `ClaimsPrincipal` roles before returning data |
| XSS prevention | `WebUtility.HtmlEncode()` on all highlighted text |
| Input validation | `ExecuteSearchQueryValidator` — 1-200 chars, page ≥ 1, pageSize 1-50, dateFrom ≤ dateTo |
| SQL injection | EF Core parameterized queries throughout |
| Error exposure | Generic error messages to client; details logged server-side |
| Query truncation | Max 200 characters enforced in normalization |
| Soft delete | `HasQueryFilter(x => !x.IsDeleted)` on all entities |

### Permission Matrix

| Role | Sees |
|------|------|
| SuperAdmin | Everything across all modules |
| AcquisitionManager | Land Acquisition entities + Documents + Notifications |
| PlanningManager | Planning entities + Documents + Notifications |
| LegalOfficer | Legal entities + Documents + Notifications |
| Any authenticated | Own documents + own notifications |
| Unauthenticated | Nothing (401 Unauthorized) |

---

## 11. Configuration (`appsettings.json`)

```json
"Search": {
    "MaxResultsPerCategory": 50,
    "MaxTotalResults": 200,
    "ProviderTimeoutMs": 5000,
    "DefaultPageSize": 10,
    "MaxPageSize": 50,
    "EnableFuzzyMatching": true,
    "EnablePhoneticMatching": true,
    "EnableSynonyms": true,
    "EnableHighlights": true,
    "MaxQueryLength": 200,
    "DebounceMs": 300,
    "SuggestionLimit": 8,
    "RecentSearchesLimit": 20,
    "MaxSavedSearches": 50,
    "MaxPinnedItems": 25,
    "CategoryCountCacheTtlSeconds": 30,
    "RateLimitPerSecond": 10
}
```

Bound via `services.Configure<SearchSettings>(configuration.GetSection("Search"))`.

---

## 12. DI Registration

### Application Layer (`DependencyInjection.cs`)

```csharp
services.AddScoped<ISearchSynonymService, SearchSynonymService>();
services.AddScoped<ISearchScoringService, SearchScoringService>();
services.AddScoped<ISearchHighlightService, SearchHighlightService>();
services.AddScoped<ISearchAggregator, SearchAggregator>();
```

### Infrastructure Layer (`DependencyInjection.cs`)

```csharp
// 14 search providers
services.AddScoped<ISearchProvider, LandOpportunitySearchProvider>();
services.AddScoped<ISearchProvider, LandOwnerSearchProvider>();
// ... (12 more)
services.AddScoped<ISearchProvider, NotificationSearchProvider>();

// Startup validation
services.AddHostedService<SearchProviderValidationService>();
```

The `SearchProviderValidationService` resolves all `ISearchProvider` instances at startup and logs a warning if any fail to resolve.

---

## 13. CQRS Structure

### Queries (5)

| Query | Handler | Validator | Returns |
|-------|---------|-----------|---------|
| `ExecuteSearchQuery` | `ExecuteSearchQueryHandler` | `ExecuteSearchQueryValidator` | `SearchResponseDto` |
| `GetSuggestionsQuery` | `GetSuggestionsQueryHandler` | `GetSuggestionsQueryValidator` | `List<SuggestionDto>` |
| `GetRecentSearchesQuery` | `GetRecentSearchesQueryHandler` | None | `List<RecentSearchDto>` |
| `GetPinnedItemsQuery` | `GetPinnedItemsQueryHandler` | None | `List<PinnedItemDto>` |
| `GetSavedSearchesQuery` | `GetSavedSearchesQueryHandler` | None | `List<SavedSearchDto>` |

### Commands (5)

| Command | Handler | Validator | Returns |
|---------|---------|-----------|---------|
| `AddRecentSearchCommand` | `AddRecentSearchCommandHandler` | None | `Unit` |
| `PinItemCommand` | `PinItemCommandHandler` | `PinItemCommandValidator` | `PinnedItemDto` |
| `UnpinItemCommand` | `UnpinItemCommandHandler` | None | `Unit` |
| `SaveSearchCommand` | `SaveSearchCommandHandler` | `SaveSearchCommandValidator` | `SavedSearchDto` |
| `DeleteSavedSearchCommand` | `DeleteSavedSearchCommandHandler` | None | `Unit` |

---

## 14. Performance Architecture

| Concern | Solution |
|---------|----------|
| Provider parallelism | `Task.WhenAll` — all 14 providers execute concurrently |
| Provider timeout | `CancellationTokenSource.CreateLinkedTokenSource` + `CancelAfter(5000ms)` |
| Graceful degradation | Timed-out providers return partial results + `timedOutModules` list |
| Response caching | `IMemoryCache` with 30s absolute TTL (key: user+query+modules) |
| Rate limiting | ASP.NET Core `AddRateLimiter` — 10 req/sec fixed window per user |
| Read performance | `.AsNoTracking()` on all provider queries |
| Database indexes | Column indexes on searchable fields + full-text indexes |
| Result caps | Max 50 per category, max 200 total (configurable) |
| Query normalization | Static utility class, no allocation per call |

---

## 15. Testing

### Property-Based Tests (FsCheck)

| Test File | Properties Proven |
|-----------|-------------------|
| `SearchNormalizationServicePropertyTests.cs` | Always lowercase, trimmed, no consecutive spaces, no diacritics, max 200 chars |
| `SearchSynonymServicePropertyTests.cs` | Expansion includes all synonyms, preserves originals, no expansion when disabled |
| `SearchScoringServicePropertyTests.cs` | Layer ordering (exact > starts-with > contains), multi-token AND, same-field bonus, fuzzy threshold, boost additivity, feature flags, field weight ordering |
| `SearchHighlightServicePropertyTests.cs` | XSS-safe encoding, mark wrapping correctness, case preservation, disabled mode |
| `SearchAggregatorPropertyTests.cs` | Max 50/category, max 200 total, priority ordering, module filter exclusion |
| `SearchPermissionFilteringPropertyTests.cs` | Every role combination tested, unauthorized = zero results, SuperAdmin sees all |
| `SearchValidationPropertyTests.cs` | Date range validation, pagination bounds, recent search ordering |

### Unit Tests

| Test File | Coverage |
|-----------|----------|
| `SearchScoringServiceTests.cs` | Empty query, whitespace, special chars, multi-token exclusion, all 6 boost conditions individually + combined (6.8 total) |

### Integration Tests

| Test File | Coverage |
|-----------|----------|
| `SearchControllerIntegrationTests.cs` | 401 unauth, 400 invalid, 200 valid structure, recent search CRUD, pin/unpin lifecycle, saved search CRUD, rate limiting 429 |

---

## 16. File Inventory

```
src/BuildEstate.Domain/Entities/Search/
├── RecentSearch.cs, PinnedItem.cs, SavedSearch.cs

src/BuildEstate.Application/Features/Search/
├── Interfaces/ (5 files)
├── Models/ (6 files)
├── DTOs/ (8 files)
├── Services/ (5 files — Aggregator, Scoring, Synonym, Highlight, Normalization)
├── Queries/ (5 handlers + 2 validators)
├── Commands/ (5 handlers + 2 validators)

src/BuildEstate.Application/Settings/
├── SearchSettings.cs

src/BuildEstate.Infrastructure/Search/
├── Providers/ (14 provider files)
├── SearchProviderValidationService.cs

src/BuildEstate.Infrastructure/Persistence/
├── Configurations/Search/ (3 EF configs)
├── Migrations/20260720120000_AddSearchTables.cs

src/BuildEstate.API/Controllers/
├── SearchController.cs (10 endpoints)
```

---

## 17. How Future Modules Participate

Adding search to a new module requires:

1. Create a class implementing `ISearchProvider`
2. Define ModuleId, EntityName, CategoryName, Icon, Priority
3. Implement `SearchAsync` with permission filtering and field weighting
4. Register as `services.AddScoped<ISearchProvider, YourProvider>()`
5. The aggregator automatically discovers and queries it in parallel

**No changes to the aggregator, controller, or frontend.** The system is fully extensible via the provider pattern.

See `docs/templates/search-provider-template.md` and `docs/guides/adding-search-to-new-module.md` for step-by-step instructions.

---

## Related Documents

- [Global Search Frontend Architecture](global-search-front-end-features.md) — Components, NgRx, services, accessibility
- [Adding Search to a New Module](../guides/adding-search-to-new-module.md) — Step-by-step developer guide
- [Search Provider Template](../templates/search-provider-template.md) — Copy-and-fill boilerplate
- [Search Relevancy Standards](../search/search-relevancy.md) — Scoring algorithms and field weights
- [System Architecture](../ARCHITECTURE.md) — Overall platform architecture
- [Security & Authorization](../../developer-notes/Security-authentication-authorization-feature/security-authentication-authorization-full-feature-details.md) — Permission model
- [← Back to Documentation Portal](../README.md)
