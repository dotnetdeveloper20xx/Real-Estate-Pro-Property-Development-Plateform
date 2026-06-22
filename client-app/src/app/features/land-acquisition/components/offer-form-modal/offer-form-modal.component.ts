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
import { CurrencyInputComponent } from '../../../../shared/components/currency-input/currency-input.component';
import { OfferService } from '../../services';
import { ToastService } from '../../../../core/services/toast.service';

/**
 * Modal for submitting a new offer or counter-offer on an opportunity.
 * Uses ModalComponent as the outer wrapper with CurrencyInputComponent for amount entry.
 *
 * Usage:
 * ```html
 * <app-offer-form-modal
 *   [visible]="showOfferModal"
 *   [opportunityId]="opportunityId"
 *   [isCounterOffer]="false"
 *   (closed)="showOfferModal = false"
 *   (saved)="onOfferSaved()">
 * </app-offer-form-modal>
 * ```
 */
@Component({
  selector: 'app-offer-form-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent, CurrencyInputComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-modal
      [visible]="visible"
      [title]="isCounterOffer ? 'Counter Offer' : 'Submit Offer'"
      icon="request_quote"
      size="md"
      [loading]="loading"
      (closed)="onClose()">

      <!-- Form body -->
      <form #offerForm="ngForm" (ngSubmit)="onSave()">
        <!-- Amount -->
        <div class="form-control w-full mb-4">
          <label class="label" for="offer-amount">
            <span class="label-text font-medium">Amount (£) <span class="text-error">*</span></span>
          </label>
          <app-currency-input
            [(ngModel)]="amount"
            name="amount"
            #amountField="ngModel"
            [required]="true"
            ariaLabel="Offer amount in GBP">
          </app-currency-input>
          <label class="label" *ngIf="amountField.touched && (amount <= 0)">
            <span class="label-text-alt text-error">Please enter a positive amount</span>
          </label>
        </div>

        <!-- Currency (readonly) -->
        <div class="form-control w-full mb-4">
          <label class="label" for="offer-currency">
            <span class="label-text font-medium">Currency</span>
          </label>
          <input
            id="offer-currency"
            type="text"
            class="input input-bordered input-sm w-full"
            value="GBP"
            readonly
            disabled
            aria-label="Currency" />
        </div>

        <!-- Valid Until -->
        <div class="form-control w-full mb-4">
          <label class="label" for="offer-valid-until">
            <span class="label-text font-medium">Valid Until <span class="text-error">*</span></span>
          </label>
          <input
            id="offer-valid-until"
            type="date"
            class="input input-bordered input-sm w-full"
            [(ngModel)]="validUntil"
            name="validUntil"
            #validUntilField="ngModel"
            required
            [min]="minDate"
            aria-label="Offer valid until date" />
          <label class="label" *ngIf="validUntilField.touched && !validUntil">
            <span class="label-text-alt text-error">Please select a future date</span>
          </label>
          <label class="label" *ngIf="validUntilField.touched && validUntil && !isFutureDate(validUntil)">
            <span class="label-text-alt text-error">Date must be in the future</span>
          </label>
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
          [disabled]="loading || !isFormValid">
          <span *ngIf="loading" class="loading loading-spinner loading-xs"></span>
          {{ isCounterOffer ? 'Submit Counter Offer' : 'Submit Offer' }}
        </button>
      </div>
    </app-modal>
  `
})
export class OfferFormModalComponent implements OnChanges {
  /** Controls modal visibility */
  @Input() visible = false;

  /** The opportunity to submit the offer against */
  @Input() opportunityId = '';

  /** Whether this is a counter-offer */
  @Input() isCounterOffer = false;

  /** The original offer ID (used for counter-offers) */
  @Input() originalOfferId: string | null = null;

  /** Emitted when the modal is closed without saving */
  @Output() closed = new EventEmitter<void>();

  /** Emitted when the offer is successfully created */
  @Output() saved = new EventEmitter<void>();

  private readonly offerService = inject(OfferService);
  private readonly toastService = inject(ToastService);
  private readonly cdr = inject(ChangeDetectorRef);

  /** Form fields */
  amount = 0;
  validUntil = '';
  loading = false;
  errorMessage = '';

  /** Minimum date for the date picker (tomorrow) */
  get minDate(): string {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  }

  /** Form validity check */
  get isFormValid(): boolean {
    return this.amount > 0 && !!this.validUntil && this.isFutureDate(this.validUntil);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible'] && this.visible) {
      this.resetForm();
    }
  }

  /** Check if a date string represents a future date */
  isFutureDate(dateStr: string): boolean {
    if (!dateStr) return false;
    const selected = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return selected > today;
  }

  /** Handle form submission */
  onSave(): void {
    if (!this.isFormValid || this.loading) return;

    this.loading = true;
    this.errorMessage = '';
    this.cdr.markForCheck();

    this.offerService.create(this.opportunityId, {
      amount: this.amount,
      currency: 'GBP',
      validUntil: this.validUntil
    }).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.success) {
          this.toastService.showSuccess(
            this.isCounterOffer ? 'Counter offer submitted successfully' : 'Offer submitted successfully'
          );
          this.saved.emit();
          this.closed.emit();
        } else {
          this.errorMessage = response.errors?.[0] || 'Failed to submit offer';
        }
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err?.error?.errors?.[0] || 'An unexpected error occurred. Please try again.';
        this.toastService.showError('Failed to submit offer');
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
    this.amount = 0;
    this.validUntil = '';
    this.loading = false;
    this.errorMessage = '';
  }
}
