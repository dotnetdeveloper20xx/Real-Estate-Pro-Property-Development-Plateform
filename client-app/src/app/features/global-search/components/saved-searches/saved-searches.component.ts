import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IAdvancedFilters, ISavedSearch } from '../../models/search.model';

/**
 * SavedSearchesComponent displays saved search presets and provides
 * functionality to load, delete, and save new searches.
 *
 * Features:
 * - List saved searches with name and query preview
 * - Load button to execute a saved search
 * - Delete button with confirmation dialog
 * - Save form with name input to save the current search
 *
 * Presentational component — receives data via input, emits events via output.
 */
@Component({
  selector: 'app-saved-searches',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-base-100 rounded-lg">
      <!-- Header -->
      <div class="px-3 py-2 border-b border-base-300">
        <span class="text-xs font-semibold text-base-content/50 uppercase tracking-wider">
          Saved Searches
        </span>
      </div>

      <!-- Save new search form -->
      @if (showSaveForm()) {
        <div class="px-4 py-3 border-b border-base-300">
          <div class="flex items-center gap-2">
            <input
              type="text"
              class="input input-bordered input-sm flex-1"
              placeholder="Name this search..."
              [ngModel]="newSearchName()"
              (ngModelChange)="newSearchName.set($event)"
              aria-label="Saved search name"
              (keydown.enter)="onSaveSearch()"
            />
            <button
              class="btn btn-primary btn-sm"
              [disabled]="!newSearchName().trim()"
              (click)="onSaveSearch()"
              aria-label="Save current search"
            >
              Save
            </button>
            <button
              class="btn btn-ghost btn-sm"
              (click)="showSaveForm.set(false)"
              aria-label="Cancel saving"
            >
              Cancel
            </button>
          </div>
        </div>
      } @else {
        <div class="px-4 py-2 border-b border-base-300">
          <button
            class="btn btn-ghost btn-xs text-primary"
            (click)="showSaveForm.set(true)"
            aria-label="Save current search as preset"
          >
            <span class="material-symbols-outlined text-sm" aria-hidden="true">bookmark_add</span>
            Save current search
          </button>
        </div>
      }

      <!-- Saved searches list -->
      @if (savedSearches().length > 0) {
        <ul class="py-1" role="list" aria-label="Saved searches">
          @for (search of savedSearches(); track search.id) {
            <li class="group">
              <div class="flex items-center gap-2 px-4 py-2 hover:bg-base-200 transition-colors rounded-lg">
                <button
                  class="flex-1 min-w-0 text-left"
                  [attr.aria-label]="'Load saved search: ' + search.name"
                  (click)="onLoadSearch(search)"
                >
                  <div class="flex items-center gap-2">
                    <span class="material-symbols-outlined text-sm text-base-content/40" aria-hidden="true">
                      bookmark
                    </span>
                    <div class="flex-1 min-w-0">
                      <span class="text-sm text-base-content font-medium truncate block">
                        {{ search.name }}
                      </span>
                      <span class="text-xs text-base-content/50 truncate block">
                        "{{ search.query }}"
                      </span>
                    </div>
                  </div>
                </button>
                <div class="flex items-center gap-1 shrink-0">
                  <button
                    class="btn btn-ghost btn-xs"
                    aria-label="Load search"
                    title="Load"
                    (click)="onLoadSearch(search)"
                  >
                    <span class="material-symbols-outlined text-sm" aria-hidden="true">play_arrow</span>
                  </button>
                  @if (confirmDeleteId() === search.id) {
                    <button
                      class="btn btn-error btn-xs"
                      aria-label="Confirm delete"
                      (click)="onConfirmDelete(search.id)"
                    >
                      Confirm
                    </button>
                    <button
                      class="btn btn-ghost btn-xs"
                      aria-label="Cancel delete"
                      (click)="confirmDeleteId.set(null)"
                    >
                      Cancel
                    </button>
                  } @else {
                    <button
                      class="btn btn-ghost btn-xs opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label="Delete saved search"
                      title="Delete"
                      (click)="onRequestDelete(search.id)"
                    >
                      <span class="material-symbols-outlined text-sm text-error" aria-hidden="true">
                        delete
                      </span>
                    </button>
                  }
                </div>
              </div>
            </li>
          }
        </ul>
      } @else {
        <div class="px-4 py-6 text-center">
          <span class="material-symbols-outlined text-2xl text-base-content/30 mb-2" aria-hidden="true">
            bookmark_border
          </span>
          <p class="text-sm text-base-content/60">No saved searches</p>
          <p class="text-xs text-base-content/40 mt-1">Save frequently used searches for quick access</p>
        </div>
      }
    </div>
  `
})
export class SavedSearchesComponent {
  /** List of saved searches to display */
  readonly savedSearches = input<ISavedSearch[]>([]);

  /** Current query to use when saving */
  readonly currentQuery = input<string>('');

  /** Current filters to use when saving */
  readonly currentFilters = input<IAdvancedFilters>({
    modules: [],
    statuses: [],
    dateFrom: null,
    dateTo: null,
    createdBy: null,
    tags: []
  });

  /** Emits a saved search to load/execute */
  readonly loadSearch = output<ISavedSearch>();

  /** Emits the id of a saved search to delete */
  readonly deleteSearch = output<string>();

  /** Emits save request with name, query, and filters */
  readonly saveCurrentSearch = output<{ name: string; query: string; filters: IAdvancedFilters }>();

  /** Whether the save form is visible */
  readonly showSaveForm = signal<boolean>(false);

  /** Name input for new saved search */
  readonly newSearchName = signal<string>('');

  /** Track which search is pending delete confirmation */
  readonly confirmDeleteId = signal<string | null>(null);

  /**
   * Load a saved search.
   */
  onLoadSearch(search: ISavedSearch): void {
    this.loadSearch.emit(search);
  }

  /**
   * Request deletion — show confirmation UI.
   */
  onRequestDelete(id: string): void {
    this.confirmDeleteId.set(id);
  }

  /**
   * Confirm and emit deletion.
   */
  onConfirmDelete(id: string): void {
    this.deleteSearch.emit(id);
    this.confirmDeleteId.set(null);
  }

  /**
   * Save the current search with the entered name.
   */
  onSaveSearch(): void {
    const name = this.newSearchName().trim();
    if (!name) return;

    this.saveCurrentSearch.emit({
      name,
      query: this.currentQuery(),
      filters: this.currentFilters()
    });

    this.newSearchName.set('');
    this.showSaveForm.set(false);
  }
}
