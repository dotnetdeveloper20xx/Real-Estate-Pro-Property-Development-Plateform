import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Generic timeline item interface that supports all timeline use-cases across modules.
 */
export interface ITimelineItem {
  readonly id: string;
  readonly timestamp: Date | string;
  readonly title: string;
  readonly subtitle?: string;
  readonly badge?: string;
  readonly badgeClass?: string;
  readonly icon?: string;
  readonly iconClass?: string;
}

/**
 * Unified TimelineComponent — A generic presentational component that renders a vertical
 * timeline of chronological items using DaisyUI timeline styling.
 *
 * Consolidates timeline variants from:
 * - Land Acquisition (activity-timeline with status changes)
 * - Legal Compliance (audit-timeline with action types)
 * - Planning Approvals (milestone-timeline with dates and variance)
 *
 * Items are rendered in the order provided (parent is responsible for sorting).
 *
 * @example
 * ```html
 * <app-timeline
 *   [items]="timelineItems"
 *   emptyIcon="history"
 *   emptyMessage="No recent activity to display.">
 * </app-timeline>
 * ```
 */
@Component({
  selector: 'app-timeline',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="w-full" role="list" [attr.aria-label]="ariaLabel">
      <!-- Empty state -->
      <div
        *ngIf="items.length === 0"
        class="flex flex-col items-center justify-center py-8 text-base-content/50">
        <span class="material-symbols-outlined text-4xl mb-2">{{ emptyIcon }}</span>
        <p class="text-sm">{{ emptyMessage }}</p>
      </div>

      <!-- Timeline entries -->
      <ul *ngIf="items.length > 0" class="timeline timeline-vertical timeline-compact">
        <li *ngFor="let item of items; let first = first; let last = last; trackBy: trackById" role="listitem">
          <hr *ngIf="!first" class="bg-base-300" />
          <div class="timeline-start text-xs text-base-content/60 whitespace-nowrap min-w-[80px] text-right pr-2">
            {{ formatTimestamp(item.timestamp) }}
          </div>
          <div class="timeline-middle">
            <div
              class="w-3.5 h-3.5 rounded-full flex items-center justify-center"
              [ngClass]="item.iconClass || 'bg-primary border-primary'">
              <span
                *ngIf="item.icon"
                class="material-symbols-outlined text-[10px] text-primary-content"
                aria-hidden="true">
                {{ item.icon }}
              </span>
            </div>
          </div>
          <div class="timeline-end timeline-box border-base-200 shadow-sm py-2 px-3">
            <div class="flex flex-col gap-0.5">
              <span class="text-sm font-medium text-base-content">
                {{ item.title }}
              </span>
              <div *ngIf="item.subtitle || item.badge" class="flex items-center gap-2 flex-wrap">
                <span *ngIf="item.subtitle" class="text-xs text-base-content/70">
                  {{ item.subtitle }}
                </span>
                <span
                  *ngIf="item.badge"
                  class="badge badge-xs"
                  [ngClass]="item.badgeClass || 'badge-ghost'">
                  {{ item.badge }}
                </span>
              </div>
            </div>
          </div>
          <hr *ngIf="!last" class="bg-base-300" />
        </li>
      </ul>
    </div>
  `
})
export class TimelineComponent {
  /** Array of timeline items to render. Parent is responsible for sort order. */
  @Input() items: readonly ITimelineItem[] = [];

  /** Material Symbols icon name shown in the empty state. */
  @Input() emptyIcon = 'history';

  /** Message shown when there are no items. */
  @Input() emptyMessage = 'No activity to display.';

  /** Accessible label for the timeline container. */
  @Input() ariaLabel = 'Timeline';

  /** Formats a Date or ISO string into a readable display. */
  formatTimestamp(timestamp: Date | string): string {
    const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    if (isNaN(date.getTime())) return '';
    const day = date.getDate().toString().padStart(2, '0');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[date.getMonth()];
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day} ${month}, ${hours}:${minutes}`;
  }

  /** TrackBy function for ngFor performance. */
  trackById(_index: number, item: ITimelineItem): string {
    return item.id;
  }
}
