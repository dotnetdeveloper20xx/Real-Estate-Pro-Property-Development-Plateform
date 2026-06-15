import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Unified PipelineColumnComponent — A generic Kanban column that uses content projection
 * for card items.
 *
 * Consolidates pipeline column variants from:
 * - Land Acquisition (opportunity pipeline with status-colored header)
 * - Planning Approvals (application pipeline with badge count)
 *
 * Parent components project their own card components via <ng-content>.
 *
 * @example
 * ```html
 * <app-pipeline-column
 *   title="Due Diligence"
 *   [count]="3"
 *   color="#f59e0b"
 *   [columnIndex]="2"
 *   emptyMessage="No opportunities in this stage">
 *   <app-opportunity-card *ngFor="let opp of dueDiligenceOpps" [opportunity]="opp" />
 * </app-pipeline-column>
 * ```
 */
@Component({
  selector: 'app-pipeline-column',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    :host { display: block; }
    .column-enter { animation: fade-in 0.3s ease-out backwards; }
    @keyframes fade-in {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `],
  template: `
    <div class="flex flex-col h-full min-w-[270px] max-w-[320px] rounded-xl border border-base-200/80 bg-base-100/50 column-enter"
         [style.animation-delay.ms]="columnIndex * 60">
      <!-- Column Header with status color -->
      <div class="flex items-center gap-2 px-4 py-3 rounded-t-xl"
           [style.border-bottom]="'3px solid ' + color">
        <div class="w-2.5 h-2.5 rounded-full" [style.background-color]="color"></div>
        <h2 class="text-sm font-semibold text-base-content flex-1">{{ title }}</h2>
        <span class="min-w-[24px] h-6 flex items-center justify-center rounded-full text-xs font-bold text-white px-1.5"
              [style.background-color]="color">
          {{ count }}
        </span>
      </div>

      <!-- Cards List (content projection) -->
      <div class="flex flex-col gap-2.5 p-3 overflow-y-auto flex-1"
           role="list"
           [attr.aria-label]="title + ' items'">
        <ng-content></ng-content>

        <!-- Empty state (shown via CSS when no content is projected) -->
        <div *ngIf="count === 0" class="flex flex-col items-center justify-center py-10 text-center">
          <span class="material-symbols-outlined text-3xl text-base-content/20 mb-2">inbox</span>
          <p class="text-xs text-base-content/40">{{ emptyMessage }}</p>
        </div>
      </div>
    </div>
  `
})
export class PipelineColumnComponent {
  /** Column header title (typically a status label). */
  @Input({ required: true }) title = '';

  /** Number of items in this column (displayed in badge). */
  @Input({ required: true }) count = 0;

  /** CSS color for the column header accent. */
  @Input() color = '#6366f1';

  /** Column position index for staggered animation. */
  @Input() columnIndex = 0;

  /** Message shown when the column has no items. */
  @Input() emptyMessage = 'No items';
}
