import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IApplicationListItem } from '../../models/planning-application.model';
import { ApplicationCardComponent } from '../application-card/application-card.component';

/**
 * Presentational component that renders a single pipeline column
 * in the Planning Approvals Kanban-style board view.
 *
 * Displays: column header with status name and count badge,
 * followed by a scrollable list of application cards.
 *
 * Requirements: 14.1
 */
@Component({
  selector: 'app-planning-pipeline-column',
  standalone: true,
  imports: [CommonModule, ApplicationCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col h-full min-w-[280px] max-w-[320px] bg-base-200/50 rounded-xl">
      <!-- Column Header -->
      <div class="flex items-center justify-between px-4 py-3 border-b border-base-300">
        <h2 class="text-sm font-semibold text-base-content">{{ status }}</h2>
        <span
          class="badge badge-sm"
          [ngClass]="count > 0 ? 'badge-primary' : 'badge-neutral'"
          [attr.aria-label]="count + ' applications'"
        >
          {{ count }}
        </span>
      </div>

      <!-- Cards List -->
      <div
        class="flex flex-col gap-3 p-3 overflow-y-auto flex-1"
        role="list"
        [attr.aria-label]="status + ' applications'"
      >
        @if (applications.length === 0) {
          <div class="flex flex-col items-center justify-center py-8 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-base-content/30 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p class="text-xs text-base-content/50">No applications</p>
          </div>
        } @else {
          @for (application of applications; track application.id) {
            <div role="listitem">
              <app-application-card
                [application]="application"
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
  @Input({ required: true }) applications!: IApplicationListItem[];
  @Output() cardClick = new EventEmitter<IApplicationListItem>();

  onCardClick(application: IApplicationListItem): void {
    this.cardClick.emit(application);
  }
}
