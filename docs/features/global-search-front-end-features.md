# Global Search — Angular Frontend Architecture

## Overview

Global Search is a persistent overlay accessible from every page in BuildEstate Pro — similar to Spotlight on macOS, VS Code's command palette, or Linear's search. It is not a routed page; it's platform infrastructure rendered in the app shell.

**Entry points:**
- Click the search icon button in the top navigation bar (always visible)
- Press `Ctrl+K` (Windows/Linux) or `Cmd+K` (macOS) from anywhere — even inside text inputs

---

## 1. User Experience Flow

1. A full-screen modal dialog renders with the search input auto-focused
2. With no query: shows recent searches and pinned items
3. As the user types: results appear after 300ms debounce, grouped by module category with tabs
4. Arrow keys navigate results, Enter opens them, Escape closes
5. On desktop (≥1440px): a preview panel shows details of the highlighted result
6. Clicking a result navigates to the entity detail page and closes the overlay

---

## 2. Component Architecture

```
AppComponent (shell)
├── <app-search-trigger>          ← Search button in nav bar
├── <app-search-container>        ← Hosts the overlay (always rendered, invisible until open)
│   └── <app-search-overlay>      ← The smart container managing everything
│       ├── Inline search input   ← Auto-focused text input with clear button
│       ├── Inline tabs           ← Category tabs with count badges
│       ├── Inline result list    ← Grouped results with keyboard navigation
│       ├── Inline preview panel  ← Entity preview (desktop only)
│       ├── Inline empty state    ← "No results" guidance
│       ├── Inline loading state  ← Skeleton placeholders
│       └── Inline error state    ← Retry button, error message
│
├── Presentational components (available for reuse):
│   ├── <app-search-tabs>
│   ├── <app-search-result-card>
│   ├── <app-search-result-list>
│   ├── <app-search-input>
│   ├── <app-command-palette>
│   ├── <app-recent-searches>
│   ├── <app-pinned-items>
│   ├── <app-saved-searches>
│   ├── <app-advanced-filters>
│   ├── <app-search-preview-panel>
│   ├── <app-search-empty-state>
│   └── searchHighlight pipe
```

---

## 3. State Management (NgRx)

### Store Slice: `'search'`

```typescript
interface ISearchState {
  query: string;                         // Current search text
  results: ISearchCategoryResult[];      // Grouped results from API
  totalCount: number;                    // Total matches across all categories
  loading: boolean;                      // Whether API call is in-flight
  error: string | null;                  // Error message if search failed
  activeTab: string;                     // 'all' or a specific category name
  recentSearches: IRecentSearch[];       // User's recent search history
  pinnedItems: IPinnedItem[];            // User's pinned entities
  suggestions: ISuggestion[];            // Autocomplete suggestions
  advancedFilters: IAdvancedFilters;     // Module/status/date/tag filters
  overlayOpen: boolean;                  // Whether overlay is visible
  selectedResultIndex: number;           // Keyboard-selected result (-1 = none)
  previewItem: ISearchResultItem | null; // Result being previewed
  savedSearches: ISavedSearch[];         // User's saved search presets
  commandMode: boolean;                  // Whether ">" prefix activates commands
  timedOutModules: string[];             // Modules that failed to respond in time
}
```

### Actions (31 total)

| Action | Purpose |
|--------|---------|
| `openOverlay` | Show the search dialog |
| `closeOverlay` | Hide dialog, reset transient state |
| `executeSearch` | Trigger a search (debounced in effect) |
| `executeSearchSuccess` | Store successful results |
| `executeSearchFailure` | Store error, keep previous results |
| `clearSearch` | Reset query/results without closing |
| `setActiveTab` | Switch between category tabs |
| `addRecentSearch` | Persist a search to history |
| `loadRecentSearches` / `Success` | Fetch user's recent searches |
| `pinItem` / `Success` | Pin an entity for quick access |
| `unpinItem` / `Success` | Remove a pin |
| `loadPinnedItems` / `Success` | Fetch user's pins |
| `loadSuggestions` / `Success` | Fetch autocomplete suggestions |
| `setAdvancedFilters` / `clearAdvancedFilters` | Apply/reset filters |
| `selectResult` | Highlight a result (keyboard/hover) |
| `navigateToResult` | Open the selected result's page |
| `loadPreview` / `Success` / `Failure` | Load preview data |
| `saveSearch` / `Success` | Save current query+filters as preset |
| `deleteSavedSearch` / `Success` | Remove a saved preset |
| `loadSavedSearches` / `Success` | Fetch user's saved searches |
| `toggleCommandMode` | Switch to/from command palette mode |

### Effects (12)

