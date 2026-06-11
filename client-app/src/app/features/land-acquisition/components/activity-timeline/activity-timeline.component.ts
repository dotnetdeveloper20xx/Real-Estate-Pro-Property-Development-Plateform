import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { IRecentActivity } from '../../models/dashboard.model';

/**
 * ActivityTimelineComponent — A presentational component that renders a chronological
 * list of status changes with timestamps and user names.
 *
 * Uses DaisyUI timeline styling with Tailwind utility classes.
 * Designed for the Opportunity Detail Activity tab (Requirement 15.4) and
 * Dashboard recent activity section (Requirement 18.1).
 *
 * @example
 * ```html
 * <app-activity-timeline [activities]="recentActivities">
 * </app-activity-timeline>
 * ```
 */
@Component({
  selector: 'app-activity-timeline',
  standalone: true,
  imports: [CommonModule, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="w-full" role="list" aria-label="Activity timeline">
      <!-- Empty state -->
      <div
        *ngIf="activities.length === 0"
        class="flex flex-col items-center justify-center py-8 text-base-content/50">
        <span class="material-symbols-outlined text-4xl mb-2">history</span>
        <p class="text-sm">No recent activity to display.</p>
      </div>

      <!-- Timeline entries -->
      <ul *ngIf="activities.length > 0" class="timeline timeline-vertical timeline-compact">
        <li *ngFor="let activity of activities; let first = first; let last = last" role="listitem">
          <hr *ngIf="!first" class="bg-base-300" />
          <div class="timeline-start text-xs text-base-content/60 whitespace-nowrap">
            {{ activity.changedAt | date:'dd MMM yyyy, HH:mm' }}
          </div>
          <div class="timeline-middle">
            <div class="w-3 h-3 rounded-full bg-primary"></div>
          </div>
          <div class="timeline-end timeline-box border-base-200 shadow-sm">
            <div class="flex flex-col gap-0.5">
              <span class="text-sm font-medium text-base-content">
                {{ activity.opportunityName }}
              </span>
              <span class="text-xs text-base-content/70">
                <span class="font-medium">{{ activity.changedBy }}</span>
                changed status from
                <span class="badge badge-xs badge-ghost">{{ formatStatus(activity.previousStatus) }}</span>
                to
                <span class="badge badge-xs badge-primary">{{ formatStatus(activity.newStatus) }}</span>
              </span>
            </div>
          </div>
          <hr *ngIf="!last" class="bg-base-300" />
        </li>
      </ul>
    </div>
  `
})
export class ActivityTimelineComponent {
  /** Chronological list of recent activities to render. */
  @Input() activities: readonly IRecentActivity[] = [];

  /**
   * Formats a status enum string into a human-readable label.
   * Converts PascalCase or camelCase to spaced words.
   */
  formatStatus(status: string): string {
    if (!status) return '';
    return status
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2')
      .trim();
  }
}
