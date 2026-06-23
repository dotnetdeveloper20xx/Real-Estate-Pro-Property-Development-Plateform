import {
  Component,
  ChangeDetectionStrategy,
  input,
  output
} from '@angular/core';
import { CommonModule } from '@angular/common';

import { IRecentSearch } from '../../models/search.model';

/**
 * RecentSearchesComponent displays a list of previously executed searches.
 * Each entry shows the query text, result count, and timestamp.
 * Clicking an entry re-executes the search by emitting the query string.
 *
 * Presentational component — receives data via input, emits events via output.
 */
@Component({
  selector: 'app-recent-searches',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (recentSearches().length > 0) {
      <div class="bg-base-100 rounded-lg">
        <div class="px-3 py-2 border-b border-base-300">
          <span class="text-xs font-semibold text-base-content/50 uppercase tracking-wider">
            Recent Searches
          </span>
        </div>
        <ul class="py-1" role="list" aria-label="Recent searches">
          @for (search of recentSearches(); track search.id) {
            <li>
              <button
                class="flex items-center gap-3 w-full px-4 py-2 text-left rounded-lg hover:bg-base-200 transition-colors"
                [attr.aria-label]="'Re-execute search: ' + search.query"
                (click)="onSearchSelected(search.query)"
              >
                <span
                  class="material-symbols-outlined text-sm text-base-content/40"
                  aria-hidden="true"
                >
                  history
                </span>
                <div class="flex-1 min-w-0">
                  <span class="text-sm text-base-content truncate block">{{ search.query }}</span>
                </div>
                <div class="flex items-center gap-2 shrink-0">
                  <span class="text-xs text-base-content/40">
                    {{ search.resultCount }} results
                  </span>
                  <span class="text-xs text-base-content/30">·</span>
                  <time
                    class="text-xs text-base-content/40"
                    [attr.datetime]="search.searchedAt"
                  >
                    {{ formatTimestamp(search.searchedAt) }}
                  </time>
                </div>
              </button>
            </li>
          }
        </ul>
      </div>
    } @else {
      <div class="px-4 py-6 text-center bg-base-100 rounded-lg">
        <span class="material-symbols-outlined text-2xl text-base-content/30 mb-2" aria-hidden="true">
          history
        </span>
        <p class="text-sm text-base-content/60">No recent searches</p>
        <p class="text-xs text-base-content/40 mt-1">Your search history will appear here</p>
      </div>
    }
  `
})
export class RecentSearchesComponent {
  /** List of recent searches to display */
  readonly recentSearches = input<IRecentSearch[]>([]);

  /** Emits the query string when a recent search is clicked to re-execute */
  readonly searchSelected = output<string>();

  /**
   * Emit the selected search query for re-execution.
   */
  onSearchSelected(query: string): void {
    this.searchSelected.emit(query);
  }

  /**
   * Format an ISO timestamp into a user-friendly relative or short date string.
   */
  formatTimestamp(isoString: string): string {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  }
}