| Effect | Behaviour |
|--------|-----------|
| `executeSearch$` | 300ms `debounceTime` → `switchMap` (cancels previous) → `SearchService.search()` → success/failure |
| `loadSuggestions$` | 200ms debounce, min 2 chars → `switchMap` → `SearchService.getSuggestions()` |
| `loadRecentSearches$` | `exhaustMap` → `SearchService.getRecentSearches()` |
| `loadPinnedItems$` | `exhaustMap` → `SearchService.getPinnedItems()` |
| `loadSavedSearches$` | `exhaustMap` → `SearchService.getSavedSearches()` |
| `pinItem$` | `exhaustMap` → `SearchService.pinItem(...)` → success/failure |
| `unpinItem$` | `exhaustMap` → `SearchService.unpinItem(id)` → success/failure |
| `saveSearch$` | `exhaustMap` → `SearchService.saveSearch(...)` → success/failure |
| `deleteSavedSearch$` | `exhaustMap` → `SearchService.deleteSavedSearch(id)` → success/failure |
| `addRecentSearch$` | `exhaustMap` → `SearchService.addRecentSearch(...)` → reload recent |
| `navigateToResult$` | Non-dispatching → `Router.navigateByUrl(result.navigationRoute)` |
| `showErrorToast$` | Non-dispatching → `ToastService.showError(error)` |

### Selectors (17 memoized)

| Selector | Returns |
|----------|---------|
| `selectSearchResults` | Full results array |
| `selectSearchLoading` | Loading boolean |
| `selectError` | Error string or null |
| `selectOverlayOpen` | Overlay visibility |
| `selectActiveTab` | Current tab name |
| `selectTotalCount` | Total result count |
| `selectRecentSearches` | Recent searches array |
| `selectPinnedItems` | Pinned items array |
| `selectSavedSearches` | Saved searches array |
| `selectSuggestions` | Suggestion array |
| `selectAdvancedFilters` | Current filter state |
| `selectCommandMode` | Command mode boolean |
| `selectTimedOutModules` | Timed-out module names |
| `selectHasResults` | `totalCount > 0` |
| `selectGroupedResults` | Results (passthrough) |
| `selectActiveTabResults` | Filtered by active tab |
| `selectCategoryCounts` | `{category, count, icon}[]` for tab badges |
| `selectSelectedResult` | Item at `selectedResultIndex` |

---

## 4. Services

### SearchService (`search.service.ts`)

| Method | HTTP | Endpoint |
|--------|------|----------|
| `search(params)` | GET | `/api/v1/search?q=...&modules=...&page=...` |
| `getSuggestions(prefix, limit)` | GET | `/api/v1/search/suggestions?prefix=...&limit=8` |
| `getRecentSearches()` | GET | `/api/v1/search/recent` |
| `addRecentSearch(query, count)` | POST | `/api/v1/search/recent` |
| `getPinnedItems()` | GET | `/api/v1/search/pinned` |
| `pinItem(entityId, entityType, title, subtitle, icon, category, route)` | POST | `/api/v1/search/pinned` |
| `unpinItem(id)` | DELETE | `/api/v1/search/pinned/{id}` |
| `getSavedSearches()` | GET | `/api/v1/search/saved` |
| `saveSearch(name, query, filters)` | POST | `/api/v1/search/saved` |
| `deleteSavedSearch(id)` | DELETE | `/api/v1/search/saved/{id}` |

### SearchKeyboardService (`search-keyboard.service.ts`)

Registers the global `Ctrl+K`/`Cmd+K` listener via `fromEvent(document, 'keydown')`. Works even when focus is inside text inputs or contenteditable elements. Called at app bootstrap in `AppComponent.ngOnInit()`.

---

## 5. Models (TypeScript Interfaces)

### Core (`search.model.ts`) — 11 interfaces
- `ISearchResponse`, `ISearchCategoryResult`, `ISearchResultItem`, `IQuickAction`
- `IRecentSearch`, `IPinnedItem`, `ISavedSearch`, `IAdvancedFilters`
- `ISuggestion`, `IPaginationMeta`, `ISearchQueryParams`

### Config (`search-config.model.ts`) — 5 interfaces + 1 constant
- `ICommandPaletteConfig`, `ISearchCommand`, `IFrequentPage`, `IRecentItem`
- `DEFAULT_COMMAND_PALETTE_CONFIG`

### Result Rendering (`search-result.model.ts`) — 5 types + 1 constant
- `SearchResultStatusVariant`, `ISearchResultRenderConfig`, `IPreviewData`
- `IRelatedLink`, `IActivityItem`, `STATUS_VARIANT_MAP`

---

## 6. Responsive Layout

