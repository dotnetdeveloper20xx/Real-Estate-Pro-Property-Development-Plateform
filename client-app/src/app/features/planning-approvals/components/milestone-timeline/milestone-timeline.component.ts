import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IPlanningMilestone } from '../../models/planning-milestone.model';

/**
 * MilestoneTimelineComponent — A presentational component that renders a vertical
 * timeline of planning milestones using DaisyUI timeline styling.
 *
 * Milestones are ordered by targetDate. Overdue milestones are highlighted with
 * error colouring. Variance (days early/late) is displayed for completed milestones.
 *
 * Requirements: 15.2
 *
 * @example
 * ```html
 * <app-milestone-timeline
 *   [milestones]="milestones"
 *   (milestoneSelect)="onMilestoneSelect($event)">
 * </app-milestone-timeline>
 * ```
 */
@Component({
  selector: 'app-milestone-timeline',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div *ngIf="sortedMilestones.length > 0; else emptyState" role="list" aria-label="Milestones timeline">
      <ul class="timeline timeline-vertical timeline-compact">
        <li
          *ngFor="let milestone of sortedMilestones; let first = first; let last = last; trackBy: trackById"
        >
          <hr *ngIf="!first" [ngClass]="getLineClass(milestone)" />
          <div class="timeline-start text-xs text-base-content/60 min-w-[80px] text-right pr-2">
            {{ milestone.targetDate | date:'dd MMM yyyy' }}
          </div>
          <div class="timeline-middle">
            <div
              class="w-4 h-4 rounded-full border-2 flex items-center justify-center"
              [ngClass]="getDotClass(milestone)"
            >
              <svg
                *ngIf="milestone.status === 'Completed'"
                xmlns="http://www.w3.org/2000/svg"
                class="h-2.5 w-2.5 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <div
            class="timeline-end timeline-box border cursor-pointer hover:shadow-sm transition-shadow"
            [ngClass]="getCardClass(milestone)"
            (click)="milestoneSelect.emit(milestone)"
            (keydown.enter)="milestoneSelect.emit(milestone)"
            tabindex="0"
            role="listitem"
            [attr.aria-label]="getMilestoneAriaLabel(milestone)"
          >
            <div class="flex items-center justify-between gap-3">
              <div>
                <p class="font-medium text-sm">{{ formatMilestoneType(milestone.milestoneType) }}</p>
                <div class="flex items-center gap-2 mt-0.5">
                  <span class="badge badge-xs" [ngClass]="getStatusBadgeClass(milestone.status)">
                    {{ milestone.status }}
                  </span>
                  <span *ngIf="milestone.actualDate" class="text-xs text-base-content/60">
                    Actual: {{ milestone.actualDate | date:'dd MMM yyyy' }}
                  </span>
                </div>
              </div>
              <!-- Variance display -->
              <div *ngIf="milestone.varianceDays !== null" class="text-right">
                <span
                  class="text-sm font-semibold"
                  [ngClass]="getVarianceClass(milestone.varianceDays)"
                >
                  {{ formatVariance(milestone.varianceDays) }}
                </span>
                <p class="text-xs text-base-content/50">variance</p>
              </div>
            </div>
          </div>
          <hr *ngIf="!last" [ngClass]="getLineClass(milestone)" />
        </li>
      </ul>
    </div>

    <ng-template #emptyState>
      <div class="text-center py-8 text-base-content/50">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p class="font-medium">No milestones set</p>
        <p class="text-sm mt-1">Milestones will appear here when added to track key dates.</p>
      </div>
    </ng-template>
  `
})
export class MilestoneTimelineComponent {
  /** Array of planning milestones to display. */
  @Input({ required: true }) milestones: readonly IPlanningMilestone[] = [];

  /** Emits when a milestone item is clicked. */
  @Output() milestoneSelect = new EventEmitter<IPlanningMilestone>();

  /** Returns milestones sorted by targetDate ascending. */
  get sortedMilestones(): readonly IPlanningMilestone[] {
    return [...this.milestones].sort(
      (a, b) => new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime()
    );
  }

  /** Returns CSS classes for the timeline dot based on milestone status. */
  getDotClass(milestone: IPlanningMilestone): string {
    switch (milestone.status) {
      case 'Completed':
        return 'bg-success border-success';
      case 'Overdue':
        return 'bg-error border-error';
      case 'Pending':
        return 'bg-base-100 border-base-300';
      default:
        return 'bg-base-100 border-base-300';
    }
  }

  /** Returns CSS class for the connecting line based on milestone status. */
  getLineClass(milestone: IPlanningMilestone): string {
    switch (milestone.status) {
      case 'Completed':
        return 'bg-success';
      case 'Overdue':
        return 'bg-error';
      default:
        return '';
    }
  }

  /** Returns CSS class for the timeline card border on overdue items. */
  getCardClass(milestone: IPlanningMilestone): string {
    if (milestone.status === 'Overdue') {
      return 'border-error/40 bg-error/5';
    }
    if (milestone.status === 'Completed') {
      return 'border-success/30';
    }
    return 'border-base-200';
  }

  /** Returns the DaisyUI badge class for a milestone status. */
  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'Pending':
        return 'badge-neutral';
      case 'Completed':
        return 'badge-success';
      case 'Overdue':
        return 'badge-error';
      default:
        return 'badge-ghost';
    }
  }

  /** Returns the colour class for variance display. */
  getVarianceClass(varianceDays: number): string {
    if (varianceDays > 0) {
      return 'text-error';
    }
    if (varianceDays < 0) {
      return 'text-success';
    }
    return 'text-base-content/60';
  }

  /** Formats variance days into a human-readable string. */
  formatVariance(varianceDays: number): string {
    if (varianceDays === 0) {
      return 'On time';
    }
    const absDays = Math.abs(varianceDays);
    const suffix = absDays === 1 ? 'day' : 'days';
    if (varianceDays > 0) {
      return `+${absDays} ${suffix} late`;
    }
    return `-${absDays} ${suffix} early`;
  }

  /** Formats PascalCase milestone type to readable label. */
  formatMilestoneType(type: string): string {
    return type
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2');
  }

  /** Accessible label for milestone items. */
  getMilestoneAriaLabel(milestone: IPlanningMilestone): string {
    const type = this.formatMilestoneType(milestone.milestoneType);
    const status = milestone.status;
    const variance = milestone.varianceDays !== null
      ? `, ${this.formatVariance(milestone.varianceDays)}`
      : '';
    return `${type} — ${status}${variance}`;
  }

  /** TrackBy function for ngFor. */
  trackById(_index: number, item: IPlanningMilestone): string {
    return item.id;
  }
}
