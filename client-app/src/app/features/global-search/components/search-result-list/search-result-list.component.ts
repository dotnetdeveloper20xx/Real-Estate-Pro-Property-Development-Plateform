import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output
} from '@angular/core';
import { CommonModule } from '@angular/common';

import { ISearchCategoryResult, ISearchResultItem } from '../../models/search.model';
import { SearchResultCardComponent } from '../search-result-card/search-result-card.component';

/**
 * Search result list component that renders grouped results by category.
 * Shows a maximum of 5 results per category with a "View all" link.
 * Uses an `aria-live="polite"` region to announce result counts to screen readers.
 */
@Component({
  selector: 'app-search-result-list',
  standalone: true,
  imports: [CommonModule, SearchResultCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Accessibility: announce result count -->
    <div
      class="sr-only"
      aria-live="polite"
      aria-atomic="true"
    >
      {{ getResultCountAnnouncement() }}
    </div>

    <div
      class="flex flex-col gap-4"
      role="listbox"
      aria-label="Search results"
    >
      @for (category of results; track category.category) {
        <div class="flex flex-col gap-1">
          <!-- Category header -->
          <div class="flex items-center justify-between px-4 py-1">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-sm text-base-content/50" aria-hidden="true">
                {{ category.icon }}
              </span>
              <span class="text-xs font-semibold uppercase text-base-content/50 tracking-wide">
                {{ category.category }}
              </span>
              <span class="badge badge-xs badge-ghost">{{ category.totalCount }}</span>
            </div>

            @if (category.totalCount > maxPerCategory) {
              <button
                type="button"
                class="btn btn-ghost btn-xs text-primary"
                (click)="onViewAll(category.category)"
              >
                View all ({{ category.totalCount }})
              </button>
            }
          </div>

          <!-- Result cards -->
          @for (result of category.results | slice:0:maxPerCategory; track result.entityId; let i = $index) {
            <app-search-result-card
              [result]="result"
              [isSelected]="getGlobalIndex(category, i) === selectedIndex"
              [index]="getGlobalIndex(category, i)"
              (navigate)="onNavigate($event)"
              (select)="onSelect($event)"
            />
          }
        </div>
      }

      @if (results.length === 0) {
        <div class="flex flex-col items-center justify-center py-8 text-base-content/50">
          <span class="material-symbols-outlined text-4xl mb-2" aria-hidden="true">search_off</span>
          <p class="text-sm">No results found</p>
        </div>
      }
    </div>
  `
})
export class SearchResultListComponent {
  /** Grouped search results by category. */
  @Input() results: ISearchCategoryResult[] = [];

  /** Index of the currently keyboard-selected result in the flat list. */
  @Input() selectedIndex = -1;

  /** Emits the result when the user navigates to it. */
  @Output() navigateToResult = new EventEmitter<ISearchResultItem>();

  /** Emits the index when a result is selected (hovered). */
  @Output() selectResult = new EventEmitter<number>();

  /** Maximum results shown per category. */
  readonly maxPerCategory = 5;

  /** Calculate the global flat index for a result within its category. */
  getGlobalIndex(currentCategory: ISearchCategoryResult, localIndex: number): number {
    let offset = 0;
    for (const category of this.results) {
      if (category.category === currentCategory.category) {
        return offset + localIndex;
      }
      offset += Math.min(category.results.length, this.maxPerCategory);
    }
    return offset + localIndex;
  }

  /** Generate an accessible result count announcement. */
  getResultCountAnnouncement(): string {
    const total = this.results.reduce((sum, cat) => sum + cat.totalCount, 0);
    if (total === 0) {
      return 'No results found';
    }
    const categoryCount = this.results.length;
    return `${total} results found across ${categoryCount} categories`;
  }

  /** Handle navigation to a result. */
  onNavigate(result: ISearchResultItem): void {
    this.navigateToResult.emit(result);
  }

  /** Handle result selection. */
  onSelect(index: number): void {
    this.selectResult.emit(index);
  }

  /** Handle "View all" click for a category (dispatches tab change). */
  onViewAll(_category: string): void {
    // Parent component will handle tab switching via the event
  }
}
