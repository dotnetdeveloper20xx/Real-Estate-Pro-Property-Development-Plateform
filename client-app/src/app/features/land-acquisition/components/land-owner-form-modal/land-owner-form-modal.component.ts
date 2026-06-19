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

import { ModalShellComponent } from '../../../../shared/components/modal-shell/modal-shell.component';
import { LandOwnerService } from '../../services';
import { ToastService } from '../../../../core/services/toast.service';
import { ILandOwner, OwnershipType } from '../../models';

/**
 * Modal for adding or editing a land owner on an opportunity.
 * In create mode, all fields are empty. In edit mode, fields are populated from the existing owner.
 *
 * Usage:
 * ```html
 * <app-land-owner-form-modal
 *   [visible]="showOwnerModal"
 *   [opportunityId]="opportunityId"
 *   [editMode]="true"
 *   [existingOwner]="selectedOwner"
 *   (closed)="showOwnerModal = false"
 *   (saved)="onOwnerSaved()">
 * </app-land-owner-form-modal>
 * ```
 */
@Component({
  selector: 'app-land-owner-form-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalShellComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-modal-shell
      [visible]="visible"
      [title]="editMode ? 'Edit Land Owner' : 'Add Land Owner'"
      icon="person"
      size="md"
      [loading]="loading"
      (closed)="onClose()">

      <!-- Form body -->
      <form #ownerForm="ngForm" (ngSubmit)="onSave()">
        <!-- Owner Name -->
        <div class="form-control w-full mb-4">
          <label class="label" for="owner-name">
            <span class="label-text font-medium">Owner Name <span class="text-error">*</span></span>
          </label>
          <input
            id="owner-name"
            type="text"
            class="input input-bordered input-sm w-full"
            [(ngModel)]="ownerName"
            name="ownerName"
            #ownerNameField="ngModel"
            required
            minlength="2"
            maxlength="200"
            placeholder="Enter owner's full name"
            aria-label="Owner name" />
          <label class="label" *ngIf="ownerNameField.touched && ownerNameField.errors?.['required']">
            <span class="label-text-alt text-error">Owner name is required</span>
          </label>
          <label class="label" *ngIf="ownerNameField.touched && ownerNameField.errors?.['minlength']">
            <span class="label-text-alt text-error">Owner name must be at least 2 characters</span>
          </label>
        </div>

        <!-- Contact Details -->
        <div class="form-control w-full mb-4">
          <label class="label" for="owner-contact">
            <span class="label-text font-medium">Contact Details <span class="text-error">*</span></span>
          </label>
          <textarea
            id="owner-contact"
            class="textarea textarea-bordered w-full h-20 resize-none"
            [(ngModel)]="contactDetails"
            name="contactDetails"
            #contactField="ngModel"
            required
            minlength="5"
            maxlength="500"
            placeholder="Phone, email, or other contact information"
            aria-label="Contact details">
          </textarea>
          <div class="label justify-between">
            <span class="label-text-alt text-error" *ngIf="contactField.touched && contactField.errors?.['required']">
              Contact details are required
            </span>
            <span class="label-text-alt text-error" *ngIf="contactField.touched && contactField.errors?.['minlength']">
              Contact details must be at least 5 characters
            </span>
            <span class="label-text-alt">{{ (contactDetails || '').length }} / 500</span>
          </div>
        </div>

        <!-- Address (optional) -->
        <div class="form-control w-full mb-4">
          <label class="label" for="owner-address">
            <span class="label-text font-medium">Address</span>
            <span class="label-text-alt text-base-content/50">Optional</span>
          </label>
          <textarea
            id="owner-address"
            class="textarea textarea-bordered w-full h-20 resize-none"
            [(ngModel)]="address"
            name="address"
            maxlength="500"
            placeholder="Full postal address"
            aria-label="Address">
          </textarea>
        </div>

        <!-- Ownership Type -->
        <div class="form-control w-full mb-4">
          <label class="label" for="owner-type">
            <span class="label-text font-medium">Ownership Type <span class="text-error">*</span></span>
          </label>
          <select
            id="owner-type"
            class="select select-bordered select-sm w-full"
            [(ngModel)]="ownershipType"
            name="ownershipType"
            #ownerTypeField="ngModel"
            required
            aria-label="Ownership type">
            <option value="" disabled>Select ownership type</option>
            <option [value]="OwnershipType.Freehold">Freehold</option>
            <option [value]="OwnershipType.Leasehold">Leasehold</option>
          </select>
          <label class="label" *ngIf="ownerTypeField.touched && !ownershipType">
            <span class="label-text-alt text-error">Please select an ownership type</span>
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
          {{ editMode ? 'Update Owner' : 'Add Owner' }}
        </button>
      </div>
    </app-modal-shell>
  `
})
export class LandOwnerFormModalComponent implements OnChanges {
  /** Controls modal visibility */
  @Input() visible = false;

  /** The opportunity this owner belongs to */
  @Input() opportunityId = '';

  /** Whether this modal is in edit mode */
  @Input() editMode = false;

  /** Existing owner data for edit mode */
  @Input() existingOwner: ILandOwner | null = null;

  /** Emitted when the modal is closed */
  @Output() closed = new EventEmitter<void>();

  /** Emitted on successful save */
  @Output() saved = new EventEmitter<void>();

  private readonly landOwnerService = inject(LandOwnerService);
  private readonly toastService = inject(ToastService);
  private readonly cdr = inject(ChangeDetectorRef);

  /** Expose enum to template */
  readonly OwnershipType = OwnershipType;

  /** Form fields */
  ownerName = '';
  contactDetails = '';
  address = '';
  ownershipType: OwnershipType | '' = '';
  loading = false;
  errorMessage = '';

  /** Form validity check */
  get isFormValid(): boolean {
    return (
      this.ownerName.trim().length >= 2 &&
      this.ownerName.trim().length <= 200 &&
      this.contactDetails.trim().length >= 5 &&
      this.contactDetails.trim().length <= 500 &&
      !!this.ownershipType
    );
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible'] && this.visible) {
      this.resetForm();
      if (this.editMode && this.existingOwner) {
        this.ownerName = this.existingOwner.name;
        this.contactDetails = this.existingOwner.contactDetails;
        this.address = this.existingOwner.address || '';
        this.ownershipType = this.existingOwner.ownershipType;
      }
    }
  }

  /** Handle form submission */
  onSave(): void {
    if (!this.isFormValid || this.loading) return;

    this.loading = true;
    this.errorMessage = '';
    this.cdr.markForCheck();

    const dto = {
      name: this.ownerName.trim(),
      contactDetails: this.contactDetails.trim(),
      address: this.address.trim() || null,
      ownershipType: this.ownershipType as OwnershipType
    };

    const request$ = this.editMode && this.existingOwner
      ? this.landOwnerService.update(this.opportunityId, this.existingOwner.id, dto)
      : this.landOwnerService.create(this.opportunityId, dto);

    request$.subscribe({
      next: (response) => {
        this.loading = false;
        if (response.success) {
          this.toastService.showSuccess(
            this.editMode ? 'Land owner updated successfully' : 'Land owner added successfully'
          );
          this.saved.emit();
          this.closed.emit();
        } else {
          this.errorMessage = response.errors?.[0] || 'Failed to save land owner';
        }
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err?.error?.errors?.[0] || 'An unexpected error occurred. Please try again.';
        this.toastService.showError(
          this.editMode ? 'Failed to update land owner' : 'Failed to add land owner'
        );
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
    this.ownerName = '';
    this.contactDetails = '';
    this.address = '';
    this.ownershipType = '';
    this.loading = false;
    this.errorMessage = '';
  }
}
