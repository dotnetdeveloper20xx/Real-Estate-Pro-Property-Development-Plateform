import {
  Component,
  ChangeDetectionStrategy,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
  ChangeDetectorRef,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ModalComponent } from '../../../../shared/design-system';
import { ContractService } from '../../services';
import { ToastService } from '../../../../core/services/toast.service';

/**
 * Modal for creating a new contract for an opportunity.
 * Captures solicitor information and creates the contract via ContractService.
 *
 * Usage:
 * ```html
 * <app-contract-form-modal
 *   [visible]="showContractModal"
 *   [opportunityId]="opportunityId"
 *   (closed)="showContractModal = false"
 *   (saved)="onContractCreated()">
 * </app-contract-form-modal>
 * ```
 */
@Component({
  selector: 'app-contract-form-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-modal
      [visible]="visible"
      title="Create Contract"
      icon="description"
      size="md"
      [loading]="loading"
      (closed)="onClose()">

      <!-- Form body -->
      <form #contractForm="ngForm" (ngSubmit)="onSave()">
        <!-- Solicitor Name -->
        <div class="form-control w-full mb-4">
          <label class="label" for="contract-solicitor-name">
            <span class="label-text font-medium">Solicitor Name</span>
            <span class="label-text-alt text-base-content/50">Optional</span>
          </label>
          <input
            id="contract-solicitor-name"
            type="text"
            class="input input-bordered input-sm w-full"
            [(ngModel)]="solicitorName"
            name="solicitorName"
            maxlength="200"
            placeholder="Enter solicitor's full name"
            aria-label="Solicitor name" />
        </div>

        <!-- Solicitor Firm -->
        <div class="form-control w-full mb-4">
          <label class="label" for="contract-solicitor-firm">
            <span class="label-text font-medium">Solicitor Firm</span>
            <span class="label-text-alt text-base-content/50">Optional</span>
          </label>
          <input
            id="contract-solicitor-firm"
            type="text"
            class="input input-bordered input-sm w-full"
            [(ngModel)]="solicitorFirm"
            name="solicitorFirm"
            maxlength="200"
            placeholder="Enter law firm name"
            aria-label="Solicitor firm" />
        </div>

        <!-- Solicitor Contact -->
        <div class="form-control w-full mb-4">
          <label class="label" for="contract-solicitor-contact">
            <span class="label-text font-medium">Solicitor Contact</span>
            <span class="label-text-alt text-base-content/50">Optional</span>
          </label>
          <input
            id="contract-solicitor-contact"
            type="text"
            class="input input-bordered input-sm w-full"
            [(ngModel)]="solicitorContact"
            name="solicitorContact"
            maxlength="200"
            placeholder="Phone number or email"
            aria-label="Solicitor contact" />
        </div>

        <!-- Guidance -->
        <div class="alert alert-info text-xs mb-4">
          <span class="material-symbols-outlined text-sm">info</span>
          <span>A contract will be created in Draft status. You can then transition it through the legal review process.</span>
        </div>

        <!-- Error message -->
        <div *ngIf="errorMessage" class="alert alert-error text-sm mb-4" role="alert">
          <span class="material-symbols-outlined text-sm">error</span>
          <span>{{ errorMessage }}</span>
        </div>
      </form>

      <!-- Footer -->
      <div modal-footer class="flex justify-end gap-2">
        <button
          type="button"
          class="btn btn-ghost btn-sm"
          (click)="onClose()"
          [disabled]="loading">
          Cancel
        </button>
        <button
          type="button"
          class="btn btn-primary btn-sm"
          (click)="onSave()"
          [disabled]="loading">
          <span *ngIf="loading" class="loading loading-spinner loading-xs"></span>
          Create Contract
        </button>
      </div>
    </app-modal>
  `
})
export class ContractFormModalComponent implements OnChanges {
  /** Controls modal visibility */
  @Input() visible = false;

  /** The opportunity to create the contract for */
  @Input() opportunityId = '';

  /** Emitted when the modal is closed */
  @Output() closed = new EventEmitter<void>();

  /** Emitted on successful save */
  @Output() saved = new EventEmitter<void>();

  private readonly contractService = inject(ContractService);
  private readonly toastService = inject(ToastService);
  private readonly cdr = inject(ChangeDetectorRef);

  /** Form fields */
  solicitorName = '';
  solicitorFirm = '';
  solicitorContact = '';
  loading = false;
  errorMessage = '';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible'] && this.visible) {
      this.resetForm();
    }
  }

  /** Handle form submission */
  onSave(): void {
    if (this.loading) return;

    this.loading = true;
    this.errorMessage = '';
    this.cdr.markForCheck();

    this.contractService.create(this.opportunityId, {
      solicitorName: this.solicitorName.trim() || null,
      solicitorFirm: this.solicitorFirm.trim() || null,
      solicitorContact: this.solicitorContact.trim() || null
    }).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.success) {
          this.toastService.showSuccess('Contract created successfully');
          this.saved.emit();
          this.closed.emit();
        } else {
          this.errorMessage = response.errors?.[0] || 'Failed to create contract';
        }
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err?.error?.errors?.[0] || 'An unexpected error occurred. Please try again.';
        this.toastService.showError('Failed to create contract');
        this.cdr.markForCheck();
      }
    });
  }

  /** Close the modal */
  onClose(): void {
    if (this.loading) return;
    this.closed.emit();
  }

  /** Reset form to initial state */
  private resetForm(): void {
    this.solicitorName = '';
    this.solicitorFirm = '';
    this.solicitorContact = '';
    this.loading = false;
    this.errorMessage = '';
  }
}
