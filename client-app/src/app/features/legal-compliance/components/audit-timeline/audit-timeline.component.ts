import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IRecentActivity } from '../../models/dashboard.model';

/**
 * AuditTimelineComponent — A presentational component that renders a vertical
 * timeline of audit/activity history entries using DaisyUI timeline styling.
 *
 * Entries are displayed in reverse chronological order (most recent first).
 *
 * @example
 * ```html
 * <app-audit-timeline [activities]="recentActivities"></app-audit-timeline>
 * ```
 */
@Component({
  selector: 'app-audit-timeline',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div *ngIf="sortedActivities.length > 0; else emptyState" role="list" aria-label="Audit timeline">
      <ul class="timeline timeline-vertical timeline-compact">
        <li *ngFor="let activity of sortedActivities; let first = first; let last = last; trackBy: trackById">
          <hr *ngIf="!first" />
          <div class="timeline-start text-xs text-base-content/60 min-w-[90px] text-right pr-2">
            {{ activity.performedAt | date:'dd MMM' }}
            <br />
            <span class="text-base-content/40">{{ activity.performedAt | date:'HH:mm' }}</span>
          </div>
          <div class="timeline-middle">
            <div
              class="w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center"
              [ngClass]="getActionDotClass(activity.action)"
            ></div>
          </div>
          <div
            class="timeline-end timeline-box border border-base-200 py-2 px-3"
            role="listitem"
            [attr.aria-label]="getActivityAriaLabel(activity)"
          >
            <div class="space-y-0.5">
              <p class="text-sm font-medium text-base-content">
                {{ activity.description }}
              </p>
              <div class="flex items-center gap-2 flex-wrap">
                <span class="badge badge-xs badge-outline">{{ activity.entityType }}</span>
                <span class="badge badge-xs" [ngClass]="getActionBadgeClass(activity.action)">
                  {{ activity.action }}
                </span>
                <span class="text-xs text-base-content/50">
                  by {{ activity.performedBy }}
                </span>
              </div>
            </div>
          </div>
          <hr *ngIf="!last" />
        </li>
      </ul>
    </div>

    <ng-template #emptyState>
      <div class="text-center py-8 text-base-content/50">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p class="font-medium">No activity recorded</p>
        <p class="text-sm mt-1">Activity entries will appear here as actions are taken.</p>
      </div>
    </ng-template>
  `
})
export class AuditTimelineComponent {
  /** Array of activity items to display in the timeline. */
  @Input({ required: true }) activities: readonly IRecentActivity[] = [];

  /** Returns activities sorted by performedAt descending (most recent first). */
  get sortedActivities(): readonly IRecentActivity[] {
    return [...this.activities].sort(
      (a, b) => new Date(b.performedAt).getTime() - new Date(a.performedAt).getTime()
    );
  }

  /** Returns CSS classes for the timeline dot based on action type. */
  getActionDotClass(action: string): string {
    const lowerAction = action.toLowerCase();
    if (lowerAction.includes('create')) {
      return 'bg-success border-success';
    }
    if (lowerAction.includes('delete') || lowerAction.includes('remove')) {
      return 'bg-error border-error';
    }
    if (lowerAction.includes('update') || lowerAction.includes('transition')) {
      return 'bg-info border-info';
    }
    return 'bg-base-300 border-base-300';
  }

  /** Returns DaisyUI badge class based on action type. */
  getActionBadgeClass(action: string): string {
    const lowerAction = action.toLowerCase();
    if (lowerAction.includes('create')) {
      return 'badge-success';
    }
    if (lowerAction.includes('delete') || lowerAction.includes('remove')) {
      return 'badge-error';
    }
    if (lowerAction.includes('update') || lowerAction.includes('transition')) {
      return 'badge-info';
    }
    return 'badge-ghost';
  }

  /** Returns an accessible description for an activity entry. */
  getActivityAriaLabel(activity: IRecentActivity): string {
    return `${activity.action} on ${activity.entityType}: ${activity.description} by ${activity.performedBy}`;
  }

  /** TrackBy function for ngFor. */
  trackById(_index: number, item: IRecentActivity): string {
    return item.id;
  }
}
