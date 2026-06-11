import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IOpportunityListItem } from '../../models';

/**
 * Presentational component that renders a single land opportunity
 * as a DaisyUI card within the pipeline view.
 *
 * Displays: Name, Location, LandSize, and days since last status change.
 * Emits a click event so the parent can navigate to opportunity detail.
 */
@Component({
  selector: 'app-opportunity-card',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="card card-compact bg-base-100 shadow-sm border border-base-200 cursor-pointer
             hover:shadow-md hover:border-primary/30 transition-all duration-200"
      (click)="onCardClick()"
      (keydown.enter)="onCardClick()"
      (keydown.space)="onCardClick()"
      tabindex="0"
      role="button"
      [attr.aria-label]="'View opportunity: ' + opportunity.name"
    >
      <div class="card-body gap-2 p-4">
        <!-- Name -->
        <h3 class="card-title text-sm font-semibold text-base-content line-clamp-1">
          {{ opportunity.name }}
        </h3>

        <!-- Location -->
        <div class="flex items-center gap-1.5 text-xs text-base-content/70">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span class="line-clamp-1">{{ opportunity.location }}</span>
        </div>

        <!-- Land Size & Days -->
        <div class="flex items-center justify-between mt-1">
          <span class="badge badge-ghost badge-sm text-xs">
            {{ opportunity.landSize | number:'1.0-2' }} acres
          </span>
          <span class="text-xs text-base-content/60" [attr.aria-label]="daysSinceLastChange + ' days in current status'">
            {{ daysSinceLastChange }}d
          </span>
        </div>
      </div>
    </div>
  `
})
export class OpportunityCardComponent {
  @Input({ required: true }) opportunity!: IOpportunityListItem;
  @Output() cardClick = new EventEmitter<IOpportunityListItem>();

  /**
   * Calculates the number of days since the last status change.
   * Uses createdAt as the reference date for when the opportunity
   * entered its current status (best available approximation from list item data).
   */
  get daysSinceLastChange(): number {
    const changeDate = new Date(this.opportunity.createdAt);
    const now = new Date();
    const diffMs = now.getTime() - changeDate.getTime();
    return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
  }

  onCardClick(): void {
    this.cardClick.emit(this.opportunity);
  }
}
