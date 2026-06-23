import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  ISearchResponse,
  ISearchQueryParams,
  ISuggestion,
  IRecentSearch,
  IPinnedItem,
  ISavedSearch,
  IAdvancedFilters
} from '../models';

/**
 * SearchService handles all HTTP communication with the search API endpoints.
 * All methods return typed Observables for integration with NgRx effects.
 */
@Injectable({ providedIn: 'root' })
export class SearchService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/v1/search';

  /**
   * Execute a search query with optional filters and pagination.
   * GET /api/v1/search?q=...&modules=...&page=1&pageSize=10
   */
  search(params: ISearchQueryParams): Observable<ISearchResponse> {
    return this.http.get<ISearchResponse>(this.baseUrl, {
      params: this.toHttpParams(params)
    });
  }

  /**
   * Get autocomplete suggestions for a given prefix.
   * GET /api/v1/search/suggestions?prefix=...&limit=8
   */
  getSuggestions(prefix: string, limit: number = 8): Observable<ISuggestion[]> {
    const params = new HttpParams()
      .set('prefix', prefix)
      .set('limit', limit.toString());

    return this.http.get<ISuggestion[]>(`${this.baseUrl}/suggestions`, { params });
  }

  /**
   * Get the current user's recent searches ordered by most recent first.
   * GET /api/v1/search/recent
   */
  getRecentSearches(): Observable<IRecentSearch[]> {
    return this.http.get<IRecentSearch[]>(`${this.baseUrl}/recent`);
  }

  /**
   * Get the current user's pinned items.
   * GET /api/v1/search/pinned
   */
  getPinnedItems(): Observable<IPinnedItem[]> {
    return this.http.get<IPinnedItem[]>(`${this.baseUrl}/pinned`);
  }

  /**
   * Pin an entity for quick access from the search overlay.
   * POST /api/v1/search/pinned
   */
  pinItem(
    entityId: string,
    entityType: string,
    title: string,
    subtitle: string | null,
    icon: string,
    category: string,
    navigationRoute: string
  ): Observable<IPinnedItem> {
    return this.http.post<IPinnedItem>(`${this.baseUrl}/pinned`, {
      entityId,
      entityType,
      title,
      subtitle,
      icon,
      category,
      navigationRoute
    });
  }

  /**
   * Unpin a previously pinned item.
   * DELETE /api/v1/search/pinned/{id}
   */
  unpinItem(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/pinned/${id}`);
  }

  /**
   * Get the current user's saved search presets.
   * GET /api/v1/search/saved
   */
  getSavedSearches(): Observable<ISavedSearch[]> {
    return this.http.get<ISavedSearch[]>(`${this.baseUrl}/saved`);
  }

  /**
   * Save a search preset with query, filters, and user-provided name.
   * POST /api/v1/search/saved
   */
  saveSearch(name: string, query: string, filters: IAdvancedFilters): Observable<ISavedSearch> {
    return this.http.post<ISavedSearch>(`${this.baseUrl}/saved`, {
      name,
      query,
      filters
    });
  }

  /**
   * Delete a saved search preset.
   * DELETE /api/v1/search/saved/{id}
   */
  deleteSavedSearch(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/saved/${id}`);
  }

  /**
   * Persist a recent search entry to the server.
   * POST /api/v1/search/recent
   */
  addRecentSearch(query: string, resultCount: number): Observable<IRecentSearch> {
    return this.http.post<IRecentSearch>(`${this.baseUrl}/recent`, {
      query,
      resultCount
    });
  }

  /**
   * Convert ISearchQueryParams to Angular HttpParams, handling arrays
   * by joining with commas for modules and statuses.
   */
  private toHttpParams(params: ISearchQueryParams): HttpParams {
    let httpParams = new HttpParams().set('q', params.q);

    if (params.modules && params.modules.length > 0) {
      httpParams = httpParams.set('modules', params.modules.join(','));
    }

    if (params.statuses && params.statuses.length > 0) {
      httpParams = httpParams.set('statuses', params.statuses.join(','));
    }

    if (params.dateFrom) {
      httpParams = httpParams.set('dateFrom', params.dateFrom);
    }

    if (params.dateTo) {
      httpParams = httpParams.set('dateTo', params.dateTo);
    }

    if (params.createdBy) {
      httpParams = httpParams.set('createdBy', params.createdBy);
    }

    if (params.page != null) {
      httpParams = httpParams.set('page', params.page.toString());
    }

    if (params.pageSize != null) {
      httpParams = httpParams.set('pageSize', params.pageSize.toString());
    }

    if (params.maxPerCategory != null) {
      httpParams = httpParams.set('maxPerCategory', params.maxPerCategory.toString());
    }

    return httpParams;
  }
}
