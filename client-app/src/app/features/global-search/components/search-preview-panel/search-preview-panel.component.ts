import {
  Component,
  ChangeDetectionStrategy,
  input,
  output
} from '@angular/core';
import { CommonModule } from '@angular/common';

import { ISearchResultItem } from '../../models/search.model';

/**
 * SearchPreviewPanelComponent displays a detailed preview of a selected search result.
 * Shows entity summary, status, owner, related links, and available actions.
 *
 * Only renders on viewports ≥1440px (controlled via Tailwind's hidden/2xl:block).
 * Shows a fallback message when no result is selected or data fails to load.
 *
 * Presentational component — receives data via input, emits events via output.
 */
@Component({
  selector: 'app-search-preview-panel',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Only render on viewports ≥1440px -->
    <aside
      class="hidden 2xl:flex flex-col w-80 border-l border-base-300 bg-base-100 overflow-y-auto"
      aria-label="Search result preview"
    >
      @if (result()) {
        <div class="p-4 space-y-4">
          <!-- Header -->
          <div class="flex items-start justify-between">
            <div class="flex-1 min-w-0">
              <h3 class="text-base font-semibold text-base-content truncate">
                {{ result()!.title }}
              </h3>
              <p class="text-xs text-base-content/50 mt-0.5">{{ result()!.entityType }}</p>
            </div>
            <button
              class="btn btn-ghost btn-xs btn-square"
              aria-label="Close preview panel"
              (click)="onClose()"
            >
              <span class="material-symbols-outlined text-sm" aria-hidden="true">close</span>
            </button>
          </div>

          <!-- Status badge -->
          @if (result()!.status) {
            <div>
              <span
                class="badge badge-sm"
                [class]="getStatusBadgeClass(result()!.statusVariant)"
              >
                {{ result()!.status }}
              </span>
            </div>
          }

          <!-- Summary / Subtitle -->
          <div class="space-y-2">
            <p class="text-sm text-base-content/70">{{ result()!.subtitle }}</p>
            @if (result()!.breadcrumb) {
              <p class="text-xs text-base-content/40">{{ result()!.breadcrumb }}</p>
            }
          </div>

          <!-- Metadata -->
          <div class="border-t border-base-300 pt-3 space-y-2">
            <div class="flex items-center gap-2 text-xs">
              <span class="text-base-content/50 w-16">Module:</span>
              <span class="badge badge-ghost badge-xs">{{ result()!.moduleBadge }}</span>
            </div>
            <div class="flex items-center gap-2 text-xs">
              <span class="text-base-content/50 w-16">Updated:</span>
              <span class="text-base-content/70">{{ formatDate(result()!.lastUpdated) }}</span>
            </div>
            @if (result()!.relevancyScore > 0) {
              <div class="flex items-center gap-2 text-xs">
                <span class="text-base-content/50 w-16">Score:</span>
                <span class="text-base-content/70">{{ result()!.relevancyScore | number:'1.1-1' }}</span>
              </div>
            }
          </div>

          <!-- Quick Actions -->
          @if (result()!.quickActions.length > 0) {
            <div class="border-t border-base-300 pt-3">
              <span class="text-xs font-semibold text-base-content/50 uppercase tracking-wider block mb-2">
                Actions
              </span>
              <div class="flex flex-wrap gap-2">
                @for (action of result()!.quickActions; track action.label) {
                  <button
                    class="btn btn-sm btn-outline"
                    (click)="onNavigate()"
                  >
                    <span class="material-symbols-outlined text-sm" aria-hidden="true">{{ action.icon }}</span>
                    {{ action.label }}
                  </button>
                }
              </div>
            </div>
          } @else {
            <!-- Default View/Edit action buttons -->
            <div class="border-t border-base-300 pt-3">
              <div class="flex gap-2">
                <button
                  class="btn btn-sm btn-primary flex-1"
                  (click)="onNavigate()"
                  aria-label="View this item"
                >
                  <span class="material-symbols-outlined text-sm" aria-hidden="true">visibility</span>
                  View
                </button>
                <button
                  class="btn btn-sm btn-outline flex-1"
                  (click)="onNavigate()"
                  aria-label="Edit this item"
                >
                  <span class="material-symbols-outlined text-sm" aria-hidden="true">edit</span>
                  Edit
                </button>
              </div>
            </div>
          }
        </div>
      } @else {
        <!-- Fallback: no result selected -->
        <div class="flex flex-col items-center justify-center h-full p-6 text-center">
          <span class="material-symbols-outlined text-3xl text-base-content/20 mb-3" aria-hidden="true">
            preview
          </span>
          <p class="text-sm text-base-content/50">Select a result to preview</p>
          <p class="text-xs text-base-content/30 mt-1">
            Use arrow keys or hover to highlight a result
          </p>
        </div>
      }
    </aside>
  `
})
export class SearchPreviewPanelComponent {
  /** The currently selected search result to preview, or null */
  readonly result = input<ISearchResultItem | null>(null);

  /** Emits the result item to navigate to */
  readonly navigate = output<ISearchResultItem>();

  /** Emits when the close button is clicked */
  readonly close = output<void>();

  /**
   * Navigate to the result detail page.
   */
  onNavigate(): void {
    const item = this.result();
    if (item) {
      this.navigate.emit(item);
    }
  }

  /**
   * Close the preview panel.
   */
  onClose(): void {
    this.close.emit();
  }

  /**
   * Get DaisyUI badge class for a status variant string.
   */
  getStatusBadgeClass(variant: string | null): string {
    switch (variant) {
      case 'success': return 'badge-success';
      case 'info': return 'badge-info';
      case 'warning': return 'badge-warning';
      case 'error': return 'badge-error';
      case 'ghost': return 'badge-ghost';
      default: return 'badge-ghost';
    }
  }

  /**
   * Format an ISO date string into a short readable format.
   */
  formatDate(isoString: string): string {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }
}
