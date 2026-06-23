import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import {
  map,
  switchMap,
  exhaustMap,
  catchError,
  tap,
  debounceTime,
  filter
} from 'rxjs/operators';

import { SearchActions } from './search.actions';
import { SearchService } from '../services/search.service';
import { ToastService } from '@core/services/toast.service';

/**
 * NgRx effects for the Global Search feature.
 * Handles all side effects including debounced search, suggestions loading,
 * recent searches, pinned items, saved searches, and error toast notifications.
 */
@Injectable()
export class SearchEffects {
  private readonly actions$ = inject(Actions);
  private readonly searchService = inject(SearchService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);

  /**
   * Execute search with 300ms debounce and in-flight request cancellation.
   * Uses switchMap to cancel previous pending requests when a new query arrives.
   * Dispatches ExecuteSearchSuccess or ExecuteSearchFailure.
   */
  readonly executeSearch$ = createEffect(() =>
    this.actions$.pipe(
      ofType(SearchActions.executeSearch),
      debounceTime(300),
      switchMap(({ query }) =>
        this.searchService.search({ q: query }).pipe(
          map(response => SearchActions.executeSearchSuccess({ response })),
          catchError(error =>
            of(SearchActions.executeSearchFailure({
              error: error.message || 'Search failed'
            }))
          )
        )
      )
    )
  );

  /**
   * Load autocomplete suggestions with prefix validation (minimum 2 characters).
   * Uses switchMap to cancel in-flight suggestion requests on new prefix.
   */
  readonly loadSuggestions$ = createEffect(() =>
    this.actions$.pipe(
      ofType(SearchActions.loadSuggestions),
      filter(({ prefix }) => prefix.length >= 2),
      debounceTime(200),
      switchMap(({ prefix }) =>
        this.searchService.getSuggestions(prefix).pipe(
          map(suggestions => SearchActions.loadSuggestionsSuccess({ suggestions })),
          catchError(() => of(SearchActions.loadSuggestionsSuccess({ suggestions: [] })))
        )
      )
    )
  );

  /**
   * Load recent searches from the API.
   */
  readonly loadRecentSearches$ = createEffect(() =>
    this.actions$.pipe(
      ofType(SearchActions.loadRecentSearches),
      exhaustMap(() =>
        this.searchService.getRecentSearches().pipe(
          map(searches => SearchActions.loadRecentSearchesSuccess({ searches })),
          catchError(() => of(SearchActions.loadRecentSearchesSuccess({ searches: [] })))
        )
      )
    )
  );

  /**
   * Load pinned items from the API.
   */
  readonly loadPinnedItems$ = createEffect(() =>
    this.actions$.pipe(
      ofType(SearchActions.loadPinnedItems),
      exhaustMap(() =>
        this.searchService.getPinnedItems().pipe(
          map(items => SearchActions.loadPinnedItemsSuccess({ items })),
          catchError(() => of(SearchActions.loadPinnedItemsSuccess({ items: [] })))
        )
      )
    )
  );

  /**
   * Load saved searches from the API.
   */
  readonly loadSavedSearches$ = createEffect(() =>
    this.actions$.pipe(
      ofType(SearchActions.loadSavedSearches),
      exhaustMap(() =>
        this.searchService.getSavedSearches().pipe(
          map(searches => SearchActions.loadSavedSearchesSuccess({ searches })),
          catchError(() => of(SearchActions.loadSavedSearchesSuccess({ searches: [] })))
        )
      )
    )
  );

  /**
   * Pin an item via API. Dispatches PinItemSuccess on success.
   */
  readonly pinItem$ = createEffect(() =>
    this.actions$.pipe(
      ofType(SearchActions.pinItem),
      exhaustMap(({ entityId, entityType, title, subtitle, icon, category, navigationRoute }) =>
        this.searchService.pinItem(entityId, entityType, title, subtitle, icon, category, navigationRoute).pipe(
          map(item => SearchActions.pinItemSuccess({ item })),
          catchError(error =>
            of(SearchActions.executeSearchFailure({
              error: error.message || 'Failed to pin item'
            }))
          )
        )
      )
    )
  );

  /**
   * Unpin an item via API. Dispatches UnpinItemSuccess on success.
   */
  readonly unpinItem$ = createEffect(() =>
    this.actions$.pipe(
      ofType(SearchActions.unpinItem),
      exhaustMap(({ id }) =>
        this.searchService.unpinItem(id).pipe(
          map(() => SearchActions.unpinItemSuccess({ id })),
          catchError(error =>
            of(SearchActions.executeSearchFailure({
              error: error.message || 'Failed to unpin item'
            }))
          )
        )
      )
    )
  );

  /**
   * Save a search preset via API. Dispatches SaveSearchSuccess on success.
   */
  readonly saveSearch$ = createEffect(() =>
    this.actions$.pipe(
      ofType(SearchActions.saveSearch),
      exhaustMap(({ name, query, filters }) =>
        this.searchService.saveSearch(name, query, filters).pipe(
          map(savedSearch => SearchActions.saveSearchSuccess({ savedSearch })),
          catchError(error =>
            of(SearchActions.executeSearchFailure({
              error: error.message || 'Failed to save search'
            }))
          )
        )
      )
    )
  );

  /**
   * Delete a saved search via API. Dispatches DeleteSavedSearchSuccess on success.
   */
  readonly deleteSavedSearch$ = createEffect(() =>
    this.actions$.pipe(
      ofType(SearchActions.deleteSavedSearch),
      exhaustMap(({ id }) =>
        this.searchService.deleteSavedSearch(id).pipe(
          map(() => SearchActions.deleteSavedSearchSuccess({ id })),
          catchError(error =>
            of(SearchActions.executeSearchFailure({
              error: error.message || 'Failed to delete saved search'
            }))
          )
        )
      )
    )
  );

  /**
   * Persist a recent search entry to the API.
   * This is a fire-and-forget operation — failures are silently ignored.
   */
  readonly addRecentSearch$ = createEffect(() =>
    this.actions$.pipe(
      ofType(SearchActions.addRecentSearch),
      exhaustMap(({ search }) =>
        this.searchService.addRecentSearch(search.query, search.resultCount).pipe(
          map(() => SearchActions.loadRecentSearches()),
          catchError(() => of(SearchActions.loadRecentSearches()))
        )
      )
    )
  );

  /**
   * Show error toast on failure actions.
   * Non-dispatching effect that displays a toast notification for any search failure.
   */
  readonly showErrorToast$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(
          SearchActions.executeSearchFailure,
          SearchActions.loadPreviewFailure
        ),
        tap(({ error }) => {
          this.toastService.showError(error);
        })
      ),
    { dispatch: false }
  );

  /**
   * Navigate to the selected search result's page.
   * Non-dispatching effect that performs router navigation.
   */
  readonly navigateToResult$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(SearchActions.navigateToResult),
        tap(({ result }) => {
          if (result.navigationRoute) {
            this.router.navigateByUrl(result.navigationRoute);
          }
        })
      ),
    { dispatch: false }
  );
}
