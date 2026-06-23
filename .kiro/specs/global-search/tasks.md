# Implementation Plan: Global Search

## Overview

This implementation plan delivers the Global Search feature for BuildEstate Pro — an enterprise-grade, cross-module search system with command palette UX, layered relevancy scoring, permission-aware filtering, and rich result presentation. The backend uses ASP.NET Core with Clean Architecture (CQRS/MediatR), and the frontend uses Angular 20 with NgRx state management.

## Tasks

- [x] 1. Set up backend search infrastructure and core interfaces
  - [x] 1.1 Create search domain entities and interfaces
    - Create `ISearchProvider`, `ISearchScoringService`, `ISearchSynonymService`, `ISearchAggregator` interfaces in `BuildEstate.Application/Features/Search/Interfaces/`
    - Create domain entities: `RecentSearch`, `PinnedItem`, `SavedSearch` in the Domain layer
    - Create all request/response models: `SearchRequest`, `SearchProviderResult`, `RawSearchResult`, `ScoredSearchResult`, `SearchBoostContext`, `AggregatedSearchResponse`
    - Create DTOs: `SearchResponseDto`, `SearchCategoryDto`, `SearchResultDto`, `QuickActionDto`, `PaginationMeta`, `RecentSearchDto`, `PinnedItemDto`, `SavedSearchDto`
    - Create `SearchSettings` configuration class bound to appsettings.json "Search" section
    - _Requirements: 3.3, 3.4, 5.4, 13.7, 21.1_

  - [x] 1.2 Create EF Core configuration and database migration for search tables
    - Add EF Core entity configurations for `RecentSearch`, `PinnedItem`, `SavedSearch` with all required columns (Id, CreatedAt, CreatedBy, UpdatedAt, UpdatedBy, IsDeleted, DeletedAt, DeletedBy, RowVersion)
    - Add query filters for soft delete
    - Create database migration with tables: `RecentSearches`, `PinnedItems`, `SavedSearches`
    - Add indexes: `IX_RecentSearches_UserId_SearchedAt`, `IX_PinnedItems_UserId_EntityId` (unique), `IX_SavedSearches_UserId`
    - Add search indexes on existing module tables (LandOpportunities, PlanningApplications, LegalCases, Documents)
    - Create Full-Text Catalog and Full-Text Indexes on description/name fields
    - _Requirements: 10.3, 13.5, 19.3_

  - [x] 1.3 Create search query normalization service
    - Implement `SearchNormalizationService` as a static utility class
    - Normalize: lowercase, trim, collapse spaces, remove diacritics, truncate to 200 chars
    - Implement abbreviation dictionary expansion
    - Register in DI container
    - _Requirements: 2.6, 4.8, 4.10, 18.1, 18.4, 18.5_

  - [x] 1.4 Write property tests for normalization service (FsCheck)
    - **Property 1: Query normalization invariants**
    - Test with arbitrary Unicode strings, strings with diacritics, excessive whitespace, strings exceeding 200 characters
    - Verify output is always lowercase, trimmed, no consecutive spaces, no diacritical marks, max 200 chars
    - **Validates: Requirements 2.6, 4.8, 18.1, 18.5**

