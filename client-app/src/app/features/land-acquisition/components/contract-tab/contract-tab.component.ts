import {
  Component,
  ChangeDetectionStrategy,
  Input,
  OnInit,
  DestroyRef,
  inject,
  signal
} from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { IContract, IApiResponse, ContractStatus } from '../../models';
import { ContractService, ICreateContract, ITransitionContractStatus } from '../../services';

/**
 * Permitted status transitions for contracts.
 */
const CONTRACT_TRANSITIONS: Record<ContractStatus, ContractStatus[]> = {
  [ContractStatus.Draft]: [ContractStatus.UnderLegalReview],
  [ContractStatus.UnderLegalReview]: [ContractStatus.Approved, ContractStatus.Rejected],
  [ContractStatus.Approved]: [ContractStatus.Signed],
  [ContractStatus.Signed]: [ContractStatus.Exchanged],
  [ContractStatus.Exchanged]: [ContractStatus.Completed],
  [ContractStatus.Rejected]: [],
  [ContractStatus.Completed]: []
};

/**
 * Badge CSS class mapping for contract statuses.
 */
const CONTRACT_STATUS_BADGE: Record<ContractStatus, string> = {
  [ContractStatus.Draft]: 'badge-ghost',
  [ContractStatus.UnderLegalReview]: 'badge-info',
  [ContractStatus.Approved]: 'badge-success',
  [ContractStatus.Rejected]: 'badge-error',
  [ContractStatus.Signed]: 'badge-primary',
  [ContractStatus.Exchanged]: 'badge-warning',
  [ContractStatus.Completed]: 'badge-success'
};

/**
 * Ordered list of contract statuses for the progress indicator.
 */
const CONTRACT_STATUS_ORDER: ContractStatus[] = [
  ContractStatus.Draft,
  ContractStatus.UnderLegalReview,
  ContractStatus.Approved,
  ContractStatus.Signed,
  ContractStatus.Exchanged,
  ContractStatus.Completed
];

/** Typed form interface for creating a contract. */
interface IContractCreateForm {
  solicitorName: FormControl<string>;
  solicitorFirm: FormControl<string>;
  solicitorContact: FormControl<string>;
}

/**
 * Smart component for the Contract tab within the Opportunity Detail page.
 *
 * Displays contract status, solicitor details, deposit amount, and a progress
 * indicator for the contract lifecycle. Supports creating a contract and
 * transitioning through statuses.
 *
 * Loads its own data via ContractService.
 * Standalone, OnPush, Tailwind + DaisyUI.
 *
 * Requirements: 8.1, 8.4
 */
