import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ILegalCaseListItem, LegalCasePriority } from '../../models/legal-case.model';

/**
 * CaseCardComponent — Presentational component that renders a single legal case
 * as a compact DaisyUI card for pipeline or list views.
 *
 * Displays: Title, CaseReference, CaseType badge, Priority (colour-coded badge),
 * OpportunityName (if linked), and days since creation.
 *
 * @example
 * ```html
 * <app-case-card
 *   [legalCase]="caseItem"
 *   (cardClick)="onCaseSelected($event)">
 * </app-case-card>
 * ```
 */
@Component({
  selector: 'app-case-card',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="card card-compact bg-base-100 border border-base-200 cursor-pointer
             hover:border-primary/40 hover:shadow-md transition-all duration-200"
      role="button"
      tabindex="0"
      [attr.aria-label]="'Legal case: ' + legalCase.title"
      (click)="onCardClick()"
      (keydown.enter)="onCardClick()"
      (keydown.space)="onCardClick(); $event.preventDefault()"
    >
      <div class="card-body p-4 space-y-2">
        <!-- Title -->
        <h3 class="text-sm font-medium text-base-content line-clamp-2">
          {{ legalCase.title }}
        </h3>

        <!-- Badges: CaseType + Priority -->
        <div class="flex items-center gap-2 flex-wrap">
          <span class="badge badge-outline badge-xs">
            {{ formatCaseType(legalCase.caseType) }}
          </span>
          <span class="badge badge-xs" [ngClass]="getPriorityBadgeClass()">
            {{ legalCase.priority }}
          </span>
        </div>

        <!-- Assigned Solicitor -->
        <p
          *ngIf="legalCase.assignedSolicitor"
          class="text-xs text-base-content/60 truncate"
          [title]="legalCase.assignedSolicitor"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 inline-block mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          {{ legalCase.assignedSolicitor }}
        </p>

        <!-- Solicitor Firm -->
        <p
          *ngIf="legalCase.solicitorFirm"
          class="text-xs text-base-content/50 truncate"
          [title]="legalCase.solicitorFirm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 inline-block mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          {{ legalCase.solicitorFirm }}
        </p>

        <!-- Footer: Days since change + Case Reference -->
        <div class="flex items-center justify-between pt-1 border-t border-base-200">
          <span class="text-xs text-base-content/40">
            {{ getDaysSinceCreated() }}d ago
          </span>
          <span class="text-xs text-base-content/50 font-mono">
            {{ legalCase.caseReference }}
          </span>
        </div>
      </div>
    </div>
  `
})
export class CaseCardComponent {
  /** The legal case list item to display. */
  @Input({ required: true }) legalCase!: ILegalCaseListItem;

  /** Emits when the card is clicked. */
  @Output() cardClick = new EventEmitter<ILegalCaseListItem>();

  onCardClick(): void {
    this.cardClick.emit(this.legalCase);
  }

  /** Calculates days since the case was created. */
  getDaysSinceCreated(): number {
    const created = new Date(this.legalCase.createdAt);
    const now = new Date();
    const diffMs = now.getTime() - created.getTime();
    return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
  }

  /** Formats PascalCase enum value to a readable label. */
  formatCaseType(type: string): string {
    return type
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2')
      .trim();
  }

  /** Returns DaisyUI badge class based on case priority. */
  getPriorityBadgeClass(): string {
    switch (this.legalCase.priority) {
      case LegalCasePriority.Critical:
        return 'badge-error';
      case LegalCasePriority.High:
        return 'badge-warning';
      case LegalCasePriority.Medium:
        return 'badge-info';
      case LegalCasePriority.Low:
        return 'badge-neutral';
      default:
        return 'badge-ghost';
    }
  }
}