- [x] 2. Implement search scoring and synonym services
  - [x] 2.1 Implement SearchSynonymService
    - Create `SearchSynonymService` implementing `ISearchSynonymService`
    - Load synonym dictionary (flat, house, land, planning, legal, finance, construction, owner, tenant, contract, purchase, sale, risk, document, project, inspection)
    - Implement `ExpandQuery` method that returns expanded terms for matching keys
    - Respect `IsEnabled` property tied to `SearchSettings.EnableSynonyms`
    - Register as scoped service in DI
    - _Requirements: 4.6, 21.3_

  - [x] 2.2 Write property tests for synonym expansion (FsCheck)
    - **Property 8: Synonym expansion correctness**
    - Generate random queries with terms from and outside the dictionary
    - Verify expansion includes all synonyms for matching keys and no expansion for non-matching terms
    - **Validates: Requirements 4.6**

  - [x] 2.3 Implement SearchScoringService with layered matching
    - Create `SearchScoringService` implementing `ISearchScoringService`
    - Implement 7 scoring layers with multipliers: Exact (5.0x), StartsWith (3.0x), Contains (1.5x), Token (2.0x), Fuzzy/Levenshtein (0.8x), Phonetic/Soundex (0.5x), Synonym (0.7x)
    - Implement `CalculateFieldScore` method with all layer logic
    - Implement all-tokens-same-field bonus (+1.0)
    - Implement `CalculateBoostScore` with rules: recently viewed (+2.0), recently modified (+1.5), active (+1.0), created by user (+0.5), matches department (+1.0), frequently accessed (+0.8)
    - Implement Levenshtein distance calculation with threshold: ≤2 for words ≤6 chars, ≤3 for longer
    - Respect feature flags: EnableFuzzyMatching, EnablePhoneticMatching from SearchSettings
    - Implement Soundex/Metaphone comparison
    - Register as scoped service
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.7, 5.2, 21.2_

  - [x] 2.4 Write property tests for scoring service (FsCheck)
    - **Property 4: Score layer ordering** — Verify exact > starts-with > contains > fuzzy for same field weight
    - **Property 5: Multi-token AND logic** — Verify every token matches at least one field in included results
    - **Property 6: Same-field token bonus** — Verify +1.0 bonus when all tokens match same field
    - **Property 7: Fuzzy matching distance threshold** — Verify threshold is 2 for words ≤6 chars, 3 for longer
    - **Property 9: Boost score additivity** — Verify boost equals sum of applicable values only
    - **Property 19: Feature flag layer disable** — Verify disabled layers contribute zero score
    - **Property 21: Field weight multiplier ordering** — Verify higher-weight fields produce higher scores
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5, 4.7, 5.1, 5.2, 21.2, 21.3**

  - [x] 2.5 Write unit tests for scoring service edge cases
    - Test empty query returns empty results
    - Test single-character query below threshold
    - Test exact match with special characters
    - Test multi-token query with AND logic exclusion
    - Test boost calculations for each individual condition
    - _Requirements: 4.1, 4.3, 4.9_

