import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OpportunityStatus } from '../../models';

/**
 * Ordered lifecycle steps for the opportunity pipeline.
 * Withdrawn is excluded from the progress indicator because it is
 * a terminal side-branch, not a sequential forward step.
 */
const LIFECYCLE_STEPS: { status: OpportunityStatus; label: string }[] = [
  { status: OpportunityStatus.Identified, label: 'Identified' },
  { status: OpportunityStatus.InitialReview, label: 'Initial Review' },
  { status: OpportunityStatus.DueDiligence, label: 'Due Diligence' },
  { status: OpportunityStatus.OfferMade, label: 'Offer Made' },
  { status: OpportunityStatus.UnderContract, label: 'Under Contract' },
  { status: OpportunityStatus.Acquired, label: 'Acquired' },
  { status: OpportunityStatus.Withdrawn, label: 'Withdrawn' }
];

/**
 * Presentational component that renders a horizontal step indicator
 * showing the opportunity lifecycle position.
 *
 * Each step is displayed using DaisyUI's "steps" utility.
 * Completed steps (before and including the current status) are highlighted.
 * If the status is Withdrawn, all steps up to Withdrawn are shown as
 * completed with the final step in red.
 *
 * Usage:
 * ```html
 * <app-status-progress [currentStatus]="opportunity.status"></app-status-progress>
 * ```
 */
@Component({
  selector: 'app-status-progress',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ul class="steps steps-horizontal w-full text-xs" role="progressbar" [attr.aria-label]="'Opportunity lifecycle: ' + currentLabel">
      <li
        *ngFor="let step of steps; trackBy: trackByStatus"
        class="step"
        [ngClass]="getStepClass(step.status)"
        [attr.aria-current]="step.status === currentStatus ? 'step' : null">
        <span class="hidden sm:inline">{{ step.label }}</span>
      </li>
    </ul>
  `
})
export class StatusProgressComponent {
  @Input({ required: true }) currentStatus!: OpportunityStatus;

  readonly steps = LIFECYCLE_STEPS;

  get currentLabel(): string {
    const found = LIFECYCLE_STEPS.find(s => s.status === this.currentStatus);
    return found?.label ?? this.currentStatus;
  }

  /**
   * Determines the CSS class for each step based on lifecycle position.
   * - If current status is Withdrawn, mark all non-forward steps as neutral
   *   and the Withdrawn step as error.
   * - Otherwise, steps up to and including the current status get step-primary.
   */
  getStepClass(stepStatus: OpportunityStatus): string {
    if (this.currentStatus === OpportunityStatus.Withdrawn) {
      return stepStatus === OpportunityStatus.Withdrawn
        ? 'step-error'
        : '';
    }

    // Withdrawn step should not be highlighted for non-withdrawn opportunities
    if (stepStatus === OpportunityStatus.Withdrawn) {
      return '';
    }

    const currentIndex = LIFECYCLE_STEPS.findIndex(s => s.status === this.currentStatus);
    const stepIndex = LIFECYCLE_STEPS.findIndex(s => s.status === stepStatus);

    return stepIndex <= currentIndex ? 'step-primary' : '';
  }

  trackByStatus(_index: number, step: { status: OpportunityStatus }): string {
    return step.status;
  }
}
