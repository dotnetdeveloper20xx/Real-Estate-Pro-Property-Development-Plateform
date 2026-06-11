import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IOpportunityListItem } from '../../models';
import { OpportunityCardComponent } from '../opportunity-card/opportunity-card.component';

/**
 * Presentational component that renders a single pipeline column
 * in the Kanban-style board view.
 *
 * Displays: column header with status name and count badge,
 * followed by a scrollable list of opportunity cards.
 */
@Component({
  selector: 'app-pipeline-column',
  standalone: true,
  imports: [CommonModule, OpportunityCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col h-full min-w-[280px] max-w-[320px] bg-base-200/50 rounded-xl">
      <!-- Column Header -->
      <div class="flex items-center justify-between px-4 py-3 border-b border-base-300">
        <h2 class="text-sm font-semibold text-base-content">{{ status }}</h2>
        <span class="badge badge-neutral badge-sm" [attr.aria-label]="count + ' opportunities'">
          {{ count }}
        </span>
      </div>

      <!-- Cards List -->
      <div
        class="flex flex-col gap-3 p-3 overflow-y-auto flex-1"
        role="list"
        [attr.aria-label]="status + ' opportunities'"
      >
        @if (opportunities.length === 0) {
          <div class="flex flex-col items-center justify-center py-8 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-base-content/30 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p class="text-xs text-base-content/50">No opportunities</p>
          </div>
        } @else {
          @for (opportunity of opportunities; track opportunity.id) {
            <div role="listitem">
              <app-opportunity-card
                [opportunity]="opportunity"
                (cardClick)="onCardClick($event)"
              />
            </div>
          }
        }
      </div>
    </div>
  `
})
export class PipelineColumnComponent {
  @Input({ required: true }) status!: string;
  @Input({ required: true }) count!: number;
  @Input({ required: true }) opportunities!: IOpportunityListItem[];
  @Output() cardClick = new EventEmitter<IOpportunityListItem>();

  onCardClick(opportunity: IOpportunityListItem): void {
    this.cardClick.emit(opportunity);
  }
}
