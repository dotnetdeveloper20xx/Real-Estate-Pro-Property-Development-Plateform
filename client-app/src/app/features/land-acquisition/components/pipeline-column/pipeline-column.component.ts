import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CdkDropList, CdkDrag, CdkDragDrop, CdkDragPreview } from '@angular/cdk/drag-drop';
import { IOpportunityListItem } from '../../models';
import { OpportunityCardComponent } from '../opportunity-card/opportunity-card.component';

/**
 * Presentational component that renders a single pipeline column
 * in the Kanban-style board view with status-colored header,
 * estimated value display, and limited card rendering with "show more" link.
 * Supports Angular CDK drag-and-drop for moving opportunities between columns.
 */
@Component({
  selector: 'app-pipeline-column',
  standalone: true,
  imports: [CommonModule, OpportunityCardComponent, RouterLink, CdkDropList, CdkDrag, CdkDragPreview],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    :host { display: block; }
    .column-enter { animation: fade-in 0.3s ease-out backwards; }
    .cdk-drop-list-dragging .cdk-drag { transition: transform 250ms cubic-bezier(0, 0, 0.2, 1); }
    .cdk-drag-animating { transition: transform 300ms cubic-bezier(0, 0, 0.2, 1); }
    .drop-zone-highlight { border-color: oklch(var(--p)) !important; background-color: oklch(var(--p) / 0.05) !important; }
    .drag-loading-overlay {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: rgba(255, 255, 255, 0.7);
      border-radius: 0.5rem;
      z-index: 10;
    }
  `],
  template: `
    <div class="flex flex-col h-full min-w-[270px] max-w-[300px] rounded-xl border border-base-200/80 bg-base-100/50 column-enter transition-colors duration-200"
         [class.drop-zone-highlight]="isValidDropTarget"
         [style.animation-delay.ms]="columnIndex * 60">
      <!-- Column Header with status color -->
      <div class="px-4 py-3 rounded-t-xl"
           [style.border-bottom]="'3px solid ' + statusColor">
        <div class="flex items-center gap-2">
          <div class="w-2.5 h-2.5 rounded-full" [style.background-color]="statusColor"></div>
          <h2 class="text-sm font-semibold text-base-content flex-1">{{ status }}</h2>
          <span class="min-w-[24px] h-6 flex items-center justify-center rounded-full text-xs font-bold text-white px-1.5"
                [style.background-color]="statusColor">
            {{ count }}
          </span>
        </div>
        <div class="mt-1 ml-[18px] text-xs text-base-content/50">
          <span class="font-medium text-base-content/70">{{ formatValue(totalValue) }}</span>
          <span class="ml-1">Est. Value</span>
        </div>
      </div>

      <!-- Cards List (CDK Drop List) -->
      <div class="flex flex-col gap-2.5 p-3 overflow-y-auto flex-1 custom-scroll"
           cdkDropList
           [cdkDropListData]="opportunities"
           [id]="dropListId"
           [cdkDropListConnectedTo]="connectedDropLists"
           (cdkDropListDropped)="onDrop($event)"
           (cdkDropListEntered)="onDragEntered()"
           (cdkDropListExited)="onDragExited()"
           role="list"
           [attr.aria-label]="status + ' opportunities'">
        @if (opportunities.length === 0) {
          <div class="flex flex-col items-center justify-center py-10 text-center">
            <span class="material-symbols-outlined text-3xl text-base-content/20 mb-2">inbox</span>
            <p class="text-xs text-base-content/40">No opportunities</p>
          </div>
        } @else {
          @for (opportunity of visibleOpportunities; track opportunity.id; let i = $index) {
            <div role="listitem"
                 class="card-animate relative"
                 [style.animation-delay.ms]="i * 50"
                 cdkDrag
                 [cdkDragData]="opportunity">
              <app-opportunity-card
                [opportunity]="opportunity"
                [statusColor]="statusColor"
                (cardClick)="onCardClick($event)"
              />
              <!-- Loading overlay while transition is in progress -->
              <div *ngIf="isTransitioning(opportunity.id)" class="drag-loading-overlay">
                <span class="loading loading-spinner loading-sm text-primary"></span>
              </div>
              <!-- Drag preview (ghost card) -->
              <div *cdkDragPreview class="rounded-lg bg-base-100 border border-primary/40 shadow-lg p-3 w-[260px] opacity-90">
                <h3 class="text-sm font-semibold text-base-content line-clamp-1">{{ opportunity.name }}</h3>
                <div class="flex items-center gap-1.5 text-xs text-base-content/60 mt-1">
                  <span class="material-symbols-outlined text-sm">location_on</span>
                  <span>{{ opportunity.location }}</span>
                </div>
              </div>
            </div>
          }
          @if (remainingCount > 0) {
            <a [routerLink]="['/land-acquisition/opportunities']"
               [queryParams]="{ status: status }"
               class="flex items-center justify-center gap-1 py-2.5 px-3 rounded-lg
                      text-xs font-medium text-primary bg-primary/5
                      hover:bg-primary/10 transition-colors cursor-pointer">
              <span class="material-symbols-outlined text-sm">expand_more</span>
              + {{ remainingCount }} more {{ remainingCount === 1 ? 'opportunity' : 'opportunities' }}
            </a>
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
  @Input() totalValue: number = 0;
  @Input() showLimit: number = 2;

  /** Unique drop list ID for CDK drag-drop connection. */
  @Input() dropListId = '';

  /** IDs of connected drop lists that this column can receive items from / send items to. */
  @Input() connectedDropLists: string[] = [];

  /** Set of opportunity IDs currently transitioning (for loading overlay). */
  @Input() transitioningIds: Set<string> = new Set();

  @Output() cardClick = new EventEmitter<IOpportunityListItem>();

  /** Emits when a card is dropped into this column. */
  @Output() cardDropped = new EventEmitter<CdkDragDrop<IOpportunityListItem[], IOpportunityListItem[], IOpportunityListItem>>();

  /** Whether this column is currently a valid drop target (visual highlighting). */
  isValidDropTarget = false;

  /** Returns only the visible subset of opportunities based on showLimit. */
  get visibleOpportunities(): IOpportunityListItem[] {
    return this.opportunities.slice(0, this.showLimit);
  }

  /** Returns how many opportunities are hidden. */
  get remainingCount(): number {
    return Math.max(0, this.opportunities.length - this.showLimit);
  }

  /** Checks if a specific opportunity is currently transitioning. */
  isTransitioning(id: string): boolean {
    return this.transitioningIds.has(id);
  }

  /** Formats a monetary value for display. */
  formatValue(value: number): string {
    if (value >= 1_000_000) {
      return `£${(value / 1_000_000).toFixed(2)}M`;
    }
    if (value >= 1_000) {
      return `£${(value / 1_000).toFixed(0)}K`;
    }
    return `£${value.toFixed(0)}`;
  }

  onCardClick(opportunity: IOpportunityListItem): void {
    this.cardClick.emit(opportunity);
  }

  onDrop(event: CdkDragDrop<IOpportunityListItem[], IOpportunityListItem[], IOpportunityListItem>): void {
    this.isValidDropTarget = false;
    this.cardDropped.emit(event);
  }

  onDragEntered(): void {
    this.isValidDropTarget = true;
  }

  onDragExited(): void {
    this.isValidDropTarget = false;
  }
}
