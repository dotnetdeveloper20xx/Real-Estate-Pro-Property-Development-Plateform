# Search Review Checklist

## Purpose

This checklist must be completed before any search-related PR is approved. It ensures search quality, relevancy, performance, and governance compliance across BuildEstate Pro.

---

## Pre-Implementation Checklist

Before writing search code, verify:

- [ ] Reviewed `search-governance.md` for architecture compliance
- [ ] Reviewed `search-module-registration.md` for registration requirements
- [ ] Reviewed `search-algorithms.md` for algorithm standards
- [ ] Identified all searchable fields for the entity
- [ ] Defined field weights for relevancy ranking
- [ ] Defined permission requirements for result visibility
- [ ] Defined result card template (icon, title, subtitle, status, actions)
- [ ] Defined navigation route for result click-through

---

## Backend Implementation Checklist

### Search Provider

- [ ] Module search provider implements `ISearchProvider` interface
- [ ] Provider registered in DI container
- [ ] Provider declares searchable entity type
- [ ] Provider declares searchable fields with weights
- [ ] Provider returns properly typed `SearchResult` DTOs
- [ ] Provider applies permission filtering before returning results
- [ ] Provider supports cancellation token

### Query Performance

- [ ] Database indexes exist for all searchable fields
- [ ] Composite indexes for common search + filter combinations
- [ ] Full-text index configured (if using SQL Server FTS)
- [ ] Query uses `.AsNoTracking()` for read-only results
- [ ] Query uses projection (no `SELECT *`)
- [ ] Query supports pagination
- [ ] Query executes in < 300ms with 100k+ records (verified)

### Search Quality

- [ ] Case-insensitive matching implemented
- [ ] Partial word matching supported
- [ ] Multiple token matching supported (AND logic)
- [ ] Results ranked by relevancy score
- [ ] Field weights applied to scoring
- [ ] Exact matches ranked higher than partial matches
- [ ] Recent/popular results get boost (where applicable)

### Security

- [ ] Permission check occurs server-side before returning results
- [ ] User cannot see entities they lack read access to
- [ ] No sensitive field content exposed in search results
- [ ] Rate limiting applied to search endpoint
- [ ] Input sanitized against injection

---

## Frontend Implementation Checklist

### Search UI

- [ ] Results grouped by module/category
- [ ] Tab counts displayed per category
- [ ] Result cards show: icon, type, title, subtitle, status, timestamp
- [ ] Match text highlighted in results
- [ ] Loading state shown during search
- [ ] Empty state with helpful message
- [ ] Error state with retry option
- [ ] Debounce applied (300ms minimum)
- [ ] Keyboard navigation within results (Arrow keys, Enter)

### Accessibility

- [ ] Search input has `aria-label`
- [ ] Results list has `role="listbox"` or `role="list"`
- [ ] Each result has `role="option"` or `role="listitem"`
- [ ] Active result has `aria-selected="true"`
- [ ] Result count announced via `aria-live`
- [ ] Keyboard shortcut (Ctrl+K) documented in accessibility
- [ ] Focus trapped within search overlay when open
- [ ] Escape closes search overlay and returns focus

### State Management

- [ ] Search state in NgRx store
- [ ] Actions: search, searchSuccess, searchFailure, clearSearch
- [ ] Effects handle API calls with cancellation
- [ ] Selectors for: results, loading, error, grouped results
- [ ] Recent searches persisted in store
- [ ] Search cleared on overlay close

### Performance

- [ ] Results render within 100ms of API response
- [ ] Virtual scrolling for large result sets (50+ items)
- [ ] Images/icons lazy loaded
- [ ] No unnecessary re-renders during typing
- [ ] Previous search cancelled when new query dispatched

---

## Module Registration Checklist

When adding a new searchable entity:

- [ ] Entity registered in search module registry
- [ ] Search fields defined with appropriate weights
- [ ] Result icon assigned (Material Symbols Outlined)
- [ ] Result category defined
- [ ] Navigation route configured
- [ ] Permission policy mapped
- [ ] Preview template defined
- [ ] Quick actions defined (View, Edit, etc.)
- [ ] `docs/backend/search-architecture.md` updated
- [ ] `search-module-registration.md` updated

---

## Relevancy Testing Checklist

- [ ] Exact match returns as first result
- [ ] Partial match returns within top 5
- [ ] Misspelling (1-2 chars off) returns correct result
- [ ] Multi-word query matches across fields
- [ ] Out-of-order words still match
- [ ] Abbreviations match full terms
- [ ] Status/category filters narrow results correctly
- [ ] Empty query shows recent/popular items
- [ ] Permission-filtered results are invisible (not just hidden)

---

## Rejection Criteria

A search PR MUST be rejected if:

- No database indexes for searchable fields
- Results returned without permission filtering
- Search response > 300ms under load
- Results not grouped by category
- No match highlighting
- No keyboard navigation support
- No loading/empty/error states
- Accessibility requirements not met
- Module not registered in search registry
- Relevancy testing not performed
