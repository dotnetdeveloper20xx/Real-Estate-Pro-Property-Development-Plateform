import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * A step in the lifecycle stepper.
 */
export interface ILifecycleStep {
  readonly label: string;
  readonly icon: string;
  readonly description: string;
}

/**
 * Unified LifecycleStepperComponent — A generic presentational step tracker that
 * works for any entity lifecycle across modules.
 *
 * Consolidates step progress indicators from:
 * - Land Acquisition (status-progress with connected circles and pulse animation)
 * - Planning Approvals (status-progress-indicator with DaisyUI steps)
 *
 * Displays a horizontal step tracker with icons, labels, descriptions, and visual
 * progress. Supports terminal states (e.g., Withdrawn/Cancelled) with a banner message.
 *
 * @example
 * ```html
 * <app-lifecycle-stepper
 *   [steps]="acquisitionSteps"
 *   [currentStepIndex]="3"
 *   [isTerminal]="false">
 * </app-lifecycle-stepper>
 *
 * <app-lifecycle-stepper
 *   [steps]="acquisitionSteps"
 *   [currentStepIndex]="-1"
 *   [isTerminal]="true"
 *   terminalMessage="This opportunity has been withdrawn from the pipeline.">
 * </app-lifecycle-stepper>
 * ```
 */
@Component({
  selector: 'app-lifecycle-stepper',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    @keyframes pulse-ring {
      0% { transform: scale(1); opacity: 1; }
      100% { transform: scale(1.8); opacity: 0; }
    }
    .current-pulse::after {
      content: '';
      position: absolute;
      inset: -4px;
      border-radius: 50%;
      border: 2px solid currentColor;
      animation: pulse-ring 2s ease-out infinite;
    }
    .connector-fill {
      transition: width 0.6s ease-out;
    }
  `],
  template: `
    <div class="w-full" role="progressbar"
         [attr.aria-label]="'Lifecycle progress'"
         [attr.aria-valuenow]="currentStepIndex + 1"
         [attr.aria-valuemax]="steps.length">

      <!-- Terminal state banner -->
      <div *ngIf="isTerminal" class="flex items-center gap-3 p-3 rounded-lg bg-error/10 border border-error/20 mb-4">
        <span class="material-symbols-outlined text-error text-xl">block</span>
        <div>
          <span class="text-sm font-semibold text-error">Terminal State</span>
          <p *ngIf="terminalMessage" class="text-xs text-base-content/60">{{ terminalMessage }}</p>
        </div>
      </div>

      <!-- Step tracker -->
      <div class="flex items-start justify-between relative" [class.opacity-40]="isTerminal">
        <!-- Connector line (background) -->
        <div class="absolute top-5 left-[24px] right-[24px] h-[3px] bg-base-300 rounded-full z-0"></div>
        <!-- Connector line (filled) -->
        <div class="absolute top-5 left-[24px] h-[3px] bg-gradient-to-r from-primary to-primary rounded-full z-[1] connector-fill"
             [style.width.%]="progressPercent"></div>

        <!-- Steps -->
        <div *ngFor="let step of steps; let i = index; trackBy: trackByIndex"
             class="flex flex-col items-center relative z-[2] flex-1 min-w-0">

          <!-- Circle -->
          <div class="relative flex items-center justify-center w-10 h-10 rounded-full border-[3px] transition-all duration-300"
               [ngClass]="{
                 'bg-primary border-primary text-primary-content shadow-md shadow-primary/25': i < currentStepIndex,
                 'bg-primary border-primary text-primary-content shadow-lg shadow-primary/30 current-pulse': i === currentStepIndex && !isTerminal,
                 'bg-base-100 border-base-300 text-base-content/30': i > currentStepIndex
               }">
            <span class="material-symbols-outlined text-lg"
                  [class.text-base-content/30]="i > currentStepIndex">
              {{ i < currentStepIndex ? 'check' : step.icon }}
            </span>
          </div>

          <!-- Label -->
          <span class="text-[11px] font-semibold mt-2 text-center leading-tight"
                [ngClass]="{
                  'text-primary': i <= currentStepIndex && !isTerminal,
                  'text-base-content/40': i > currentStepIndex
                }">
            {{ step.label }}
          </span>

          <!-- Description (show only for current and completed) -->
          <span class="text-[10px] text-center mt-0.5 hidden sm:block"
                [ngClass]="{
                  'text-base-content/60': i <= currentStepIndex,
                  'text-base-content/0': i > currentStepIndex
                }">
            {{ step.description }}
          </span>
        </div>
      </div>
    </div>
  `
})
export class LifecycleStepperComponent {
  /** Ordered array of step definitions. */
  @Input({ required: true }) steps: readonly ILifecycleStep[] = [];

  /** Zero-based index of the current active step. Use -1 for terminal states. */
  @Input({ required: true }) currentStepIndex = 0;

  /** Whether the entity is in a terminal state (e.g., Withdrawn, Cancelled). */
  @Input() isTerminal = false;

  /** Optional message to display in the terminal state banner. */
  @Input() terminalMessage: string | null = null;

  /** Calculates the progress fill percentage. */
  get progressPercent(): number {
    if (this.isTerminal || this.steps.length <= 1 || this.currentStepIndex < 0) return 0;
    return (this.currentStepIndex / (this.steps.length - 1)) * 100;
  }

  /** TrackBy function for ngFor performance. */
  trackByIndex(index: number): number {
    return index;
  }
}
