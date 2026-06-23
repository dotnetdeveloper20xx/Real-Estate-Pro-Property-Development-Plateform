import {
  IAdvancedFilters,
  IPinnedItem,
  IRecentSearch,
  ISavedSearch,
  ISearchCategoryResult,
  ISearchResultItem,
  ISuggestion
} from '../models';

/**
 * NgRx state interface for the Global Search feature.
 * Holds all search-related state including query, results, UI state, and user data.
 */
export interface ISearchState {
  readonly query: string;
  readonly results: readonly ISearchCategoryResult[];
  readonly totalCount: number;
  readonly loading: boolean;
  readonly error: string | null;
  readonly activeTab: string;
  readonly recentSearches: readonly IRecentSearch[];
  readonly pinnedItems: readonly IPinnedItem[];
  readonly suggestions: readonly ISuggestion[];
  readonly advancedFilters: IAdvancedFilters;
  readonly overlayOpen: boolean;
  readonly selectedResultIndex: number;
  readonly previewItem: ISearchResultItem | null;
  readonly savedSearches: readonly ISavedSearch[];
  readonly commandMode: boolean;
  readonly timedOutModules: readonly string[];
}

/**
 * Default advanced filter configuration with no filters applied.
 */
const defaultAdvancedFilters: IAdvancedFilters = {
  modules: [],
  statuses: [],
  dateFrom: null,
  dateTo: null,
  createdBy: null,
  tags: []
};

/**
 * Initial state for the search feature slice.
 * All collections start empty, overlay closed, no query active.
 */
export const initialSearchState: ISearchState = {
  query: '',
  results: [],
  totalCount: 0,
  loading: false,
  error: null,
  activeTab: 'all',
  recentSearches: [],
  pinnedItems: [],
  suggestions: [],
  advancedFilters: defaultAdvancedFilters,
  overlayOpen: false,
  selectedResultIndex: -1,
  previewItem: null,
  savedSearches: [],
  commandMode: false,
  timedOutModules: []
};
