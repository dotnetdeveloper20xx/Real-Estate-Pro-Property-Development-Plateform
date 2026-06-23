import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output
} from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Represents a category tab with its count and icon.
 */
export interface ISearchTab {
  readonly category: string;
  readonly count: number;
  readonly icon: string;
}

/**
 * Search tabs component that renders an "All" tab plus one tab per category.
 * Uses DaisyUI tab styling and proper ARIA tab roles for accessibility.
 * Categories are rendered in the order provided (assumed sorted by priority).
 */
@Component({
  selector: 'app-search-tabs',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="tabs tabs-bordered overflow-x-auto"
      role="tablist"
      aria-label="Search result categories"
    >
      <!-- All tab -->
      <button
        type="button"
        class="tab"
        [class.tab-active]="activeTab === 'all'"
        role="tab"
        [attr.aria-selected]="activeTab === 'all'"
        [attr.tabindex]="activeTab === 'all' ? 0 : -1"
        (click)="onTabClick('all')"
      >
        All
        @if (totalCount > 0) {
          <span class="badge badge-sm badge-ghost ml-1">{{ totalCount }}</span>
        }
      </button>

      <!-- Category tabs -->
      @for (tab of categories; track tab.category) {
        <button
          type="button"
          class="tab gap-1"
          [class.tab-active]="activeTab === tab.category"
          role="tab"
          [attr.aria-selected]="activeTab === tab.category"
          [attr.tabindex]="activeTab === tab.category ? 0 : -1"
          (click)="onTabClick(tab.category)"
        >
          <span class="material-symbols-outlined text-sm" aria-hidden="true">{{ tab.icon }}</span>
          <span>{{ tab.category }}</span>
          @if (tab.count > 0) {
            <span class="badge badge-sm badge-ghost">{{ tab.count }}</span>
          }
        </button>
      }
    </div>
  `
})
export class SearchTabsComponent {
  /** Array of categories with counts and icons, ordered by priority. */
  @Input() categories: ISearchTab[] = [];

  /** The currently active tab identifier ('all' or a category name). */
  @Input() activeTab = 'all';

  /** Emits the selected category string when a tab is clicked. */
  @Output() tabChange = new EventEmitter<string>();

  /** Computed total count across all categories. */
  get totalCount(): number {
    return this.categories.reduce((sum, tab) => sum + tab.count, 0);
  }

  /** Handle tab click and emit the category change event. */
  onTabClick(category: string): void {
    this.tabChange.emit(category);
  }
}
