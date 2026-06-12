import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * StatusProgressIndicatorComponent — A presentational step bar showing the planning
 * application lifecycle position.
 *
 * Highlights the current status, marks completed (prior) steps with a checkmark,
 * and greys out future steps. Uses DaisyUI `steps` component styling.
 *
 * Default lifecycle:
 * Pre-App → Submitted → Validated → Under Review → Committee → Approved
 *
 * Requirements: 15.3
 *
 * @example
 * ```html
 * <app-status-progress-indicator
 *   currentStatus="Validated"
 *   [steps]="['PreApplication','Submitted','Validated','UnderReview','CommitteeReview','Approved']">
 * </app-status-progress-indicator>
 * ```
 */
@Component({
  selector: 'app-status-progress-indicator',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav aria-label="Application lifecycle progress" class="w-full overflow-x-auto py-2">
      <ul class="steps steps-horizontal w-full">
        <li
          *ngFor="let step of steps; let i = index; trackBy: trackByIndex"
          class="step text-xs"
          [ngClass]="getStepClass(i)"
          [attr.aria-current]="isCurrentStep(i) ? 'step' : null"
          [attr.aria-label]="getStepAriaLabel(step, i)"
        >
          {{ formatStepLabel(step) }}
        </li>
      </ul>
    </nav>
  `
})
export class StatusProgressIndicatorComponent {
  /** The current status value of the planning application. */
  @Input({ required: true }) currentStatus = '';

  /** Ordered array of status labels representing the lifecycle. */
  @Input() steps: readonly string[] = [
    'PreApplication',
    'Submitted',
    'Validated',
    'UnderReview',
    'CommitteeReview',
    'Approved'
  ];

  /**
   * Returns the DaisyUI step class based on position relative to the current status.
   * Completed steps get `step-primary`, current step gets `step-primary`,
   * future steps get no modifier (grey/neutral).
   */
  getStepClass(index: number): string {
    const currentIndex = this.getCurrentStepIndex();
    if (index <= currentIndex) {
      return 'step-primary';
    }
    return '';
  }

  /** Checks if the given index is the current step. */
  isCurrentStep(index: number): boolean {
    return index === this.getCurrentStepIndex();
  }

  /** Formats PascalCase status label into a human-readable string. */
  formatStepLabel(step: string): string {
    return step
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2')
      .replace('Pre Application', 'Pre-App')
      .replace('Committee Review', 'Committee')
      .trim();
  }

  /** Provides an accessible label for each step. */
  getStepAriaLabel(step: string, index: number): string {
    const currentIndex = this.getCurrentStepIndex();
    const label = this.formatStepLabel(step);
    if (index < currentIndex) {
      return `${label} — completed`;
    }
    if (index === currentIndex) {
      return `${label} — current step`;
    }
    return `${label} — upcoming`;
  }

  /** TrackBy function for ngFor performance. */
  trackByIndex(index: number): number {
    return index;
  }

  /** Finds the index of the current status in the steps array. */
  private getCurrentStepIndex(): number {
    const idx = this.steps.indexOf(this.currentStatus);
    return idx >= 0 ? idx : -1;
  }
}
