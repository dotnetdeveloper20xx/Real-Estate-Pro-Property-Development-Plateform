import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output
} from '@angular/core';
import { CommonModule } from '@angular/common';

import { ISearchResultItem } from '../../models/search.model';
import { SearchHighlightPipe } from '../search-highlight/search-highlight.pipe';

/**
 * Search result card component that displays a single search result
 * with icon, highlighted title, subtitle, status/module badges, breadcrumb,
 * last updated timestamp, and quick action buttons.
 *
 * Supports keyboard navigation and focused state via `isSelected` input.
 */
@Component({
  selector: 'app-search-result-card',
  standalone: true,
  imports: [CommonModule, SearchHighlightPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="flex items-start gap-3 px-4 py-3 rounded-lg cursor-pointer transition-colors hover:bg-base-200"
      [class.bg-primary/10]="isSelected"
      role="option"
      [attr.aria-selected]="isSelected"
      [attr.id]="'search-result-' + index"
      (click)="onNavigate()"
      (mouseenter)="onSelect()"
    >
      <!-- Icon -->
      <span
        class="material-symbols-outlined text-2xl text-primary shrink-0 mt-0.5"
        aria-hidden="true"
      >
        {{ result.icon }}
      </span>

      <!-- Content -->
      <div class="flex-1 min-w-0">
        <!-- Title row -->
        <div class="flex items-center gap-2">
          <span
            class="font-medium text-base-content truncate"
            [innerHTML]="result.highlightedTitle | searchHighlight"
          ></span>

          @if (result.status) {
            <span
              class="badge badge-sm"
              [ngClass]="getStatusBadgeClass()"
            >
              {{ result.status }}
            </span>
          }

          @if (result.moduleBadge) {
            <span class="badge badge-sm badge-outline badge-info">
              {{ result.moduleBadge }}
            </span>
          }
        </div>

        <!-- Subtitle -->
        @if (result.subtitle) {
          <p class="text-sm text-base-content/60 truncate mt-0.5">
            {{ result.subtitle }}
          </p>
        }

        <!-- Breadcrumb and last updated -->
        <div class="flex items-center gap-2 mt-1 text-xs text-base-content/50">
          @if (result.breadcrumb) {
            <span class="truncate">{{ result.breadcrumb }}</span>
            <span aria-hidden="true">·</span>
          }
          <span>{{ result.lastUpdated | date:'mediumDate' }}</span>
        </div>
      </div>

      <!-- Quick actions -->
      <div class="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
           [class.opacity-100]="isSelected">
        <button
          type="button"
          class="btn btn-ghost btn-xs btn-square"
          aria-label="View"
          title="View"
          (click)="onNavigate(); $event.stopPropagation()"
        >
          <span class="material-symbols-outlined text-sm" aria-hidden="true">visibility</span>
        </button>

        <button
          type="button"
          class="btn btn-ghost btn-xs btn-square"
          aria-label="Pin"
          title="Pin"
          (click)="$event.stopPropagation()"
        >
          <span class="material-symbols-outlined text-sm" aria-hidden="true">push_pin</span>
        </button>

        <button
          type="button"
          class="btn btn-ghost btn-xs btn-square"
          aria-label="Open in new tab"
          title="Open in new tab"
          (click)="$event.stopPropagation()"
        >
          <span class="material-symbols-outlined text-sm" aria-hidden="true">open_in_new</span>
        </button>
      </div>
    </div>
  `
})
export class SearchResultCardComponent {
  /** The search result item to display. */
  @Input({ required: true }) result!: ISearchResultItem;

  /** Whether this card is currently selected/focused via keyboard navigation. */
  @Input() isSelected = false;

  /** The index of this result in the flat list (used for keyboard navigation). */
  @Input() index = 0;

  /** Emits the result when the user navigates to it (click or Enter). */
  @Output() navigate = new EventEmitter<ISearchResultItem>();

  /** Emits the index when the user hovers/selects this card. */
  @Output() select = new EventEmitter<number>();

  /** Navigate to the result. */
  onNavigate(): void {
    this.navigate.emit(this.result);
  }

  /** Select this card (e.g., on mouse enter). */
  onSelect(): void {
    this.select.emit(this.index);
  }

  /** Get the DaisyUI badge class based on the result's status variant. */
  getStatusBadgeClass(): string {
    switch (this.result.statusVariant) {
      case 'success': return 'badge-success';
      case 'info': return 'badge-info';
      case 'warning': return 'badge-warning';
      case 'error': return 'badge-error';
      default: return 'badge-ghost';
    }
  }
}
