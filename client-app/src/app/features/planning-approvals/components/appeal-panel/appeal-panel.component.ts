import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IPlanningAppeal } from '../../models/planning-appeal.model';

/**
 * AppealPanelComponent — A presentational component that displays planning appeal details
 * using DaisyUI card styling.
 *
 * Shows: appeal grounds, type badge, status badge, lodged date, decision date,
 * outcome type, and decision summary.
 *
 * Requirements: 15.2
 *
 * @example
 * ```html
 * <app-appeal-panel
 *   [appeals]="appeals"
 *   (appealSelect)="onAppealSelect($event)">
 * </app-appeal-panel>
 * ```
 */
@Component({
  selector: 'app-appeal-panel',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div *ngIf="appeals.length > 0; else emptyState" class="space-y-4">
      <div
        *ngFor="let appeal of appeals; trackBy: trackById"
        class="card bg-base-100 border border-base-200 shadow-sm"
        role="article"
        [attr.aria-label]="'Appeal lodged ' + (appeal.lodgedDate | date:'dd MMM yyyy')"
      >
        <div class="card-body p-5 space-y-3">
          <!-- Header: Type & Status badges -->
          <div class="flex items-center justify-between flex-wrap gap-2">
            <div class="flex items-center gap-2">
              <span class="badge badge-sm" [ngClass]="getTypeBadgeClass(appeal.appealType)">
                {{ formatType(appeal.appealType) }}
              </span>
              <span class="badge badge-sm" [ngClass]="getStatusBadgeClass(appeal.status)">
                {{ formatStatus(appeal.status) }}
              </span>
              <span
                *ngIf="appeal.appealOutcomeType"
                class="badge badge-sm badge-outline"
                [ngClass]="getOutcomeBadgeClass(appeal.appealOutcomeType)"
              >
                {{ formatOutcome(appeal.appealOutcomeType) }}
              </span>
            </div>
            <button
              class="btn btn-ghost btn-xs"
              (click)="appealSelect.emit(appeal)"
              aria-label="View appeal details"
            >
              View Details
            </button>
          </div>

          <!-- Dates -->
          <div class="flex flex-wrap gap-x-6 gap-y-1 text-sm text-base-content/70">
            <span>
              <span class="font-medium">Lodged:</span>
              {{ appeal.lodgedDate | date:'dd MMM yyyy' }}
            </span>
            <span *ngIf="appeal.decisionDate">
              <span class="font-medium">Decision:</span>
              {{ appeal.decisionDate | date:'dd MMM yyyy' }}
            </span>
          </div>

          <!-- Appeal Grounds -->
          <div class="text-sm text-base-content/80">
            <p class="font-medium text-base-content/60 mb-1">Appeal Grounds</p>
            <p class="line-clamp-3">{{ appeal.appealGrounds }}</p>
          </div>

          <!-- Decision Summary -->
          <div *ngIf="appeal.decisionSummary" class="text-sm">
            <p class="font-medium text-base-content/60 mb-1">Decision Summary</p>
            <p class="text-base-content/80 line-clamp-3">{{ appeal.decisionSummary }}</p>
          </div>
        </div>
      </div>
    </div>

    <ng-template #emptyState>
      <div class="text-center py-8 text-base-content/50">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
            d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
        </svg>
        <p class="font-medium">No appeals filed</p>
        <p class="text-sm mt-1">Appeals will appear here if the application is refused and an appeal is lodged.</p>
      </div>
    </ng-template>
  `
})
export class AppealPanelComponent {
  /** Array of planning appeals to display. */
  @Input({ required: true }) appeals: readonly IPlanningAppeal[] = [];

  /** Emits when an appeal card is clicked for detail view. */
  @Output() appealSelect = new EventEmitter<IPlanningAppeal>();

  /** Returns the DaisyUI badge class for an appeal type. */
  getTypeBadgeClass(type: string): string {
    switch (type) {
      case 'WrittenRepresentations':
        return 'badge-info';
      case 'Hearing':
        return 'badge-warning';
      case 'PublicInquiry':
        return 'badge-error';
      default:
        return 'badge-ghost';
    }
  }

  /** Returns the DaisyUI badge class for an appeal status. */
  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'Lodged':
        return 'badge-neutral';
      case 'UnderReview':
        return 'badge-info';
      case 'HearingScheduled':
        return 'badge-warning';
      case 'Allowed':
        return 'badge-success';
      case 'Dismissed':
        return 'badge-error';
      case 'Closed':
        return 'badge-ghost';
      default:
        return 'badge-ghost';
    }
  }

  /** Returns the badge class for the appeal outcome type. */
  getOutcomeBadgeClass(outcomeType: string): string {
    switch (outcomeType) {
      case 'Approved':
        return 'badge-success';
      case 'ApprovedWithConditions':
        return 'badge-warning';
      default:
        return 'badge-ghost';
    }
  }

  /** Formats PascalCase appeal type to readable label. */
  formatType(type: string): string {
    return type
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2');
  }

  /** Formats PascalCase status to readable label. */
  formatStatus(status: string): string {
    return status
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2');
  }

  /** Formats outcome type to readable label. */
  formatOutcome(outcomeType: string): string {
    return outcomeType
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2');
  }

  /** TrackBy function for ngFor. */
  trackById(_index: number, item: IPlanningAppeal): string {
    return item.id;
  }
}
