import {
  Component,
  ChangeDetectionStrategy,
  Input,
  Output,
  EventEmitter,
  inject,
  signal,
  DestroyRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { IContract, ContractStatus } from '../../models';
import { ContractService, ITransitionContractStatus } from '../../services/contract.service';
import { ToastService } from '@core/services/toast.service';

/**
 * Ordered contract lifecycle steps for the progress indicator (main happy path).
 * Rejected is excluded from the progress track — it's shown as an error branch.
 */
const CONTRACT_LIFECYCLE_STEPS: ContractStatus[] = [
  ContractStatus.Draft,
  ContractStatus.UnderLegalReview,
  ContractStatus.Approved,
  ContractStatus.Signed,
  ContractStatus.Exchanged,
  ContractStatus.Completed
];

/**
 * State machine defining valid next statuses for each contract status.
 */
const CONTRACT_STATE_MACHINE: Record<ContractStatus, ContractStatus[]> = {
  [ContractStatus.Draft]: [ContractStatus.UnderLegalReview],
  [ContractStatus.UnderLegalReview]: [ContractStatus.Approved, ContractStatus.Rejected],
  [ContractStatus.Approved]: [ContractStatus.Signed],
  [ContractStatus.Signed]: [ContractStatus.Exchanged],
  [ContractStatus.Exchanged]: [ContractStatus.Completed],
  [ContractStatus.Rejected]: [],
  [ContractStatus.Completed]: []
};

/**
 * Human-readable button labels for each transition target.
 */
const TRANSITION_LABELS: Record<ContractStatus, string> = {
  [ContractStatus.Draft]: 'Draft',
  [ContractStatus.UnderLegalReview]: 'Submit for Legal Review',
  [ContractStatus.Approved]: 'Approve',
  [ContractStatus.Rejected]: 'Reject',
  [ContractStatus.Signed]: 'Mark as Signed',
  [ContractStatus.Exchanged]: 'Mark as Exchanged',
  [ContractStatus.Completed]: 'Mark as Completed'
};

/**
 * Button styling per target transition status.
 */
const TRANSITION_BUTTON_CLASS: Record<ContractStatus, string> = {
  [ContractStatus.Draft]: 'btn-ghost',
  [ContractStatus.UnderLegalReview]: 'btn-info',
  [ContractStatus.Approved]: 'btn-success',
  [ContractStatus.Rejected]: 'btn-error',
  [ContractStatus.Signed]: 'btn-primary',
  [ContractStatus.Exchanged]: 'btn-warning',
  [ContractStatus.Completed]: 'btn-success'
};

/**
 * Presentational component for contract status transitions.
 *
 * Displays a horizontal progress indicator showing the contract lifecycle,
 * highlights the current status position, and renders action buttons for
 * valid next statuses based on the contract state machine.
 *
 * When transitioning to Exchanged, an inline deposit amount input is shown.
 *
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5
 */
@Component({
  selector: 'app-contract-transition',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    @keyframes pulse-ring {
      0% { transform: scale(1); opacity: 1; }
      100% { transform: scale(1.6); opacity: 0; }
    }
    .status-pulse::after {
      content: '';
      position: absolute;
      inset: -3px;
      border-radius: 50%;
      border: 2px solid currentColor;
      animation: pulse-ring 2s ease-out infinite;
    }
    .connector-fill {
      transition: width 0.6s ease-out;
    }
  `],
  template: `
    <div class="space-y-5">
      <!-- Status Progress Indicator -->
      <div class="card bg-base-100 border border-base-200 shadow-sm">
        <div class="card-body p-4">
          <h4 class="text-sm font-medium text-base-content/70 mb-4">Contract Lifecycle</h4>

          <!-- Rejected banner -->
          <div
            *ngIf="contract.status === ContractStatus.Rejected"
            class="flex items-center gap-3 p-3 rounded-lg bg-error/10 border border-error/20 mb-4"
            role="alert">
            <span class="material-symbols-outlined text-error text-xl">cancel</span>
            <div>
              <span class="text-sm font-semibold text-error">Contract Rejected</span>
              <p class="text-xs text-base-content/60">This contract was rejected during legal review. A new contract may be created.</p>
            </div>
          </div>

          <!-- Step tracker -->
          <div
            class="flex items-start justify-between relative"
            [class.opacity-40]="contract.status === ContractStatus.Rejected"
            role="progressbar"
            [attr.aria-label]="'Contract progress: ' + formatStatus(contract.status)"
            [attr.aria-valuenow]="currentStepIndex + 1"
            [attr.aria-valuemax]="lifecycleSteps.length">

            <!-- Connector line (background) -->
            <div class="absolute top-5 left-[20px] right-[20px] h-[3px] bg-base-300 rounded-full z-0"></div>
            <!-- Connector line (filled) -->
            <div
              class="absolute top-5 left-[20px] h-[3px] bg-gradient-to-r from-primary to-primary rounded-full z-[1] connector-fill"
              [style.width.%]="progressPercent"></div>

            <!-- Steps -->
            <div
              *ngFor="let step of lifecycleSteps; let i = index"
              class="flex flex-col items-center relative z-[2] flex-1 min-w-0">

              <!-- Circle -->
              <div
                class="relative flex items-center justify-center w-10 h-10 rounded-full border-[3px] transition-all duration-300"
                [ngClass]="{
                  'bg-primary border-primary text-primary-content shadow-md shadow-primary/25': isStepCompleted(i),
                  'bg-primary border-primary text-primary-content shadow-lg shadow-primary/30 status-pulse': isCurrentStep(i),
                  'bg-base-100 border-base-300 text-base-content/30': !isStepCompleted(i) && !isCurrentStep(i)
                }">
                <span class="material-symbols-outlined text-lg">
                  {{ isStepCompleted(i) ? 'check' : getStepIcon(step) }}
                </span>
              </div>

              <!-- Label -->
              <span
                class="text-[11px] font-semibold mt-2 text-center leading-tight"
                [ngClass]="{
                  'text-primary': isStepCompleted(i) || isCurrentStep(i),
                  'text-base-content/40': !isStepCompleted(i) && !isCurrentStep(i)
                }">
                {{ formatStatus(step) }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Transition Actions -->
      <div
        *ngIf="validNextStatuses.length > 0"
        class="card bg-base-100 border border-base-200 shadow-sm">
        <div class="card-body p-4">
          <h4 class="text-sm font-medium text-base-content/70 mb-3">Available Actions</h4>

          <!-- Deposit amount input (shown when transitioning to Exchanged) -->
          <div
            *ngIf="showDepositInput()"
            class="bg-base-200/50 p-4 rounded-lg mb-4"
            role="form"
            aria-label="Deposit amount form">
            <label class="text-sm font-medium text-base-content mb-2 block" for="deposit-input">
              Deposit Amount (GBP) <span class="text-error">*</span>
            </label>
            <p class="text-xs text-base-content/60 mb-2">
              Enter the deposit amount required for exchange of contracts.
            </p>
            <div class="flex items-start gap-3">
              <div class="form-control flex-1 max-w-xs">
                <input
                  id="deposit-input"
                  type="number"
                  class="input input-bordered input-sm w-full"
                  [formControl]="depositAmountControl"
                  placeholder="e.g. 50000"
                  min="0.01"
                  step="0.01"
                  aria-describedby="deposit-error" />
                <label
                  id="deposit-error"
                  class="label"
                  *ngIf="depositAmountControl.invalid && depositAmountControl.touched">
                  <span class="label-text-alt text-error">Please enter a positive deposit amount.</span>
                </label>
              </div>
              <button
                class="btn btn-warning btn-sm"
                [disabled]="depositAmountControl.invalid || transitioning()"
                (click)="confirmExchangeTransition()"
                aria-label="Confirm exchange with deposit">
                <span *ngIf="transitioning()" class="loading loading-spinner loading-xs"></span>
                Confirm Exchange
              </button>
              <button
                class="btn btn-ghost btn-sm"
                (click)="cancelDepositInput()"
                [disabled]="transitioning()"
                aria-label="Cancel exchange">
                Cancel
              </button>
            </div>
          </div>

          <!-- Action buttons -->
          <div
            *ngIf="!showDepositInput()"
            class="flex items-center gap-2 flex-wrap">
            <button
              *ngFor="let nextStatus of validNextStatuses"
              class="btn btn-sm"
              [ngClass]="getButtonClass(nextStatus)"
              [disabled]="transitioning()"
              (click)="onTransitionClick(nextStatus)"
              [attr.aria-label]="getTransitionLabel(nextStatus)">
              <span *ngIf="transitioning()" class="loading loading-spinner loading-xs"></span>
              {{ getTransitionLabel(nextStatus) }}
            </button>
          </div>
        </div>
      </div>

      <!-- Terminal state info -->
      <div
        *ngIf="validNextStatuses.length === 0 && contract.status !== ContractStatus.Rejected"
        class="alert alert-success shadow-sm"
        role="status">
        <span class="material-symbols-outlined">check_circle</span>
        <span class="text-sm">Contract completed successfully. The legal process is finalised.</span>
      </div>
    </div>
  `
})
export class ContractTransitionComponent {
  @Input({ required: true }) contract!: IContract;
  @Input({ required: true }) opportunityId!: string;

  @Output() statusChanged = new EventEmitter<void>();

  private readonly contractService = inject(ContractService);
  private readonly toastService = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  /** Expose enum to template. */
  readonly ContractStatus = ContractStatus;

  /** Ordered lifecycle steps for the progress indicator. */
  readonly lifecycleSteps = CONTRACT_LIFECYCLE_STEPS;

  /** Reactive signals for component state. */
  readonly transitioning = signal(false);
  readonly showDepositInput = signal(false);

  /** Form control for deposit amount when transitioning to Exchanged. */
  readonly depositAmountControl = new FormControl<number | null>(null, {
    validators: [Validators.required, Validators.min(0.01)]
  });

  /** Returns the valid next statuses for the current contract status. */
  get validNextStatuses(): ContractStatus[] {
    return CONTRACT_STATE_MACHINE[this.contract.status] ?? [];
  }

  /** Returns the 0-based index of the current status in the lifecycle. */
  get currentStepIndex(): number {
    if (this.contract.status === ContractStatus.Rejected) {
      return 1; // Rejected after UnderLegalReview
    }
    const idx = CONTRACT_LIFECYCLE_STEPS.indexOf(this.contract.status);
    return idx >= 0 ? idx : 0;
  }

  /** Progress percentage for the filled connector line. */
  get progressPercent(): number {
    if (this.contract.status === ContractStatus.Rejected) return 0;
    if (this.lifecycleSteps.length <= 1) return 0;
    return (this.currentStepIndex / (this.lifecycleSteps.length - 1)) * 100;
  }

  /** Checks if a step index is before the current step (completed). */
  isStepCompleted(stepIndex: number): boolean {
    if (this.contract.status === ContractStatus.Rejected) {
      return stepIndex === 0; // Only Draft is completed when rejected
    }
    return stepIndex < this.currentStepIndex;
  }

  /** Checks if a step index is the current step. */
  isCurrentStep(stepIndex: number): boolean {
    if (this.contract.status === ContractStatus.Rejected) return false;
    return stepIndex === this.currentStepIndex;
  }

  /** Returns an icon for each lifecycle step. */
  getStepIcon(step: ContractStatus): string {
    switch (step) {
      case ContractStatus.Draft: return 'edit_note';
      case ContractStatus.UnderLegalReview: return 'gavel';
      case ContractStatus.Approved: return 'thumb_up';
      case ContractStatus.Signed: return 'draw';
      case ContractStatus.Exchanged: return 'swap_horiz';
      case ContractStatus.Completed: return 'check_circle';
      default: return 'circle';
    }
  }

  /** Returns the human-readable button label for a transition target. */
  getTransitionLabel(status: ContractStatus): string {
    return TRANSITION_LABELS[status] ?? this.formatStatus(status);
  }

  /** Returns button CSS class for a transition target. */
  getButtonClass(status: ContractStatus): string {
    return TRANSITION_BUTTON_CLASS[status] ?? 'btn-ghost';
  }

  /** Formats a PascalCase enum value into spaced words. */
  formatStatus(value: string): string {
    if (!value) return '';
    return value
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2')
      .trim();
  }

  /** Handles a transition button click. */
  onTransitionClick(targetStatus: ContractStatus): void {
    if (targetStatus === ContractStatus.Exchanged) {
      this.depositAmountControl.reset(null);
      this.showDepositInput.set(true);
      return;
    }

    this.performTransition(targetStatus);
  }

  /** Confirms the exchange transition with the entered deposit amount. */
  confirmExchangeTransition(): void {
    if (this.depositAmountControl.invalid) return;

    const depositAmount = this.depositAmountControl.value;
    this.showDepositInput.set(false);
    this.performTransition(ContractStatus.Exchanged, depositAmount);
  }

  /** Cancels the deposit amount input. */
  cancelDepositInput(): void {
    this.showDepositInput.set(false);
    this.depositAmountControl.reset(null);
  }

  /** Performs the actual API transition call. */
  private performTransition(targetStatus: ContractStatus, depositAmount?: number | null): void {
    this.transitioning.set(true);

    const dto: ITransitionContractStatus = {
      targetStatus: targetStatus,
      depositAmount: depositAmount ?? null
    };

    this.contractService
      .transitionStatus(this.opportunityId, this.contract.id, dto)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.toastService.showSuccess(
              `Contract transitioned to ${this.formatStatus(targetStatus)} successfully.`
            );
            this.statusChanged.emit();
          } else {
            const errorMsg = response.errors?.length
              ? response.errors.join(', ')
              : 'Failed to transition contract status.';
            this.toastService.showError(errorMsg);
          }
          this.transitioning.set(false);
        },
        error: (err: { error?: { errors?: string[] }; message?: string }) => {
          const errorMsg = err?.error?.errors?.length
            ? err.error.errors.join(', ')
            : 'An error occurred while transitioning contract status. Please try again.';
          this.toastService.showError(errorMsg);
          this.transitioning.set(false);
        }
      });
  }
}
