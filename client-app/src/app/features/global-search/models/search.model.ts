/**
 * Core search models for the Global Search feature.
 * These interfaces define the API contract between frontend and backend search endpoints.
 */

/**
 * Response from the main search API endpoint.
 */
export interface ISearchResponse {
  readonly categories: ISearchCategoryResult[];
  readonly totalCount: number;
  readonly timedOutModules: string[];
  readonly query: string;
  readonly pagination: IPaginationMeta;
}

/**
 * A group of search results belonging to a single module category.
 */
export interface ISearchCategoryResult {
  readonly category: string;
  readonly icon: string;
  readonly priority: number;
  readonly totalCount: number;
  readonly results: ISearchResultItem[];
}

/**
 * A single search result item with all display metadata.
 */
export interface ISearchResultItem {
  readonly entityId: string;
  readonly entityType: string;
  readonly title: string;
  readonly highlightedTitle: string | null;
  readonly subtitle: string;
  readonly highlightedSubtitle: string | null;
  readonly status: string | null;
  readonly statusVariant: string | null;
  readonly icon: string;
  readonly category: string;
  readonly moduleBadge: string;
  readonly navigationRoute: string;
  readonly lastUpdated: string;
  readonly breadcrumb: string | null;
  readonly relevancyScore: number;
  readonly quickActions: IQuickAction[];
}

/**
 * A quick action available on a search result card.
 */
export interface IQuickAction {
  readonly label: string;
  readonly icon: string;
  readonly route?: string;
  readonly action?: string;
  readonly permission?: string;
}

/**
 * A previously executed search query stored for the user.
 */
export interface IRecentSearch {
  readonly id: string;
  readonly query: string;
  readonly resultCount: number;
  readonly searchedAt: string;
}

/**
 * An item pinned by the user for quick access from the search overlay.
 */
export interface IPinnedItem {
  readonly id: string;
  readonly entityId: string;
  readonly entityType: string;
  readonly title: string;
  readonly subtitle: string | null;
  readonly icon: string;
  readonly category: string;
  readonly navigationRoute: string;
  readonly pinnedAt: string;
}

/**
 * A user-defined search preset with query and filter configuration.
 */
export interface ISavedSearch {
  readonly id: string;
  readonly name: string;
  readonly query: string;
  readonly filters: IAdvancedFilters;
  readonly savedAt: string;
  readonly lastUsedAt: string | null;
}

/**
 * Advanced filter configuration for narrowing search results.
 */
export interface IAdvancedFilters {
  readonly modules: string[];
  readonly statuses: string[];
  readonly dateFrom: string | null;
  readonly dateTo: string | null;
  readonly createdBy: string | null;
  readonly tags: string[];
}

/**
 * An autocomplete or type-ahead suggestion.
 */
export interface ISuggestion {
  readonly text: string;
  readonly type: string;
  readonly icon: string;
  readonly route?: string;
}

/**
 * Pagination metadata for search result sets.
 */
export interface IPaginationMeta {
  readonly page: number;
  readonly pageSize: number;
  readonly totalCount: number;
  readonly totalPages: number;
}

/**
 * Query parameters sent to the search API endpoint.
 */
export interface ISearchQueryParams {
  readonly q: string;
  readonly modules?: string[];
  readonly statuses?: string[];
  readonly dateFrom?: string;
  readonly dateTo?: string;
  readonly createdBy?: string;
  readonly page?: number;
  readonly pageSize?: number;
  readonly maxPerCategory?: number;
}
