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
import { HttpClient } from '@angular/common/http';

import { ModalComponent, CurrencyDisplayComponent } from '../../../../shared/design-system';
import { ToastService } from '../../../../core/services/toast.service';
import { IApiResponse } from '../../models';

/**
 * Modal for requesting an approval from Finance Director.
 * Captures the requested amount and submits an approval request against the opportunity.
 *
 * Usage:
 * ```html
 * <app-approval-request-modal
 *   [visible]="showApprovalModal"
 *   [opportunityId]="opportunityId"
 *   (closed)="showApprovalModal = false"
 *   (saved)="onApprovalRequested()">
 * </app-approval-request-modal>
 * ```
 */
@Component({
  selector: 'app-approval-request-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent, CurrencyDisplayComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-modal
      [visible]="visible"
      title="Request Approval"
      subtitle="Submit for Finance Director review"
      icon="approval"
      size="sm"
      [loading]="loading"
      (closed)="onClose()">

      <!-- Form body -->
      <form #approvalForm="ngForm" (ngSubmit)="onSave()">
        <!-- Requested Amount -->
        <div class="form-control w-full mb-4">
          <label class="label" for="approval-amount">
            <span class="label-text font-medium">Requested Amount (£) <span class="text-error">*</span></span>
          </label>
          <app-currency
            mode="edit"
            [(ngModel)]="requestedAmount"
            name="requestedAmount"
            #amountField="ngModel"
            [required]="true">
          </app-currency>
          <label class="label" *ngIf="amountField.touched && requestedAmount <= 0">
            <span class="label-text-alt text-error">Please enter a positive amount</span>
          </label>
        </div>

        <!-- Guidance -->
        <div class="alert alert-info text-xs mb-4">
          <span class="material-symbols-outlined text-sm">info</span>
          <span>This will submit an approval request to the Finance Director for review. You will be notified once a decision is made.</span>
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
          class="btn btn-secondary btn-sm"
          (click)="onSave()"
          [disabled]="loading || !isFormValid">
          <span *ngIf="loading" class="loading loading-spinner loading-xs"></span>
          <span class="material-symbols-outlined text-sm">send</span>
          Submit Request
        </button>
      </div>
    </app-modal>
  `
})
export class ApprovalRequestModalComponent implements OnChanges {
  /** Controls modal visibility */
  @Input() visible = false;

  /** The opportunity this approval is for */
  @Input() opportunityId = '';

  /** Emitted when the modal is closed */
  @Output() closed = new EventEmitter<void>();

  /** Emitted on successful save */
  @Output() saved = new EventEmitter<void>();

  private readonly http = inject(HttpClient);
  private readonly toastService = inject(ToastService);
  private readonly cdr = inject(ChangeDetectorRef);

  /** Form fields */
  requestedAmount = 0;
  loading = false;
  errorMessage = '';

  /** Form validity check */
  get isFormValid(): boolean {
    return this.requestedAmount > 0;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible'] && this.visible) {
      this.resetForm();
    }
  }

  /** Handle form submission */
  onSave(): void {
    if (!this.isFormValid || this.loading) return;

    this.loading = true;
    this.errorMessage = '';
    this.cdr.markForCheck();

    this.http.post<IApiResponse<unknown>>('/api/v1/approvals', {
      opportunityId: this.opportunityId,
      requestedAmount: this.requestedAmount
    }).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.success) {
          this.toastService.showSuccess('Approval request submitted successfully');
          this.saved.emit();
          this.closed.emit();
        } else {
          this.errorMessage = response.errors?.[0] || 'Failed to submit approval request';
        }
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err?.error?.errors?.[0] || 'An unexpected error occurred. Please try again.';
        this.toastService.showError('Failed to submit approval request');
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
    this.requestedAmount = 0;
    this.loading = false;
    this.errorMessage = '';
  }
}
