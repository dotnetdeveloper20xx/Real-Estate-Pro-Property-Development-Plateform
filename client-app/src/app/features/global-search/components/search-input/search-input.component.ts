import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  inject,
  OnDestroy,
  Output,
  ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { SearchActions } from '../../store/search.actions';
import { selectSearchLoading } from '../../store/search.selectors';

/**
 * Search input component with debounced typing, query normalization,
 * loading state indication, and auto-focus.
 *
 * Dispatches `SearchActions.executeSearch` when the normalized query meets
 * the minimum length threshold (1 character). Dispatches `SearchActions.clearSearch`
 * when the input is cleared or Escape is pressed.
 */
@Component({
  selector: 'app-search-input',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="relative flex items-center w-full">
      <!-- Search icon -->
      <span
        class="absolute left-3 text-base-content/50 pointer-events-none material-symbols-outlined text-xl"
        aria-hidden="true"
      >
        search
      </span>

      <!-- Search input -->
      <input
        #searchInput
        type="text"
        class="input input-bordered w-full pl-10 pr-10 bg-base-200 focus:bg-base-100 transition-colors"
        [class.pr-16]="loading$ | async"
        placeholder="Search projects, documents, people..."
        aria-label="Search across all modules"
        autocomplete="off"
        spellcheck="false"
        (input)="onInput($event)"
        (keydown.escape)="onEscape($event)"
      />

      <!-- Loading spinner -->
      @if (loading$ | async) {
        <span
          class="absolute right-10 loading loading-spinner loading-sm text-primary"
          aria-busy="true"
          aria-label="Searching..."
        ></span>
      }

      <!-- Clear button -->
      @if (currentQuery.length > 0) {
        <button
          type="button"
          class="absolute right-3 btn btn-ghost btn-xs btn-circle"
          aria-label="Clear search"
          (click)="onClear()"
        >
          <span class="material-symbols-outlined text-base" aria-hidden="true">close</span>
        </button>
      }
    </div>
  `
})
export class SearchInputComponent implements AfterViewInit, OnDestroy {
  @ViewChild('searchInput', { static: true }) searchInputRef!: ElementRef<HTMLInputElement>;

  /** Emitted when the query drops below the minimum threshold (shows recent/pinned). */
  @Output() belowThreshold = new EventEmitter<void>();

  private readonly store = inject(Store);

  /** Observable loading state from the store. */
  loading$ = this.store.select(selectSearchLoading);

  /** Current raw query value for template binding. */
  currentQuery = '';

  /** Subject that receives raw input values for debouncing. */
  private readonly querySubject$ = new Subject<string>();

  /** Subscription to the debounced query stream. */
  private querySubscription: Subscription;

  /** Minimum query length required to trigger a search. */
  private readonly MIN_QUERY_LENGTH = 1;

  /** Maximum query length allowed (truncated beyond this). */
  private readonly MAX_QUERY_LENGTH = 200;

  /** Debounce duration in milliseconds. */
  private readonly DEBOUNCE_MS = 300;

  constructor() {
    this.querySubscription = this.querySubject$
      .pipe(
        debounceTime(this.DEBOUNCE_MS),
        distinctUntilChanged()
      )
      .subscribe(normalizedQuery => {
        if (normalizedQuery.length >= this.MIN_QUERY_LENGTH) {
          this.store.dispatch(SearchActions.executeSearch({ query: normalizedQuery }));
        } else {
          this.store.dispatch(SearchActions.clearSearch());
          this.belowThreshold.emit();
        }
      });
  }

  ngAfterViewInit(): void {
    this.searchInputRef.nativeElement.focus();
  }

  ngOnDestroy(): void {
    this.querySubscription.unsubscribe();
    this.querySubject$.complete();
  }

  /**
   * Handles input events from the search text field.
   * Normalizes the query and pushes it through the debounced subject.
   */
  onInput(event: Event): void {
    const rawValue = (event.target as HTMLInputElement).value;
    const normalized = this.normalizeQuery(rawValue);
    this.currentQuery = rawValue;

    // If empty after normalization, dispatch clear immediately (no debounce needed)
    if (normalized.length === 0) {
      this.store.dispatch(SearchActions.clearSearch());
      this.belowThreshold.emit();
      return;
    }

    this.querySubject$.next(normalized);
  }

  /**
   * Handles Escape key press to clear the search input and cancel in-flight requests.
   */
  onEscape(event: Event): void {
    event.preventDefault();
    this.clearInput();
  }

  /**
   * Handles the clear button click.
   */
  onClear(): void {
    this.clearInput();
    this.searchInputRef.nativeElement.focus();
  }

  /**
   * Normalizes the search query:
   * - Trim leading/trailing whitespace
   * - Convert to lowercase
   * - Collapse multiple spaces into one
   * - Truncate to MAX_QUERY_LENGTH characters
   */
  private normalizeQuery(input: string): string {
    if (!input) {
      return '';
    }

    let result = input.trim().toLowerCase();
    result = result.replace(/\s+/g, ' ');

    if (result.length > this.MAX_QUERY_LENGTH) {
      result = result.substring(0, this.MAX_QUERY_LENGTH);
    }

    return result;
  }

  /**
   * Clears the input field, resets state, and dispatches clearSearch.
   */
  private clearInput(): void {
    this.currentQuery = '';
    this.searchInputRef.nativeElement.value = '';
    this.store.dispatch(SearchActions.clearSearch());
    this.belowThreshold.emit();
  }
}