@Component({
  selector: 'app-contract-tab',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DatePipe, CurrencyPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-lg font-semibold text-base-content">Contract & Exchange</h3>
          <p class="text-sm text-base-content/60">
            Track contract drafting, legal review, signing, and exchange.
          </p>
        </div>
        <button
          *ngIf="!contract() && !showCreateForm()"
          class="btn btn-primary btn-sm"
          (click)="toggleCreateForm()"
          aria-controls="contract-create-form">
          <span class="material-symbols-outlined text-sm">add</span>
          Create Contract
        </button>
      </div>

      <!-- Create form -->
      <div
        *ngIf="showCreateForm() && !contract()"
        id="contract-create-form"
        class="card bg-base-200 shadow-sm"
        role="form"
        aria-label="Create contract">
        <div class="card-body p-4">
          <h4 class="card-title text-sm">Create Contract Record</h4>
          <p class="text-xs text-base-content/60 mt-1">
            Enter the solicitor details for this contract. These can be updated later.
          </p>
          <form [formGroup]="createForm" (ngSubmit)="onSubmitCreate()" class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
            <!-- Solicitor Name -->
            <div class="form-control w-full">
              <label class="label" for="solicitor-name">
                <span class="label-text">Solicitor Name</span>
              </label>
              <input
                id="solicitor-name"
                type="text"
                class="input input-bordered input-sm w-full"
                formControlName="solicitorName"
                placeholder="e.g. John Smith" />
            </div>

            <!-- Solicitor Firm -->
            <div class="form-control w-full">
              <label class="label" for="solicitor-firm">
                <span class="label-text">Solicitor Firm</span>
              </label>
              <input
                id="solicitor-firm"
                type="text"
                class="input input-bordered input-sm w-full"
                formControlName="solicitorFirm"
                placeholder="e.g. Smith & Partners LLP" />
            </div>

            <!-- Solicitor Contact -->
            <div class="form-control w-full">
              <label class="label" for="solicitor-contact">
                <span class="label-text">Solicitor Contact</span>
              </label>
              <input
                id="solicitor-contact"
                type="text"
                class="input input-bordered input-sm w-full"
                formControlName="solicitorContact"
                placeholder="e.g. john@smithpartners.co.uk" />
            </div>

            <!-- Submit row -->
            <div class="col-span-full flex justify-end gap-2">
              <button type="button" class="btn btn-ghost btn-sm" (click)="toggleCreateForm()">
                Cancel
              </button>
              <button
                type="submit"
                class="btn btn-primary btn-sm"
                [disabled]="submitting()">
                <span *ngIf="submitting()" class="loading loading-spinner loading-xs"></span>
                Create Contract
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Loading state -->
      <div *ngIf="loading()" class="space-y-3">
        <div class="skeleton h-32 w-full rounded-lg"></div>
        <div class="skeleton h-24 w-full rounded-lg"></div>
      </div>

      <!-- Error state -->
      <div *ngIf="error()" class="alert alert-error shadow-sm" role="alert">
        <span class="material-symbols-outlined">error</span>
        <div>
          <p class="font-medium">Failed to load contract details</p>
          <p class="text-sm">{{ error() }}</p>
        </div>
        <button class="btn btn-ghost btn-sm" (click)="loadContract()">Retry</button>
      </div>

      <!-- Empty state (no contract, no create form showing) -->
      <div
        *ngIf="!loading() && !error() && !contract() && !showCreateForm()"
        class="flex flex-col items-center justify-center py-12 text-base-content/50">
        <span class="material-symbols-outlined text-5xl mb-3">description</span>
        <p class="text-base font-medium">No Contract Created</p>
        <p class="text-sm mt-1">
          Create a contract once an offer has been accepted to begin the legal process.
        </p>
      </div>

      <!-- Contract details -->
      <div *ngIf="!loading() && !error() && contract()" class="space-y-6">
        <!-- Status progress indicator -->
        <div class="card bg-base-100 border border-base-200 shadow-sm">
          <div class="card-body p-4">
            <h4 class="text-sm font-medium text-base-content/70 mb-3">Contract Progress</h4>
            <ul class="steps steps-horizontal w-full text-xs">
              <li
                *ngFor="let step of contractSteps"
                class="step"
                [ngClass]="{ 'step-primary': isStepCompleted(step) }"
                [attr.aria-current]="contract()!.status === step ? 'step' : null">
                {{ formatEnum(step) }}
              </li>
            </ul>
          </div>
        </div>

        <!-- Contract info card -->
        <div class="card bg-base-100 border border-base-200 shadow-sm">
          <div class="card-body p-4">
            <div class="flex items-center justify-between mb-4">
              <h4 class="card-title text-base">Contract Details</h4>
              <span
                class="badge font-medium"
                [ngClass]="getStatusBadgeClass(contract()!.status)"
                role="status"
                [attr.aria-label]="'Contract status: ' + formatEnum(contract()!.status)">
                {{ formatEnum(contract()!.status) }}
              </span>
            </div>

            <!-- Details grid -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <!-- Solicitor Name -->
              <div class="flex flex-col gap-1">
                <span class="text-xs font-medium text-base-content/50 uppercase tracking-wider">Solicitor</span>
                <span class="text-sm text-base-content">
                  {{ contract()!.solicitorName || 'Not specified' }}
                </span>
              </div>

              <!-- Solicitor Firm -->
              <div class="flex flex-col gap-1">
                <span class="text-xs font-medium text-base-content/50 uppercase tracking-wider">Firm</span>
                <span class="text-sm text-base-content">
                  {{ contract()!.solicitorFirm || 'Not specified' }}
                </span>
              </div>

              <!-- Solicitor Contact -->
              <div class="flex flex-col gap-1">
                <span class="text-xs font-medium text-base-content/50 uppercase tracking-wider">Contact</span>
                <span class="text-sm text-base-content">
                  {{ contract()!.solicitorContact || 'Not specified' }}
                </span>
              </div>

              <!-- Deposit Amount -->
              <div class="flex flex-col gap-1" *ngIf="contract()!.depositAmount">
                <span class="text-xs font-medium text-base-content/50 uppercase tracking-wider">Deposit Amount</span>
                <span class="text-sm font-semibold text-base-content">
                  {{ contract()!.depositAmount | currency:'GBP':'symbol':'1.2-2' }}
                </span>
              </div>

              <!-- Created -->
              <div class="flex flex-col gap-1">
                <span class="text-xs font-medium text-base-content/50 uppercase tracking-wider">Created</span>
                <span class="text-sm text-base-content">
                  {{ contract()!.createdAt | date:'dd MMM yyyy, HH:mm' }}
                </span>
              </div>

              <!-- Last Updated -->
              <div class="flex flex-col gap-1" *ngIf="contract()!.updatedAt">
                <span class="text-xs font-medium text-base-content/50 uppercase tracking-wider">Last Updated</span>
                <span class="text-sm text-base-content">
                  {{ contract()!.updatedAt | date:'dd MMM yyyy, HH:mm' }}
                </span>
              </div>
            </div>

            <!-- Status transition actions -->
            <div
              *ngIf="getPermittedTransitions(contract()!.status).length > 0"
              class="divider my-3"></div>
            <div
              *ngIf="getPermittedTransitions(contract()!.status).length > 0"
              class="flex items-center gap-2 flex-wrap">
              <span class="text-sm text-base-content/60">Available Actions:</span>
              <button
                *ngFor="let nextStatus of getPermittedTransitions(contract()!.status)"
                class="btn btn-sm"
                [ngClass]="getTransitionButtonClass(nextStatus)"
                (click)="onTransitionStatus(nextStatus)"
                [disabled]="transitioning()"
                [attr.aria-label]="'Transition to ' + formatEnum(nextStatus)">
                <span *ngIf="transitioning()" class="loading loading-spinner loading-xs"></span>
                {{ getTransitionLabel(nextStatus) }}
              </button>
            </div>
          </div>
        </div>

        <!-- Terminal status info -->
        <div
          *ngIf="isTerminal()"
          class="alert shadow-sm"
          [ngClass]="contract()!.status === 'Completed' ? 'alert-success' : 'alert-error'">
          <span class="material-symbols-outlined">
            {{ contract()!.status === 'Completed' ? 'check_circle' : 'cancel' }}
          </span>
          <span class="text-sm">
            {{ contract()!.status === 'Completed'
              ? 'Contract completed successfully. The legal process is finalised.'
              : 'Contract was rejected. A new contract may need to be created.' }}
          </span>
        </div>
      </div>

      <!-- Deposit amount modal -->
      <dialog
        *ngIf="showDepositModal()"
        class="modal modal-open"
        role="dialog"
        aria-label="Enter deposit amount">
        <div class="modal-box">
          <h3 class="font-bold text-lg">Record Deposit Amount</h3>
          <p class="py-2 text-sm text-base-content/70">
            A deposit amount is required when exchanging contracts. Enter the deposit amount below.
          </p>
          <div class="form-control w-full mt-2">
            <label class="label" for="deposit-amount">
              <span class="label-text">Deposit Amount (GBP) <span class="text-error">*</span></span>
            </label>
            <input
              id="deposit-amount"
              type="number"
              class="input input-bordered w-full"
              [formControl]="depositAmountControl"
              placeholder="e.g. 50000"
              min="0.01"
              step="0.01" />
            <label class="label" *ngIf="depositAmountControl.invalid && depositAmountControl.touched">
              <span class="label-text-alt text-error">Deposit must be a positive amount.</span>
            </label>
          </div>
          <div class="modal-action">
            <button class="btn btn-ghost" (click)="cancelDeposit()">Cancel</button>
            <button
              class="btn btn-primary"
              [disabled]="depositAmountControl.invalid || transitioning()"
              (click)="confirmExchange()">
              <span *ngIf="transitioning()" class="loading loading-spinner loading-xs"></span>
              Confirm Exchange
            </button>
          </div>
        </div>
        <form method="dialog" class="modal-backdrop">
          <button (click)="cancelDeposit()">close</button>
        </form>
      </dialog>
    </div>
  `
})
export class ContractTabComponent implements OnInit {
  @Input({ required: true }) opportunityId!: string;

  private readonly fb = inject(FormBuilder);
  private readonly contractService = inject(ContractService);
  private readonly destroyRef = inject(DestroyRef);

  /** Ordered steps for the progress indicator (excluding Rejected). */
  readonly contractSteps = CONTRACT_STATUS_ORDER;

  /** Reactive signals for component state. */
  readonly contract = signal<IContract | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly showCreateForm = signal(false);
  readonly submitting = signal(false);
  readonly transitioning = signal(false);
  readonly showDepositModal = signal(false);

  /** Form control for deposit amount in the exchange modal. */
  readonly depositAmountControl = new FormControl<number>(0, {
    nonNullable: true,
    validators: [Validators.required, Validators.min(0.01)]
  });

  /** Typed reactive form for creating a contract. */
  readonly createForm: FormGroup<IContractCreateForm> = this.fb.group({
    solicitorName: this.fb.nonNullable.control(''),
    solicitorFirm: this.fb.nonNullable.control(''),
    solicitorContact: this.fb.nonNullable.control('')
  });

  ngOnInit(): void {
    this.loadContract();
  }

  /** Loads the contract from the API. */
  loadContract(): void {
    this.loading.set(true);
    this.error.set(null);

    this.contractService
      .getByOpportunity(this.opportunityId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response: IApiResponse<IContract>) => {
          if (response.success) {
            this.contract.set(response.data);
          } else {
            // No contract yet is not an error
            this.contract.set(null);
          }
          this.loading.set(false);
        },
        error: (err: { status?: number; message?: string }) => {
          // 404 means no contract exists - that's expected
          if (err?.status === 404) {
            this.contract.set(null);
            this.loading.set(false);
          } else {
            this.error.set(err?.message ?? 'Network error. Please try again.');
            this.loading.set(false);
          }
        }
      });
  }

  /** Toggles the create form visibility. */
  toggleCreateForm(): void {
    this.showCreateForm.update((v: boolean) => !v);
    if (!this.showCreateForm()) {
      this.createForm.reset({ solicitorName: '', solicitorFirm: '', solicitorContact: '' });
    }
  }

  /** Submits the create form to create a new contract. */
  onSubmitCreate(): void {
    this.submitting.set(true);
    const { solicitorName, solicitorFirm, solicitorContact } = this.createForm.getRawValue();

    const dto: ICreateContract = {
      solicitorName: solicitorName || null,
      solicitorFirm: solicitorFirm || null,
      solicitorContact: solicitorContact || null
    };

    this.contractService
      .create(this.opportunityId, dto)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response: IApiResponse<IContract>) => {
          if (response.success && response.data) {
            this.contract.set(response.data);
            this.showCreateForm.set(false);
          }
          this.submitting.set(false);
        },
        error: () => {
          this.submitting.set(false);
        }
      });
  }

  /** Handles status transition. For Exchanged status, opens the deposit modal. */
  onTransitionStatus(newStatus: ContractStatus): void {
    if (newStatus === ContractStatus.Exchanged) {
      this.depositAmountControl.reset(0);
      this.showDepositModal.set(true);
      return;
    }

    this.performTransition(newStatus);
  }

  /** Confirms the exchange with deposit amount. */
  confirmExchange(): void {
    if (this.depositAmountControl.invalid) return;

    this.performTransition(ContractStatus.Exchanged, this.depositAmountControl.value);
    this.showDepositModal.set(false);
  }

  /** Cancels the deposit modal. */
  cancelDeposit(): void {
    this.showDepositModal.set(false);
  }

  /** Performs the actual status transition API call. */
  private performTransition(newStatus: ContractStatus, depositAmount?: number | null): void {
    const currentContract = this.contract();
    if (!currentContract) return;

    this.transitioning.set(true);

    const dto: ITransitionContractStatus = {
      newStatus,
      depositAmount: depositAmount ?? null
    };

    this.contractService
      .transitionStatus(this.opportunityId, currentContract.id, dto)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response: IApiResponse<IContract>) => {
          if (response.success && response.data) {
            this.contract.set(response.data);
          }
          this.transitioning.set(false);
        },
        error: () => {
          this.transitioning.set(false);
        }
      });
  }

  /** Checks if a progress step is completed (current status is at or past it). */
  isStepCompleted(step: ContractStatus): boolean {
    const currentContract = this.contract();
    if (!currentContract) return false;

    // If rejected, only Draft is considered completed
    if (currentContract.status === ContractStatus.Rejected) {
      return step === ContractStatus.Draft;
    }

    const currentIndex = CONTRACT_STATUS_ORDER.indexOf(currentContract.status);
    const stepIndex = CONTRACT_STATUS_ORDER.indexOf(step);
    return stepIndex <= currentIndex;
  }

  /** Checks if the contract is in a terminal state. */
  isTerminal(): boolean {
    const currentContract = this.contract();
    if (!currentContract) return false;
    return currentContract.status === ContractStatus.Completed ||
           currentContract.status === ContractStatus.Rejected;
  }

  /** Returns permitted next statuses for a given status. */
  getPermittedTransitions(status: ContractStatus): ContractStatus[] {
    return CONTRACT_TRANSITIONS[status] ?? [];
  }

  /** Returns DaisyUI badge class for a contract status. */
  getStatusBadgeClass(status: ContractStatus): string {
    return CONTRACT_STATUS_BADGE[status] ?? 'badge-ghost';
  }

  /** Returns a human-readable label for a transition action button. */
  getTransitionLabel(status: ContractStatus): string {
    switch (status) {
      case ContractStatus.UnderLegalReview: return 'Submit for Review';
      case ContractStatus.Approved: return 'Approve';
      case ContractStatus.Rejected: return 'Reject';
      case ContractStatus.Signed: return 'Mark Signed';
      case ContractStatus.Exchanged: return 'Exchange';
      case ContractStatus.Completed: return 'Complete';
      default: return this.formatEnum(status);
    }
  }

  /** Returns button styling class based on the target status. */
  getTransitionButtonClass(status: ContractStatus): string {
    switch (status) {
      case ContractStatus.UnderLegalReview: return 'btn-info';
      case ContractStatus.Approved: return 'btn-success';
      case ContractStatus.Rejected: return 'btn-error';
      case ContractStatus.Signed: return 'btn-primary';
      case ContractStatus.Exchanged: return 'btn-warning';
      case ContractStatus.Completed: return 'btn-success';
      default: return 'btn-ghost';
    }
  }

  /** Formats an enum value from PascalCase to spaced words. */
  formatEnum(value: string): string {
    if (!value) return '';
    return value
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2')
      .trim();
  }
}