| Viewport | Layout | Preview Panel | Result Detail |
|----------|--------|---------------|---------------|
| ≥1440px (Desktop) | Centered overlay, max-w-5xl | ✅ Side panel | Full card with breadcrumb |
| 1024–1439px (Laptop) | Centered overlay, max-w-4xl | ❌ Hidden | Full card with breadcrumb |
| 768–1023px (Tablet) | Full-screen overlay | ❌ Hidden | Full card |
| <768px (Mobile) | Full-screen overlay | ❌ Hidden | Simplified (title + icon + status) |

---

## 7. Accessibility (WCAG 2.1 AA)

| Feature | Implementation |
|---------|----------------|
| Modal dialog | `role="dialog"`, `aria-modal="true"`, `aria-label="Global search"` |
| Focus trapping | Tab/Shift+Tab cycle within overlay only |
| Focus return | On close, focus returns to the triggering element |
| Keyboard navigation | ArrowDown/Up moves results, Enter activates, Escape closes |
| Result announcement | `aria-live="polite"` region announces count to screen readers |
| Tab roles | `role="tablist"`, `role="tab"`, `aria-selected` |
| Result roles | `role="option"`, `aria-selected` on focused result |
| Loading state | `aria-busy="true"` on skeleton container |
| Decorative icons | `aria-hidden="true"` on all Material Symbols icons |
| Global shortcut | Works even when focused in contenteditable or text inputs |

---

## 8. Performance Design

| Concern | Solution |
|---------|----------|
| Keystroke flooding | 300ms `debounceTime` before API call |
| Stale results | `switchMap` cancels previous in-flight request |
| Memory | OnPush change detection + Angular signals (`store.selectSignal()`) |
| Re-renders | Computed signals (`computed()`) for derived values |
| Large result sets | Max 200 total, max 50 per category (backend enforced) |
| API latency | Loading skeleton shown immediately |
| Keyboard shortcuts | No delay — `fromEvent` directly on document |

---

## 9. Feature Registration

### `global-search.providers.ts`

```typescript
export function provideGlobalSearch(): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideState('search', searchReducer),
    provideEffects(SearchEffects)
  ]);
}
```

Called in `app.config.ts` — registers store slice and effects at app bootstrap.

### `app.component.ts` Integration

- `SearchContainerComponent` and `SearchTriggerComponent` imported in the template
- `SearchKeyboardService.register()` called in `ngOnInit()`
- Search trigger visible in the header bar on every page

---

## 10. File Inventory

```
client-app/src/app/features/global-search/
├── models/
│   ├── search.model.ts, search-config.model.ts, search-result.model.ts, index.ts
├── services/
│   ├── search.service.ts, search-keyboard.service.ts, index.ts
├── store/
│   ├── search.state.ts, search.actions.ts, search.reducer.ts
│   ├── search.effects.ts, search.selectors.ts, index.ts
│   ├── search.reducer.spec.ts, search.effects.spec.ts, search.selectors.spec.ts
├── components/
│   ├── search-overlay/, search-input/, search-trigger/, search-tabs/
│   ├── search-result-card/, search-result-list/, search-highlight/
│   ├── command-palette/, recent-searches/, pinned-items/
│   ├── saved-searches/, advanced-filters/, search-preview-panel/
│   └── search-empty-state/
├── containers/
│   └── search-container/
├── global-search.providers.ts
└── global-search.routes.ts
```

---

## 11. How Future Modules Participate

When a new module is implemented on the backend, the frontend automatically benefits:

1. The backend adds a new `ISearchProvider` → results appear in search
2. The category creates a new tab automatically (priority determines order)
3. The result card renders any entity using the standard `ISearchResultItem` contract
4. Navigation routes are provider-declared — frontend calls `Router.navigateByUrl()`

**No frontend changes needed for new modules.** The search UI is completely data-driven.

---

## 12. Testing

| Test File | Coverage |
|-----------|----------|
| `search.reducer.spec.ts` | Property tests: ClearSearch preservation, failure state preservation (fast-check) |
| `search.effects.spec.ts` | Debounce timing, switchMap cancellation, error handling, toast notifications |
| `search.selectors.spec.ts` | All derived selectors: hasResults, activeTabResults, categoryCounts, selectedResult |
| `search-overlay.component.spec.ts` | ARIA compliance: dialog role, modal, label, listbox, live region, keyboard escape |

---

## Related Documents

- [Global Search Backend Architecture](global-search-back-end-features.md) — Providers, scoring, aggregation, caching, security
- [Adding Search to a New Module](../guides/adding-search-to-new-module.md) — Step-by-step developer guide
- [Search Provider Template](../templates/search-provider-template.md) — Copy-and-fill boilerplate
- [Search Relevancy Standards](../search/search-relevancy.md) — Scoring algorithms and field weights
- [Design System Components](../frontend/showcase/00-EXECUTIVE-SUMMARY.md) — Shared UI components used by search
- [System Architecture](../ARCHITECTURE.md) — Overall platform architecture
- [← Back to Documentation Portal](../README.md)
