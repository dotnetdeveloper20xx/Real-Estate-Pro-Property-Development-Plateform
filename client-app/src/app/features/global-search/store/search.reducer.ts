import { createReducer, on } from '@ngrx/store';

import { SearchActions } from './search.actions';
import { ISearchState, initialSearchState } from './search.state';

/**
 * Search feature reducer handling all search-related actions.
 * Manages query state, results, overlay visibility, user preferences (pins, saved, recent),
 * and UI state (selected index, preview, command mode).
 */
export const searchReducer = createReducer(
  initialSearchState,

  // Overlay
  on(SearchActions.openOverlay, (state): ISearchState => ({
    ...state,
    overlayOpen: true
  })),
  on(SearchActions.closeOverlay, (state): ISearchState => ({
    ...state,
    overlayOpen: false,
    query: '',
    results: [],
    totalCount: 0,
    loading: false,
    error: null,
    suggestions: [],
    selectedResultIndex: -1,
    previewItem: null
  })),

  // Execute Search
  on(SearchActions.executeSearch, (state, { query }): ISearchState => ({
    ...state,
    query,
    loading: true,
    error: null
  })),
  on(SearchActions.executeSearchSuccess, (state, { response }): ISearchState => ({
    ...state,
    results: response.categories,
    totalCount: response.totalCount,
    timedOutModules: response.timedOutModules,
    loading: false
  })),
  on(SearchActions.executeSearchFailure, (state, { error }): ISearchState => ({
    ...state,
    error,
    loading: false
  })),

  // Clear Search
  on(SearchActions.clearSearch, (state): ISearchState => ({
    ...state,
    query: '',
    results: [],
    totalCount: 0,
    loading: false,
    error: null,
    suggestions: [],
    selectedResultIndex: -1,
    previewItem: null
  })),

  // Tabs
  on(SearchActions.setActiveTab, (state, { tab }): ISearchState => ({
    ...state,
    activeTab: tab
  })),

  // Recent Searches
  on(SearchActions.addRecentSearch, (state, { search }): ISearchState => ({
    ...state,
    recentSearches: [search, ...state.recentSearches.filter(r => r.id !== search.id)]
  })),
  on(SearchActions.clearRecentSearches, (state): ISearchState => ({
    ...state,
    recentSearches: []
  })),
  on(SearchActions.loadRecentSearchesSuccess, (state, { searches }): ISearchState => ({
    ...state,
    recentSearches: searches
  })),

  // Pinned Items
  on(SearchActions.pinItemSuccess, (state, { item }): ISearchState => ({
    ...state,
    pinnedItems: [...state.pinnedItems, item]
  })),
  on(SearchActions.unpinItemSuccess, (state, { id }): ISearchState => ({
    ...state,
    pinnedItems: state.pinnedItems.filter(p => p.id !== id)
  })),
  on(SearchActions.loadPinnedItemsSuccess, (state, { items }): ISearchState => ({
    ...state,
    pinnedItems: items
  })),

  // Suggestions
  on(SearchActions.loadSuggestionsSuccess, (state, { suggestions }): ISearchState => ({
    ...state,
    suggestions
  })),

  // Advanced Filters
  on(SearchActions.setAdvancedFilters, (state, { filters }): ISearchState => ({
    ...state,
    advancedFilters: { ...state.advancedFilters, ...filters }
  })),
  on(SearchActions.clearAdvancedFilters, (state): ISearchState => ({
    ...state,
    advancedFilters: {
      modules: [],
      statuses: [],
      dateFrom: null,
      dateTo: null,
      createdBy: null,
      tags: []
    }
  })),

  // Result Selection
  on(SearchActions.selectResult, (state, { index }): ISearchState => ({
    ...state,
    selectedResultIndex: index
  })),

  // Preview
  on(SearchActions.loadPreviewSuccess, (state, { preview }): ISearchState => ({
    ...state,
    previewItem: state.results
      .flatMap(c => c.results)
      .find(r => r.entityId === preview.entityId) ?? state.previewItem
  })),
  on(SearchActions.loadPreviewFailure, (state): ISearchState => ({
    ...state,
    previewItem: null
  })),

  // Saved Searches
  on(SearchActions.saveSearchSuccess, (state, { savedSearch }): ISearchState => ({
    ...state,
    savedSearches: [...state.savedSearches, savedSearch]
  })),
  on(SearchActions.deleteSavedSearchSuccess, (state, { id }): ISearchState => ({
    ...state,
    savedSearches: state.savedSearches.filter(s => s.id !== id)
  })),
  on(SearchActions.loadSavedSearchesSuccess, (state, { searches }): ISearchState => ({
    ...state,
    savedSearches: searches
  })),

  // Command Mode
  on(SearchActions.toggleCommandMode, (state, { enabled }): ISearchState => ({
    ...state,
    commandMode: enabled
  }))
);