- [~] 3. Checkpoint - Ensure all scoring and normalization tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Implement search highlighting service
  - [x] 4.1 Create SearchHighlightService
    - Implement server-side highlight generation wrapping matched substrings in `<mark>` elements
    - Support multi-token highlighting (each query token highlighted separately)
    - HTML-encode all non-matched text to prevent XSS
    - HTML-encode content inside mark elements
    - Respect `EnableHighlights` configuration flag (return plain text when disabled)
    - _Requirements: 8.2, 8.3, 25.1, 25.2, 25.3, 25.5_

  - [x] 4.2 Write property tests for highlighting (FsCheck)
    - **Property 10: Highlight wrapping correctness** — All matching substrings wrapped in mark elements
    - **Property 11: XSS-safe encoding** — HTML special chars (< > & " ') encoded in non-matched portions
    - Generate random query tokens × random result text with embedded HTML chars
    - **Validates: Requirements 8.2, 8.3, 25.1, 25.2, 25.3**

- [x] 5. Implement search providers (module-specific)
  - [x] 5.1 Create LandOpportunitySearchProvider
    - Implement `ISearchProvider` for Land Opportunities (Name 2.0, Location 1.5, Status 1.0, Source 0.8)
    - Use `AsNoTracking`, project only needed fields
    - Apply permission filtering based on user claims before returning results
    - Set Priority=1, ModuleId="land-acquisition", CategoryName="Land Acquisition", Icon="landscape"
    - _Requirements: 3.1, 3.3, 5.1, 6.1, 13.4_

  - [x] 5.2 Create additional Land Acquisition providers
    - Implement `LandOwnerSearchProvider` (Name 2.0, ContactDetails 1.0, Address 1.0)
    - Implement `DueDiligenceSearchProvider` (Type 1.5, Status 1.0, Findings 1.0)
    - Implement `OfferSearchProvider` (Amount 1.0, Status 1.5, Currency 0.5)
    - Implement `ContractSearchProvider` (Status 1.5, ContractType 1.0)
    - Implement `AcquisitionSearchProvider` (RegistryRef 2.0, Status 1.0, PurchasePrice 0.8)
    - All providers implement permission filtering and AsNoTracking
    - _Requirements: 3.1, 3.6, 5.1, 6.1, 13.4_

  - [x] 5.3 Create Planning and Legal search providers
    - Implement `PlanningApplicationSearchProvider` (ReferenceNumber 2.5, SiteName 2.0, Status 1.0, LocalAuthority 1.5)
    - Implement `PlanningConditionSearchProvider` (Description 1.5, Status 1.0)
    - Implement `LegalCaseSearchProvider` (CaseReference 2.5, Title 2.0, Status 1.0, Type 1.0)
    - Implement `ComplianceCheckSearchProvider` (CheckType 1.5, Status 1.0, Entity 1.0)
    - All with permission filtering
    - _Requirements: 3.1, 3.6, 5.1, 6.1_

  - [x] 5.4 Create User, Document, and Notification search providers
    - Implement `UserSearchProvider` (FullName 2.5, Email 2.0, Role 1.5, Department 1.0)
    - Implement `RoleSearchProvider` (Name 2.0, Description 1.0)
    - Implement `DocumentSearchProvider` (FileName 2.0, DocType 1.5, Description 1.0, Tags 1.5) with Full-Text Search on description
    - Implement `NotificationSearchProvider` (Title 2.0, Message 1.0, Type 1.0)
    - Document provider filters by parent entity access
    - _Requirements: 3.6, 5.1, 6.1, 19.1, 19.2, 19.3, 19.5_

  - [x] 5.5 Register all search providers in DI container
    - Register each provider as `ISearchProvider` in the infrastructure DI extension
    - Validate at startup that all registered providers resolve correctly (log warning if any fail)
    - _Requirements: 22.3, 22.4_

  - [x] 5.6 Write property tests for permission filtering (FsCheck)
    - **Property 2: Permission filtering completeness**
    - Generate random users × random entities × random permission sets
    - Verify every returned result is accessible by the user
    - Verify no inaccessible entity appears in results, counts, or suggestions
    - **Validates: Requirements 3.1, 6.1, 6.2, 6.3, 6.4, 6.5, 19.5, 24.1-24.5**

- [x] 6. Implement search aggregator and CQRS handlers
  - [x] 6.1 Create SearchAggregator
    - Implement `ISearchAggregator` with parallel provider execution using `Task.WhenAll`
    - Apply per-provider timeout of 5 seconds with `CancellationTokenSource.CreateLinkedTokenSource`
    - Handle provider timeout gracefully (return partial results + timedOutModules list)
    - Apply module filter (query only matching providers when modules specified)
    - Integrate synonym expansion before scoring
    - Score results via `ISearchScoringService`
    - Group by category, limit per category (max 50), limit total (max 200)
    - Order groups by provider priority ascending
    - Apply highlight generation via SearchHighlightService
    - _Requirements: 3.1, 3.2, 3.4, 3.5, 3.7, 7.1, 7.5, 13.8_

  - [x] 6.2 Write property tests for aggregator result limits and grouping (FsCheck)
    - **Property 3: Result count limits** — Verify max 50 per category, max 200 total
    - **Property 12: Result grouping and tab ordering** — Verify each result in exactly one group, counts correct, ordered by priority
    - **Property 13: Module filter exclusion** — Verify only filtered modules appear in response
    - **Validates: Requirements 3.2, 3.4, 7.1, 7.4, 7.5**

  - [x] 6.3 Create ExecuteSearchQuery and handler
    - Create `ExecuteSearchQuery` with properties matching API query params
    - Create `ExecuteSearchQueryValidator` (FluentValidation): q min 1 char max 200, page ≥1, pageSize 1-50, dateFrom ≤ dateTo
    - Create `ExecuteSearchQueryHandler` that normalizes query, calls aggregator, records recent search, returns `SearchResponseDto`
    - _Requirements: 4.9, 4.10, 13.7, 23.1, 23.6_

  - [x] 6.4 Create supporting queries and command handlers
    - Create `GetSuggestionsQuery` + handler (prefix min 2 chars, max 100, limit 1-20 default 8)
    - Create `GetRecentSearchesQuery` + handler (return max 20 ordered by most recent)
    - Create `GetPinnedItemsQuery` + handler
    - Create `AddRecentSearchCommand` + handler
    - Create `PinItemCommand` + handler + validator (entityId required, entityType required)
    - Create `UnpinItemCommand` + handler
    - Create `SaveSearchCommand` + handler + validator (max 50 per user)
    - Create `DeleteSavedSearchCommand` + handler
    - Create `GetSavedSearchesQuery` + handler
    - _Requirements: 10.1, 10.3, 10.4, 10.5, 12.1, 12.3, 12.4, 12.5, 23.2, 23.3, 23.4_

  - [x] 6.5 Write property tests for date validation and pagination (FsCheck)
    - **Property 14: Date range validation** — dateTo < dateFrom returns validation error; dateFrom ≤ dateTo or nulls pass
    - **Property 15: Pagination size clamping** — pageSize clamped to [1, 50], default 10
    - **Property 20: Recent searches descending order** — Results always ordered by searchedAt descending
    - **Validates: Requirements 11.5, 13.7, 10.2**

- [ ] 7. Implement SearchController and API layer
  - [x] 7.1 Create SearchController with all endpoints
    - `GET /api/v1/search` — main search with query params (q, modules, statuses, dateFrom, dateTo, createdBy, page, pageSize, maxPerCategory)
    - `GET /api/v1/search/suggestions` — autocomplete (prefix, limit)
    - `GET /api/v1/search/recent` — user's recent searches
    - `GET /api/v1/search/pinned` — user's pinned items
    - `POST /api/v1/search/pinned` — pin an item
    - `DELETE /api/v1/search/pinned/{id}` — unpin an item
    - `GET /api/v1/search/saved` — user's saved searches
    - `POST /api/v1/search/saved` — save a search
    - `DELETE /api/v1/search/saved/{id}` — delete a saved search
    - Apply `[Authorize]` attribute on all endpoints
    - _Requirements: 6.7, 23.1, 23.2, 23.3, 23.4, 23.7_

  - [x] 7.2 Add rate limiting middleware for search endpoints
    - Implement per-user rate limiting: 10 requests/second
    - Return HTTP 429 with retryAfter header when exceeded
    - Do not process search query when rate limited
    - _Requirements: 6.6_

  - [x] 7.3 Add in-memory caching for category counts
    - Cache category count results with 30-second TTL
    - Invalidate on relevant data changes
    - _Requirements: 13.6_

  - [~] 7.4 Write integration tests for search API (WebApplicationFactory)
    - Test: unauthenticated request returns 401
    - Test: invalid params return 400 with structured errors
    - Test: rate limiting returns 429 after threshold
    - Test: provider timeout returns partial results with timedOutModules
    - Test: full search returns grouped results with correct structure
    - Test: recent search persist and retrieve cycle
    - Test: pin/unpin lifecycle
    - Test: saved search CRUD operations
    - Test: role-specific permission filtering (AcquisitionManager, LegalOfficer, SuperAdmin)
    - _Requirements: 6.6, 6.7, 3.5, 23.5, 23.6, 24.1-24.5_

- [~] 8. Checkpoint - Ensure all backend tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Implement frontend search models and service layer
  - [x] 9.1 Create frontend models and TypeScript interfaces
    - Create `search.model.ts` with all interfaces: `ISearchResponse`, `ISearchCategoryResult`, `ISearchResultItem`, `IQuickAction`, `IRecentSearch`, `IPinnedItem`, `ISavedSearch`, `IAdvancedFilters`, `ISuggestion`, `IPaginationMeta`, `ISearchQueryParams`
    - Create `search-config.model.ts` with command palette configuration interfaces
    - Create `search-result.model.ts` with result rendering helper types
    - Place in `client-app/src/app/features/global-search/models/`
    - _Requirements: 14.1_

  - [x] 9.2 Create SearchService and SearchKeyboardService
    - Implement `SearchService` with methods: `search()`, `getSuggestions()`, `getRecentSearches()`, `getPinnedItems()`, `pinItem()`, `unpinItem()`, `getSavedSearches()`, `saveSearch()`, `deleteSavedSearch()`
    - All methods return typed Observables and call the correct API endpoints
    - Implement `SearchKeyboardService` to handle Ctrl+K / Cmd+K global shortcut registration
    - Handle contenteditable/input field override (still open search when focused in text fields)
    - Place in `client-app/src/app/features/global-search/services/`
    - _Requirements: 1.3, 1.4, 10.3, 10.4, 10.5, 23.1-23.4_

- [x] 10. Implement NgRx search state management
  - [x] 10.1 Create NgRx search state, actions, and reducer
    - Define `ISearchState` interface with all state properties (query, results, totalCount, loading, error, activeTab, recentSearches, pinnedItems, suggestions, advancedFilters, overlayOpen, selectedResultIndex, previewItem, savedSearches, commandMode, timedOutModules)
    - Define `initialSearchState` with proper defaults
    - Create all actions via `createActionGroup`: OpenOverlay, CloseOverlay, ExecuteSearch, ExecuteSearchSuccess, ExecuteSearchFailure, ClearSearch, SetActiveTab, AddRecentSearch, ClearRecentSearches, LoadRecentSearches, LoadRecentSearchesSuccess, PinItem, PinItemSuccess, UnpinItem, UnpinItemSuccess, LoadPinnedItems, LoadPinnedItemsSuccess, LoadSuggestions, LoadSuggestionsSuccess, SetAdvancedFilters, ClearAdvancedFilters, SelectResult, NavigateToResult, LoadPreview, LoadPreviewSuccess, LoadPreviewFailure, SaveSearch, SaveSearchSuccess, DeleteSavedSearch, DeleteSavedSearchSuccess, LoadSavedSearches, LoadSavedSearchesSuccess, ToggleCommandMode
    - Implement reducer handling all actions: ClearSearch resets query/results/totalCount/loading/error/suggestions while preserving recentSearches/pinnedItems/activeTab/advancedFilters
    - _Requirements: 14.1, 14.2, 14.5, 14.6_

  - [x] 10.2 Create NgRx effects with debounce and cancellation
    - Implement ExecuteSearch effect: 300ms debounce via `debounceTime(300)`, cancel in-flight requests via `switchMap`, dispatch Success or Failure
    - Implement LoadSuggestions effect with prefix validation (min 2 chars)
    - Implement LoadRecentSearches, LoadPinnedItems, LoadSavedSearches effects
    - Implement PinItem, UnpinItem, SaveSearch, DeleteSavedSearch effects with success/failure handling
    - Implement AddRecentSearch effect (persist to API)
    - Implement error toast effect for failure actions
    - _Requirements: 2.1, 2.2, 14.3_

  - [x] 10.3 Create memoized NgRx selectors
    - Implement `selectSearchResults`, `selectSearchLoading`, `selectGroupedResults`, `selectActiveTabResults`, `selectCategoryCounts`, `selectRecentSearches`, `selectPinnedItems`, `selectHasResults`, `selectOverlayOpen`, `selectSelectedResult`, `selectPreviewItem`, `selectSavedSearches`, `selectCommandMode`, `selectTimedOutModules`, `selectError`
    - All selectors memoized via `createSelector`
    - _Requirements: 14.4_

  - [x] 10.4 Write property tests for NgRx reducer (fast-check)
    - **Property 17: ClearSearch state preservation** — Random states → verify reset fields (query, results, totalCount, loading, error, suggestions) and preserved fields (recentSearches, pinnedItems, activeTab, advancedFilters)
    - **Property 18: Failure action state preservation** — Random states with results → verify error set, loading false, query and results preserved
    - **Validates: Requirements 14.5, 14.6**

  - [x] 10.5 Write unit tests for NgRx effects and selectors
    - Test debounce timing (300ms) in ExecuteSearch effect
    - Test switchMap cancellation of in-flight requests
    - Test error handling dispatches correct failure action
    - Test selector memoization and derived state correctness
    - _Requirements: 14.3, 14.4_

- [ ] 11. Implement search overlay and input components
  - [x] 11.1 Create SearchOverlayComponent (container)
    - Implement as modal dialog with `role="dialog"`, `aria-modal="true"`, `aria-label="Global search"`
    - Implement focus trapping: Tab/Shift+Tab cycle within overlay only
    - Implement Escape to close overlay and return focus to trigger element
    - Connect to NgRx store for state management
    - Dispatch OpenOverlay/CloseOverlay actions
    - Render search input, tabs, results, preview panel based on viewport
    - Apply responsive breakpoints: full-width + preview (≥1440px), full-width no preview (1024-1439px), full-screen (768-1023px), full-screen simplified (<768px)
    - Use DaisyUI theme tokens for all colours, Tailwind for layout
    - _Requirements: 1.2, 1.5, 1.6, 1.7, 1.8, 16.1, 16.2, 16.3, 16.4, 16.5_

  - [x] 11.2 Create SearchInputComponent
    - Implement search text input with debounced typing (300ms)
    - Cancel pending API request on new character input
    - Show loading skeleton during search
    - Render results within 100ms of API response
    - Handle minimum query length (1 char to search, show recent/pinned below threshold)
    - Normalize query on frontend (lowercase, trim, collapse spaces, truncate 200 chars)
    - Clear search on input clear or Escape
    - Cancel in-flight request on clear
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9_

  - [~] 11.3 Create search trigger in top navigation bar
    - Add search trigger icon button with `aria-label="Open search"` in the top navigation bar
    - Click opens SearchOverlay with focus on search input
    - Register global Ctrl+K (Windows/Linux) / Cmd+K (macOS) keyboard shortcut
    - Override default browser behaviour even when focused in text inputs/contenteditable
    - Render correctly in all themes (Light, Dark, Corporate, Business)
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.8_

- [ ] 12. Implement search results display components
  - [~] 12.1 Create SearchTabsComponent
    - Render tabs grouped by category with count badges (e.g., "All (52)", "Land (12)")
    - Display "All" tab as default active tab
    - Click on tab dispatches SetActiveTab action and filters results
    - Order tabs by provider priority (ascending)
    - Use `role="tablist"` with `role="tab"` on each tab for accessibility
    - Hide tabs for modules user has no access to
    - _Requirements: 7.1, 7.2, 7.3, 7.5, 7.6, 6.4_

  - [~] 12.2 Create SearchResultCardComponent
    - Display: module icon, entity type label, title with match highlighting, subtitle, status badge with colour variant, module badge, last updated timestamp, breadcrumb context
    - Render highlighted text using `bg-warning/20` background and `text-warning-content` colour
    - Provide quick action buttons: View, Edit (permission-dependent), Open in new tab, Copy link, Favorite, Pin
    - Use `role="option"` with `aria-selected` on active result
    - Apply theme token `bg-primary/10` for focused result background
    - _Requirements: 8.1, 8.2, 8.4, 8.5, 25.4_

  - [~] 12.3 Create SearchResultListComponent with keyboard navigation
    - Render list of SearchResultCards for active tab
    - Show max 5 results per category with "View all" link by default
    - Implement Arrow Down/Up to move focus between results
    - Enter navigates to result detail page and closes overlay
    - Ctrl+Enter opens result in new browser tab
    - Tab moves focus between search input, tab bar, and results list
    - Announce total result count via `aria-live="polite"` region
    - Update `aria-selected` and visual focus on active result
    - _Requirements: 7.4, 8.6, 15.1, 15.2, 15.3, 15.4, 15.5, 15.6_

  - [~] 12.4 Create SearchHighlightPipe
    - Create Angular pipe that safely renders server-provided highlighted HTML (with mark elements)
    - Use DomSanitizer to bypass security for trusted server-rendered highlights
    - Fallback to plain text when no highlighted version available
    - _Requirements: 8.2, 25.4_

- [ ] 13. Implement command palette, recent searches, and pinned items
  - [~] 13.1 Create CommandPaletteComponent
    - Display recently opened items (up to 5) and frequently used pages (up to 5) when overlay opens with no query
    - Switch to command mode when query starts with ">"
    - Show up to 15 matching navigation/action commands in command mode (permission-filtered)
    - Navigate to page on command selection and close overlay
    - Initiate workflow on action command selection
    - Search across entities, pages, and commands simultaneously without ">" prefix (debounced 300ms, min 1 char)
    - Implement full keyboard navigation: Arrow Down/Up, Enter, Tab between sections, Escape to close
    - Filter commands/items by user role permissions
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8_

  - [~] 13.2 Create RecentSearchesComponent
    - Display user's recent searches ordered by most recent first when overlay opens without query
    - Load from API via `GET /api/v1/search/recent`
    - Click on recent search re-executes the search
    - Show query text, result count, and timestamp for each entry
    - _Requirements: 10.1, 10.2, 10.3, 10.6_

  - [~] 13.3 Create PinnedItemsComponent
    - Display user's pinned items in the initial overlay state alongside recent searches
    - Load from API via `GET /api/v1/search/pinned`
    - Pin action via `POST /api/v1/search/pinned`
    - Unpin action via `DELETE /api/v1/search/pinned/{id}`
    - Show pinned items with icon, title, category, and navigation route
    - _Requirements: 10.4, 10.5, 10.6_

- [~] 14. Checkpoint - Ensure frontend core components render and integrate with store
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 15. Implement advanced search, saved searches, and preview panel
  - [~] 15.1 Create AdvancedFiltersComponent
    - Display filter controls when "Advanced" link clicked: modules (multi-select), statuses (multi-select), date range (from/to pickers), created by (user selector), tags (multi-select)
    - Dispatch SetAdvancedFilters action on filter change
    - Include filters as query params in search API request
    - Combine text query with filters using AND logic
    - Validate dateTo not earlier than dateFrom before dispatch
    - Provide "Clear all" to revert to unfiltered search
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6_

  - [~] 15.2 Create SavedSearchesComponent
    - Display saved searches in a dedicated "Saved" section in the Search_Overlay
    - Save current query + filters with user-provided name via `POST /api/v1/search/saved`
    - Load saved search populates search input and filters, then executes search
    - Delete saved search with confirmation dialog via `DELETE /api/v1/search/saved/{id}`
    - Enforce maximum 50 saved searches per user
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

  - [~] 15.3 Create SearchPreviewPanelComponent
    - Display alongside results when viewport ≥ 1440px and a result is selected
    - Show: entity summary, current status, owner/assigned user, related links, available actions, recent activity/history
    - Update preview content when user selects different result
    - Provide action buttons (View, Edit) that navigate to entity detail
    - Display fallback message with retry option if preview data fails to load
    - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5_

- [ ] 16. Implement error handling and empty states
  - [~] 16.1 Create SearchEmptyStateComponent and error states
    - Display "No results found for '{query}'" with suggestions when zero results
    - Include link to Advanced Search panel as alternative
    - Display user-friendly error message with retry button on API error
    - Show recent searches and pinned items as fallback when API unreachable
    - Display skeleton loading placeholders matching result card layout during loading
    - Never display raw server errors, stack traces, or technical details
    - Show "Some modules unavailable" banner when timedOutModules is non-empty
    - _Requirements: 20.1, 20.2, 20.3, 20.4, 20.5, 20.6_

- [ ] 17. Wire all components together and set up routing
  - [~] 17.1 Create SearchContainerComponent and feature module wiring
    - Create search container component that orchestrates overlay, input, tabs, results, preview, command palette, advanced filters, and saved searches
    - Set up `global-search.routes.ts` with lazy-loaded feature routes
    - Register NgRx search feature state in the global-search module
    - Export the search trigger component for use in the app shell/navigation
    - Ensure search overlay is accessible from every page via the app shell
    - _Requirements: 1.1, 1.2_

  - [~] 17.2 Register SearchKeyboardService at app bootstrap
    - Initialize Ctrl+K / Cmd+K listener in app component or core module
    - Ensure shortcut works from any page in the application
    - Handle platform detection (Windows vs macOS) for correct modifier key
    - _Requirements: 1.3, 1.4_

  - [~] 17.3 Write unit tests for search overlay accessibility and focus management
    - Test focus trapped within overlay when open
    - Test Escape closes overlay and returns focus to trigger
    - Test ARIA attributes present (role="dialog", aria-modal, aria-label)
    - Test keyboard navigation (Arrow keys, Enter, Tab) within results
    - Test aria-live announces result count
    - _Requirements: 1.5, 1.6, 1.7, 7.6, 8.5, 15.5_

- [~] 18. Final checkpoint - Ensure all tests pass and feature is complete
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document (FsCheck for C#, fast-check for TypeScript)
- Unit tests validate specific examples and edge cases
- Backend uses C# with ASP.NET Core, MediatR, FluentValidation, EF Core
- Frontend uses Angular 20 (standalone components), NgRx, TypeScript (strict), Tailwind CSS, DaisyUI
- All search providers must use AsNoTracking and project only needed fields for performance
- Permission filtering is enforced server-side in every search provider — never trust client-side filtering
- Rate limiting (10 req/s per user) protects backend from abuse

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "1.3"] },
    { "id": 2, "tasks": ["1.4", "2.1", "9.1"] },
    { "id": 3, "tasks": ["2.2", "2.3", "9.2"] },
    { "id": 4, "tasks": ["2.4", "2.5", "4.1"] },
    { "id": 5, "tasks": ["4.2", "5.1", "5.3", "5.4"] },
    { "id": 6, "tasks": ["5.2", "5.5", "10.1"] },
    { "id": 7, "tasks": ["5.6", "6.1", "10.2", "10.3"] },
    { "id": 8, "tasks": ["6.2", "6.3", "6.4", "10.4", "10.5"] },
    { "id": 9, "tasks": ["6.5", "7.1"] },
    { "id": 10, "tasks": ["7.2", "7.3", "11.1", "11.2"] },
    { "id": 11, "tasks": ["7.4", "11.3", "12.1", "12.4"] },
    { "id": 12, "tasks": ["12.2", "12.3", "13.1"] },
    { "id": 13, "tasks": ["13.2", "13.3", "15.1"] },
    { "id": 14, "tasks": ["15.2", "15.3", "16.1"] },
    { "id": 15, "tasks": ["17.1", "17.2"] },
    { "id": 16, "tasks": ["17.3"] }
  ]
}
```
