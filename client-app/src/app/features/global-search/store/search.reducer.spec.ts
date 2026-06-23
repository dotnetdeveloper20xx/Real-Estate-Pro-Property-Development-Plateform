import * as fc from 'fast-check';
import { searchReducer } from './search.reducer';
import { SearchActions } from './search.actions';
import { ISearchState } from './search.state';

describe('Search Reducer Property Tests', () => {
  // Helper to generate arbitrary search states
  const arbitraryState: fc.Arbitrary<ISearchState> = fc.record({
    query: fc.string(),
    results: fc.constant([]),
    totalCount: fc.nat(),
    loading: fc.boolean(),
    error: fc.option(fc.string(), { nil: null }),
    activeTab: fc.string(),
    recentSearches: fc.constant([]),
    pinnedItems: fc.constant([]),
    suggestions: fc.constant([]),
    advancedFilters: fc.constant({ modules: [], statuses: [], dateFrom: null, dateTo: null, createdBy: null, tags: [] }),
    overlayOpen: fc.boolean(),
    selectedResultIndex: fc.integer(),
    previewItem: fc.constant(null),
    savedSearches: fc.constant([]),
    commandMode: fc.boolean(),
    timedOutModules: fc.constant([])
  });

  /**
   * **Validates: Requirements 14.5**
   *
   * Property 17: ClearSearch state preservation
   * Random states → verify reset fields (query, results, totalCount, loading, error, suggestions)
   * and preserved fields (recentSearches, pinnedItems, activeTab, advancedFilters)
   */
  describe('Property 17: ClearSearch state preservation', () => {
    it('resets query, results, totalCount, loading, error, suggestions while preserving recentSearches, pinnedItems, activeTab, advancedFilters', () => {
      fc.assert(fc.property(arbitraryState, (state) => {
        const nextState = searchReducer(state, SearchActions.clearSearch());

        // Reset fields
        expect(nextState.query).toBe('');
        expect(nextState.results).toEqual([]);
        expect(nextState.totalCount).toBe(0);
        expect(nextState.loading).toBe(false);
        expect(nextState.error).toBeNull();
        expect(nextState.suggestions).toEqual([]);

        // Preserved fields
        expect(nextState.recentSearches).toBe(state.recentSearches);
        expect(nextState.pinnedItems).toBe(state.pinnedItems);
        expect(nextState.activeTab).toBe(state.activeTab);
        expect(nextState.advancedFilters).toBe(state.advancedFilters);
      }));
    });
  });

  /**
   * **Validates: Requirements 14.6**
   *
   * Property 18: Failure action state preservation
   * Random states with results → verify error set, loading false, query and results preserved
   */
  describe('Property 18: Failure action state preservation', () => {
    it('sets error, loading=false, preserves query and results', () => {
      fc.assert(fc.property(arbitraryState, fc.string({ minLength: 1 }), (state, errorMsg) => {
        const nextState = searchReducer(state, SearchActions.executeSearchFailure({ error: errorMsg }));

        expect(nextState.error).toBe(errorMsg);
        expect(nextState.loading).toBe(false);
        // Query and results preserved (not reset)
        expect(nextState.query).toBe(state.query);
        expect(nextState.results).toBe(state.results);
      }));
    });
  });
});
