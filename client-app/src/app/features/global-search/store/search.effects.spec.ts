import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { of, throwError, Subject } from 'rxjs';
import { SearchEffects } from './search.effects';
import { SearchActions } from './search.actions';
import { SearchService } from '../services/search.service';
import { ToastService } from '@core/services/toast.service';
import { Action } from '@ngrx/store';
import { ISearchResponse } from '../models';

/**
 * Unit tests for SearchEffects.
 * Tests debounce timing (300ms), switchMap cancellation, and error handling.
 *
 * Validates: Requirements 14.3, 14.4
 */
describe('SearchEffects', () => {
  let effects: SearchEffects;
  let actions$: Subject<Action>;
  let searchService: jasmine.SpyObj<SearchService>;
  let toastService: jasmine.SpyObj<ToastService>;

  const mockResponse: ISearchResponse = {
    categories: [
      {
        category: 'Land',
        icon: 'landscape',
        priority: 1,
        totalCount: 2,
        results: []
      }
    ],
    totalCount: 2,
    timedOutModules: [],
    query: 'test',
    pagination: { page: 1, pageSize: 10, totalCount: 2, totalPages: 1 }
  };

  beforeEach(() => {
    searchService = jasmine.createSpyObj('SearchService', [
      'search',
      'getSuggestions',
      'getRecentSearches',
      'getPinnedItems',
      'getSavedSearches',
      'pinItem',
      'unpinItem',
      'saveSearch',
      'deleteSavedSearch',
      'addRecentSearch'
    ]);
    toastService = jasmine.createSpyObj('ToastService', ['showError']);

    actions$ = new Subject<Action>();

    TestBed.configureTestingModule({
      providers: [
        SearchEffects,
        provideMockActions(() => actions$),
        { provide: SearchService, useValue: searchService },
        { provide: ToastService, useValue: toastService }
      ]
    });

    effects = TestBed.inject(SearchEffects);
  });

  describe('executeSearch$', () => {
    it('should debounce by 300ms before calling search service', fakeAsync(() => {
      searchService.search.and.returnValue(of(mockResponse));
      const results: Action[] = [];

      effects.executeSearch$.subscribe(action => results.push(action));

      actions$.next(SearchActions.executeSearch({ query: 'test' }));

      // Before debounce completes, no call should have been made
      tick(200);
      expect(searchService.search).not.toHaveBeenCalled();

      // After 300ms debounce, service should be called
      tick(100);
      expect(searchService.search).toHaveBeenCalledWith({ q: 'test' });
      expect(results.length).toBe(1);
      expect(results[0].type).toBe(SearchActions.executeSearchSuccess.type);
    }));

    it('should reset debounce timer when new action is dispatched before 300ms', fakeAsync(() => {
      searchService.search.and.returnValue(of(mockResponse));
      const results: Action[] = [];

      effects.executeSearch$.subscribe(action => results.push(action));

      actions$.next(SearchActions.executeSearch({ query: 'te' }));
      tick(200);

      // Dispatch another action before debounce completes
      actions$.next(SearchActions.executeSearch({ query: 'test' }));
      tick(200);

      // First query should NOT have fired (timer was reset)
      expect(searchService.search).not.toHaveBeenCalled();

      // After another 100ms (total 300ms from second dispatch), second query fires
      tick(100);
      expect(searchService.search).toHaveBeenCalledTimes(1);
      expect(searchService.search).toHaveBeenCalledWith({ q: 'test' });
    }));

    it('should cancel in-flight request via switchMap when new search dispatched', fakeAsync(() => {
      const delayedResponse$ = new Subject<ISearchResponse>();
      const immediateResponse$ = of(mockResponse);

      searchService.search.and.returnValues(delayedResponse$, immediateResponse$);
      const results: Action[] = [];

      effects.executeSearch$.subscribe(action => results.push(action));

      // First search — dispatched and debounced
      actions$.next(SearchActions.executeSearch({ query: 'first' }));
      tick(300);
      expect(searchService.search).toHaveBeenCalledTimes(1);

      // Second search — switchMap cancels the first in-flight observable
      actions$.next(SearchActions.executeSearch({ query: 'second' }));
      tick(300);
      expect(searchService.search).toHaveBeenCalledTimes(2);

      // Only the second response should appear in results
      expect(results.length).toBe(1);
      expect(results[0].type).toBe(SearchActions.executeSearchSuccess.type);
    }));

    it('should dispatch ExecuteSearchFailure on API error', fakeAsync(() => {
      const errorMessage = 'Network error';
      searchService.search.and.returnValue(throwError(() => new Error(errorMessage)));
      const results: Action[] = [];

      effects.executeSearch$.subscribe(action => results.push(action));

      actions$.next(SearchActions.executeSearch({ query: 'test' }));
      tick(300);

      expect(results.length).toBe(1);
      expect(results[0].type).toBe(SearchActions.executeSearchFailure.type);
      expect((results[0] as ReturnType<typeof SearchActions.executeSearchFailure>).error)
        .toBe(errorMessage);
    }));

    it('should use fallback error message when error.message is empty', fakeAsync(() => {
      searchService.search.and.returnValue(throwError(() => ({})));
      const results: Action[] = [];

      effects.executeSearch$.subscribe(action => results.push(action));

      actions$.next(SearchActions.executeSearch({ query: 'test' }));
      tick(300);

      expect(results.length).toBe(1);
      expect((results[0] as ReturnType<typeof SearchActions.executeSearchFailure>).error)
        .toBe('Search failed');
    }));
  });

  describe('showErrorToast$', () => {
    it('should call toastService.showError on ExecuteSearchFailure', fakeAsync(() => {
      effects.showErrorToast$.subscribe();

      actions$.next(SearchActions.executeSearchFailure({ error: 'Something went wrong' }));
      tick();

      expect(toastService.showError).toHaveBeenCalledWith('Something went wrong');
    }));

    it('should call toastService.showError on LoadPreviewFailure', fakeAsync(() => {
      effects.showErrorToast$.subscribe();

      actions$.next(SearchActions.loadPreviewFailure({ error: 'Preview load failed' }));
      tick();

      expect(toastService.showError).toHaveBeenCalledWith('Preview load failed');
    }));
  });
});
