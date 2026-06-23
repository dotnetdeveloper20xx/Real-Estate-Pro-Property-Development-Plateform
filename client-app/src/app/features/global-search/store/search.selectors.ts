import { createFeatureSelector, createSelector } from '@ngrx/store';

import { ISearchState } from './search.state';

/**
 * Feature selector for the search NgRx state slice.
 */
export const selectSearchState = createFeatureSelector<ISearchState>('search');

// --- Direct state selectors ---

export const selectSearchQuery = createSelector(selectSearchState, state => state.query);
export const selectSearchResults = createSelector(selectSearchState, state => state.results);
export const selectSearchLoading = createSelector(selectSearchState, state => state.loading);
export const selectError = createSelector(selectSearchState, state => state.error);
export const selectTotalCount = createSelector(selectSearchState, state => state.totalCount);
export const selectActiveTab = createSelector(selectSearchState, state => state.activeTab);
export const selectOverlayOpen = createSelector(selectSearchState, state => state.overlayOpen);
export const selectSelectedResultIndex = createSelector(selectSearchState, state => state.selectedResultIndex);
export const selectPreviewItem = createSelector(selectSearchState, state => state.previewItem);
export const selectCommandMode = createSelector(selectSearchState, state => state.commandMode);
export const selectTimedOutModules = createSelector(selectSearchState, state => state.timedOutModules);
export const selectRecentSearches = createSelector(selectSearchState, state => state.recentSearches);
export const selectPinnedItems = createSelector(selectSearchState, state => state.pinnedItems);
export const selectSuggestions = createSelector(selectSearchState, state => state.suggestions);
export const selectAdvancedFilters = createSelector(selectSearchState, state => state.advancedFilters);
export const selectSavedSearches = createSelector(selectSearchState, state => state.savedSearches);

// --- Derived (computed) selectors ---

/**
 * Whether there are any search results available.
 */
export const selectHasResults = createSelector(selectTotalCount, count => count > 0);

/**
 * Results grouped by category (passthrough since API already groups them).
 */
export const selectGroupedResults = createSelector(selectSearchResults, results => results);

/**
 * Results filtered to the currently active tab.
 * Returns all results when tab is 'all', otherwise filters by category.
 */
export const selectActiveTabResults = createSelector(
  selectSearchResults,
  selectActiveTab,
  (results, tab) => tab === 'all' ? results : results.filter(r => r.category === tab)
);

/**
 * Category count summary for rendering tab badges (e.g., "Land (12)").
 */
export const selectCategoryCounts = createSelector(
  selectSearchResults,
  results => results.map(r => ({ category: r.category, count: r.totalCount, icon: r.icon }))
);

/**
 * The currently selected result item based on selectedResultIndex.
 * Returns null if no result is selected (index < 0) or index is out of bounds.
 */
export const selectSelectedResult = createSelector(
  selectSearchResults,
  selectSelectedResultIndex,
  (results, index) => {
    if (index < 0) return null;
    const allResults = results.flatMap(c => c.results);
    return allResults[index] ?? null;
  }
);
