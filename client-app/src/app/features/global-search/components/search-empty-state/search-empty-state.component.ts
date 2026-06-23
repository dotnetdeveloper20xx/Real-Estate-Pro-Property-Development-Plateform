import {
  Component,
  ChangeDetectionStrategy,
  input,
  output
} from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * SearchEmptyStateComponent handles the various empty/error/loading states
 * for search results.
 *
 * States displayed:
 * - Loading: skeleton loading placeholders
 * - Error: user-friendly error message with retry button (never shows raw server errors)
 * - No results: "No results found for '{query}'" with suggestions
 * - Timed-out modules: "Some modules unavailable" banner when timedOutModules is non-empty
 *
 * Presentational component — receives data via input, emits events via output.
 */
@Component({
  selector: 'app-search-empty-state',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col items-center justify-center px-6 py-8">
      @if (loading()) {
        <!-- Loading skeleton placeholders -->
        <div
          class="w-full max-w-md space-y-4"
          aria-busy="true"
          aria-label="Loading search results"
        >
          @for (item of skeletonItems; track item) {
            <div class="animate-pulse flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-base-300 shrink-0"></div>
              <div class="flex-1 space-y-2">
                <div class="h-4 bg-base-300 rounded w-3/4"></div>
                <div class="h-3 bg-base-300 rounded w-1/2"></div>
              </div>
            </div>
          }
        </div>
      } @else if (error()) {
        <!-- Error state: user-friendly message with retry -->
        <div class="text-center max-w-sm">
          <span class="material-symbols-outlined text-4xl text-error mb-3" aria-hidden="true">
            error_outline
          </span>
          <h3 class="text-base font-semibold text-base-content mb-1">
            Search could not be completed
          </h3>
          <p class="text-sm text-base-content/60 mb-4">
            {{ sanitizedError() }}
          </p>
          <button
            class="btn btn-sm btn-primary"
            (click)="onRetry()"
            aria-label="Retry search"
          >
            <span class="material-symbols-outlined text-sm" aria-hidden="true">refresh</span>
            Retry
          </button>
        </div>
      } @else {
        <!-- No results state -->
        <div class="text-center max-w-sm">
          <span class="material-symbols-outlined text-4xl text-base-content/20 mb-3" aria-hidden="true">
            search_off
          </span>
          <h3 class="text-base font-semibold text-base-content mb-1">
            No results found for "{{ query() }}"
          </h3>
          <div class="text-sm text-base-content/60 space-y-1 mb-4">
            <p>Suggestions:</p>
            <ul class="text-left list-disc list-inside text-xs text-base-content/50 space-y-1">
              <li>Check spelling and try alternative terms</li>
              <li>Use fewer or broader keywords</li>
              <li>Try searching by reference number or ID</li>
              <li>Remove some filters to broaden results</li>
            </ul>
          </div>
          <button
            class="btn btn-sm btn-outline"
            (click)="onOpenAdvanced()"
            aria-label="Open advanced filters"
          >
            <span class="material-symbols-outlined text-sm" aria-hidden="true">tune</span>
            Try Advanced Search
          </button>
        </div>
      }

      <!-- Timed-out modules banner -->
      @if (!loading() && timedOutModules().length > 0) {
        <div
          class="mt-4 w-full max-w-md alert alert-warning shadow-sm"
          role="alert"
        >
          <span class="material-symbols-outlined text-sm" aria-hidden="true">warning</span>
          <div>
            <p class="text-sm font-medium">Some modules unavailable</p>
            <p class="text-xs opacity-80">
              Results from {{ formatModuleList(timedOutModules()) }} could not be retrieved.
              Try again later.
            </p>
          </div>
        </div>
      }
    </div>
  `
})
export class SearchEmptyStateComponent {
  /** The current search query */
  readonly query = input<string>('');

  /** Error message string, or null if no error */
  readonly error = input<string | null>(null);

  /** Whether search is currently loading */
  readonly loading = input<boolean>(false);

  /** List of module names that timed out during search */
  readonly timedOutModules = input<string[]>([]);

  /** Emits when user clicks retry */
  readonly retry = output<void>();

  /** Emits when user clicks to open advanced search/filters */
  readonly openAdvanced = output<void>();

  /** Skeleton items count for loading state */
  readonly skeletonItems = [1, 2, 3, 4, 5];

  /**
   * Emit retry event.
   */
  onRetry(): void {
    this.retry.emit();
  }

  /**
   * Emit open advanced filters event.
   */
  onOpenAdvanced(): void {
    this.openAdvanced.emit();
  }

  /**
   * Sanitize error message to never show raw server errors.
   * Returns a user-friendly message.
   */
  sanitizedError(): string {
    const err = this.error();
    if (!err) return 'An unexpected error occurred. Please try again.';

    // Never expose raw technical details
    const techPatterns = [
      /exception/i,
      /stack trace/i,
      /at \w+\./i,
      /500 internal/i,
      /sql/i,
      /null reference/i,
      /object reference/i,
      /connection string/i
    ];

    for (const pattern of techPatterns) {
      if (pattern.test(err)) {
        return 'An unexpected error occurred while processing your search. Please try again or contact support if the issue persists.';
      }
    }

    return err;
  }

  /**
   * Format a list of module names into a readable sentence fragment.
   */
  formatModuleList(modules: string[]): string {
    if (modules.length === 0) return '';
    if (modules.length === 1) return modules[0];
    if (modules.length === 2) return `${modules[0]} and ${modules[1]}`;
    const last = modules[modules.length - 1];
    const rest = modules.slice(0, -1).join(', ');
    return `${rest}, and ${last}`;
  }
}
