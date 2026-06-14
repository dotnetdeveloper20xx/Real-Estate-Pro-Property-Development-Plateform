import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IOpportunityListItem } from '../../models';
import { OpportunityCardComponent } from '../opportunity-card/opportunity-card.component';

/**
 * Presentational component that renders a single pipeline column
 * in the Kanban-style board view with status-colored header.
 */
@Component({
  selector: 'app-pipeline-column',
  standalone: true,
  imports: [CommonModule, OpportunityCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    :host { display: block; }
    .column-enter { animation: fade-in 0.3s ease-out backwards; }
  `],
  template: `
    <div class="flex flex-col h-full min-w-[270px] max-w-[300px] rounded-xl border border-base-200/80 bg-base-100/50 column-enter"
         [style.animation-delay.ms]="columnIndex * 60">
      <!-- Column Header with status color -->
      <div class="flex items-center gap-2 px-4 py-3 rounded-t-xl"
           [style.border-bottom]="'3px solid ' + statusColor">
        <div class="w-2.5 h-2.5 rounded-full" [style.background-color]="statusColor"></div>
        <h2 class="text-sm font-semibold text-base-content flex-1">{{ status }}</h2>
        <span class="min-w-[24px] h-6 flex items-center justify-center rounded-full text-xs font-bold text-white px-1.5"
              [style.background-color]="statusColor">
          {{ count }}
        </span>
      </div>

      <!-- Cards List -->
      <div class="flex flex-col gap-2.5 p-3 overflow-y-auto flex-1 custom-scroll"
           role="list"
           [attr.aria-label]="status + ' opportunities'">
        @if (opportunities.length === 0) {
          <div class="flex flex-col items-center justify-center py-10 text-center">
            <span class="material-symbols-outlined text-3xl text-base-content/20 mb-2">inbox</span>
            <p class="text-xs text-base-content/40">No opportunities</p>
          </div>
        } @else {
          @for (opportunity of opportunities; track opportunity.id; let i = $index) {
            <div role="listitem" class="card-animate" [style.animation-delay.ms]="i * 50">
              <app-opportunity-card
                [opportunity]="opportunity"
                [statusColor]="statusColor"
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
  @Input() statusColor = '#6366f1';
  @Input() columnIndex = 0;
  @Output() cardClick = new EventEmitter<IOpportunityListItem>();

  onCardClick(opportunity: IOpportunityListItem): void {
    this.cardClick.emit(opportunity);
  }
}
