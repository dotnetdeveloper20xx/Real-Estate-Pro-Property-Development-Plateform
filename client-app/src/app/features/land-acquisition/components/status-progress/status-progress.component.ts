import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OpportunityStatus } from '../../models';

interface ILifecycleStep {
  status: OpportunityStatus;
  label: string;
  icon: string;
  description: string;
}

const LIFECYCLE_STEPS: ILifecycleStep[] = [
  { status: OpportunityStatus.Identified, label: 'Identified', icon: 'search', description: 'Land opportunity found' },
  { status: OpportunityStatus.InitialReview, label: 'Review', icon: 'preview', description: 'Initial assessment' },
  { status: OpportunityStatus.DueDiligence, label: 'Due Diligence', icon: 'fact_check', description: 'Legal & technical checks' },
  { status: OpportunityStatus.OfferMade, label: 'Offer', icon: 'request_quote', description: 'Offer submitted' },
  { status: OpportunityStatus.UnderContract, label: 'Contract', icon: 'handshake', description: 'Exchange in progress' },
  { status: OpportunityStatus.Acquired, label: 'Acquired', icon: 'check_circle', description: 'Purchase complete' }
];

/**
 * Premium status progress indicator showing the opportunity lifecycle
 * as a connected step tracker with icons, descriptions, and visual state.
 */
@Component({
  selector: 'app-status-progress',
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
    <div class="w-full" role="progressbar" [attr.aria-label]="'Lifecycle: ' + currentLabel" [attr.aria-valuenow]="currentStepIndex + 1" [attr.aria-valuemax]="steps.length">
      <!-- Withdrawn banner -->
      <div *ngIf="isWithdrawn" class="flex items-center gap-3 p-3 rounded-lg bg-error/10 border border-error/20 mb-4">
        <span class="material-symbols-outlined text-error text-xl">block</span>
        <div>
          <span class="text-sm font-semibold text-error">Withdrawn</span>
          <p class="text-xs text-base-content/60">This opportunity has been withdrawn from the pipeline.</p>
        </div>
      </div>

      <!-- Step tracker -->
      <div class="flex items-start justify-between relative" [class.opacity-40]="isWithdrawn">
        <!-- Connector line (background) -->
        <div class="absolute top-5 left-[24px] right-[24px] h-[3px] bg-base-300 rounded-full z-0"></div>
        <!-- Connector line (filled) -->
        <div class="absolute top-5 left-[24px] h-[3px] bg-gradient-to-r from-primary to-primary rounded-full z-[1] connector-fill"
             [style.width.%]="progressPercent"></div>

        <!-- Steps -->
        <div *ngFor="let step of steps; let i = index; trackBy: trackByStatus"
             class="flex flex-col items-center relative z-[2] flex-1 min-w-0">

          <!-- Circle -->
          <div class="relative flex items-center justify-center w-10 h-10 rounded-full border-[3px] transition-all duration-300"
               [ngClass]="{
                 'bg-primary border-primary text-primary-content shadow-md shadow-primary/25': i < currentStepIndex,
                 'bg-primary border-primary text-primary-content shadow-lg shadow-primary/30 current-pulse': i === currentStepIndex && !isWithdrawn,
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
                  'text-primary': i <= currentStepIndex && !isWithdrawn,
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
export class StatusProgressComponent {
  @Input({ required: true }) currentStatus!: OpportunityStatus;

  readonly steps = LIFECYCLE_STEPS;

  get isWithdrawn(): boolean {
    return this.currentStatus === OpportunityStatus.Withdrawn;
  }

  get currentStepIndex(): number {
    if (this.isWithdrawn) return -1;
    const idx = LIFECYCLE_STEPS.findIndex(s => s.status === this.currentStatus);
    return idx >= 0 ? idx : 0;
  }

  get currentLabel(): string {
    if (this.isWithdrawn) return 'Withdrawn';
    return LIFECYCLE_STEPS[this.currentStepIndex]?.label ?? this.currentStatus;
  }

  get progressPercent(): number {
    if (this.isWithdrawn || this.steps.length <= 1) return 0;
    return (this.currentStepIndex / (this.steps.length - 1)) * 100;
  }

  trackByStatus(_index: number, step: ILifecycleStep): string {
    return step.status;
  }
}
