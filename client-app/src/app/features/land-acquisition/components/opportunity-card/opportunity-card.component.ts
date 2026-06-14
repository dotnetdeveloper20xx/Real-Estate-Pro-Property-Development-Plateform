import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IOpportunityListItem } from '../../models';

/**
 * Presentational component that renders a single land opportunity
 * as a polished card within the pipeline view.
 */
@Component({
  selector: 'app-opportunity-card',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    .card-animate {
      animation: slide-up 0.3s ease-out backwards;
    }
  `],
  template: `
    <div
      class="group rounded-lg bg-base-100 border border-base-200/80 cursor-pointer
             hover:shadow-md hover:border-primary/30 hover:-translate-y-0.5
             transition-all duration-200 overflow-hidden"
      (click)="onCardClick()"
      (keydown.enter)="onCardClick()"
      (keydown.space)="onCardClick()"
      tabindex="0"
      role="button"
      [attr.aria-label]="'View opportunity: ' + opportunity.name">

      <!-- Top accent bar -->
      <div class="h-0.5" [style.background-color]="statusColor"></div>

      <div class="p-3.5 space-y-2.5">
        <!-- Name -->
        <h3 class="text-sm font-semibold text-base-content line-clamp-1 group-hover:text-primary transition-colors">
          {{ opportunity.name }}
        </h3>

        <!-- Location -->
        <div class="flex items-center gap-1.5 text-xs text-base-content/60">
          <span class="material-symbols-outlined text-sm text-base-content/40">location_on</span>
          <span class="line-clamp-1">{{ opportunity.location }}</span>
        </div>

        <!-- Footer row -->
        <div class="flex items-center justify-between pt-1.5 border-t border-base-200/60">
          <div class="flex items-center gap-1">
            <span class="material-symbols-outlined text-xs text-base-content/40">square_foot</span>
            <span class="text-xs font-medium text-base-content/70">
              {{ opportunity.landSize | number:'1.0-1' }} acres
            </span>
          </div>
          <div class="flex items-center gap-1 text-xs text-base-content/50"
               [attr.aria-label]="daysSinceLastChange + ' days in current status'">
            <span class="material-symbols-outlined text-xs">schedule</span>
            {{ daysSinceLastChange }}d
          </div>
        </div>

        <!-- Source tag -->
        <div *ngIf="opportunity.source" class="pt-1">
          <span class="inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-base-content/40 bg-base-200/60 rounded px-1.5 py-0.5">
            {{ opportunity.source }}
          </span>
        </div>
      </div>
    </div>
  `
})
export class OpportunityCardComponent {
  @Input({ required: true }) opportunity!: IOpportunityListItem;
  @Input() statusColor = '#6366f1';
  @Output() cardClick = new EventEmitter<IOpportunityListItem>();

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
