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
import { DueDiligenceService } from '../../services';
import { ToastService } from '../../../../core/services/toast.service';
import {
  IDueDiligence,
  DueDiligenceType,
  DueDiligenceStatus
} from '../../models';

/**
 * Modal for adding or editing a due diligence check on an opportunity.
 * In create mode, the user selects a type and optionally adds findings.
 * In edit mode, the user transitions the status and provides findings if required.
 *
 * Usage:
 * ```html
 * <app-dd-form-modal
 *   [visible]="showDdModal"
 *   [opportunityId]="opportunityId"
 *   [editMode]="true"
 *   [existingCheck]="selectedCheck"
 *   (closed)="showDdModal = false"
 *   (saved)="onDdSaved()">
 * </app-dd-form-modal>
 * ```
 */
@Component({
  selector: 'app-dd-form-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-modal
      [visible]="visible"
      [title]="editMode ? 'Update Due Diligence' : 'Add Due Diligence Check'"
      icon="fact_check"
      size="md"
      [loading]="loading"
      (closed)="onClose()">

      <!-- Form body -->
      <form #ddForm="ngForm" (ngSubmit)="onSave()">
        <!-- Type -->
        <div class="form-control w-full mb-4">
          <label class="label" for="dd-type">
            <span class="label-text font-medium">Type <span class="text-error">*</span></span>
          </label>
          <select
            id="dd-type"
            class="select select-bordered select-sm w-full"
            [(ngModel)]="selectedType"
            name="type"
            #typeField="ngModel"
            required
            [disabled]="editMode"
            aria-label="Due diligence check type">
            <option value="" disabled>Select check type</option>
            <option *ngFor="let t of typeOptions" [value]="t">{{ t }}</option>
          </select>
          <label class="label" *ngIf="typeField.touched && !selectedType">
            <span class="label-text-alt text-error">Please select a check type</span>
          </label>
        </div>

        <!-- Status (edit mode only) -->
        <div class="form-control w-full mb-4" *ngIf="editMode">
          <label class="label" for="dd-status">
            <span class="label-text font-medium">Status <span class="text-error">*</span></span>
          </label>
          <select
            id="dd-status"
            class="select select-bordered select-sm w-full"
            [(ngModel)]="selectedStatus"
            name="status"
            #statusField="ngModel"
            required
            aria-label="Due diligence status">
            <option value="" disabled>Select status</option>
            <option *ngFor="let s of statusOptions" [value]="s">{{ formatStatus(s) }}</option>
          </select>
          <label class="label" *ngIf="statusField.touched && !selectedStatus">
            <span class="label-text-alt text-error">Please select a status</span>
          </label>
        </div>

        <!-- Findings -->
        <div class="form-control w-full mb-4">
          <label class="label" for="dd-findings">
            <span class="label-text font-medium">
              Findings
              <span class="text-error" *ngIf="isFindingsRequired">*</span>
            </span>
          </label>
          <textarea
            id="dd-findings"
            class="textarea textarea-bordered w-full h-28 resize-none"
            [(ngModel)]="findings"
            name="findings"
            #findingsField="ngModel"
            [required]="isFindingsRequired"
            placeholder="Enter findings, observations, or notes..."
            maxlength="2000"
            aria-label="Due diligence findings">
          </textarea>
          <div class="label justify-between">
            <span class="label-text-alt text-error" *ngIf="findingsField.touched && isFindingsRequired && !findings?.trim()">
              Findings are required when status is Completed or Failed
            </span>
            <span class="label-text-alt">{{ (findings || '').length }} / 2000</span>
          </div>
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
          {{ editMode ? 'Update' : 'Add Check' }}
        </button>
      </div>
    </app-modal>
  `
})
export class DueDiligenceFormModalComponent implements OnChanges {
  /** Controls modal visibility */
  @Input() visible = false;

  /** The opportunity this check belongs to */
  @Input() opportunityId = '';

  /** Whether this modal is in edit mode */
  @Input() editMode = false;

  /** Existing check data for edit mode */
  @Input() existingCheck: IDueDiligence | null = null;

  /** Emitted when the modal is closed */
  @Output() closed = new EventEmitter<void>();

  /** Emitted on successful save */
  @Output() saved = new EventEmitter<void>();

  private readonly ddService = inject(DueDiligenceService);
  private readonly toastService = inject(ToastService);
  private readonly cdr = inject(ChangeDetectorRef);

  /** Form fields */
  selectedType: DueDiligenceType | '' = '';
  selectedStatus: DueDiligenceStatus | '' = '';
  findings = '';
  loading = false;
  errorMessage = '';

  /** Available type options */
  readonly typeOptions: DueDiligenceType[] = [
    DueDiligenceType.Legal,
    DueDiligenceType.Environmental,
    DueDiligenceType.Planning,
    DueDiligenceType.Utilities,
    DueDiligenceType.Valuation
  ];

  /** Available status options */
  readonly statusOptions: DueDiligenceStatus[] = [
    DueDiligenceStatus.Pending,
    DueDiligenceStatus.InProgress,
    DueDiligenceStatus.Completed,
    DueDiligenceStatus.Failed
  ];

  /** Whether findings are required based on status */
  get isFindingsRequired(): boolean {
    return this.editMode && (
      this.selectedStatus === DueDiligenceStatus.Completed ||
      this.selectedStatus === DueDiligenceStatus.Failed
    );
  }

  /** Form validity check */
  get isFormValid(): boolean {
    if (this.editMode) {
      if (!this.selectedStatus) return false;
      if (this.isFindingsRequired && !this.findings?.trim()) return false;
      return true;
    }
    return !!this.selectedType;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible'] && this.visible) {
      this.resetForm();
      if (this.editMode && this.existingCheck) {
        this.selectedType = this.existingCheck.type;
        this.selectedStatus = this.existingCheck.status;
        this.findings = this.existingCheck.findings || '';
      }
    }
  }

  /** Format status for display */
  formatStatus(status: DueDiligenceStatus): string {
    switch (status) {
      case DueDiligenceStatus.InProgress: return 'In Progress';
      default: return status;
    }
  }

  /** Handle form submission */
  onSave(): void {
    if (!this.isFormValid || this.loading) return;

    this.loading = true;
    this.errorMessage = '';
    this.cdr.markForCheck();

    if (this.editMode && this.existingCheck) {
      this.ddService.transitionStatus(this.opportunityId, this.existingCheck.id, {
        targetStatus: this.selectedStatus as DueDiligenceStatus,
        findings: this.findings?.trim() || null
      }).subscribe({
        next: (response) => {
          this.loading = false;
          if (response.success) {
            this.toastService.showSuccess('Due diligence check updated successfully');
            this.saved.emit();
            this.closed.emit();
          } else {
            this.errorMessage = response.errors?.[0] || 'Failed to update due diligence check';
          }
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.loading = false;
          this.errorMessage = err?.error?.errors?.[0] || 'An unexpected error occurred. Please try again.';
          this.toastService.showError('Failed to update due diligence check');
          this.cdr.markForCheck();
        }
      });
    } else {
      this.ddService.create(this.opportunityId, {
        type: this.selectedType as DueDiligenceType,
        findings: this.findings?.trim() || null
      }).subscribe({
        next: (response) => {
          this.loading = false;
          if (response.success) {
            this.toastService.showSuccess('Due diligence check added successfully');
            this.saved.emit();
            this.closed.emit();
          } else {
            this.errorMessage = response.errors?.[0] || 'Failed to create due diligence check';
          }
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.loading = false;
          this.errorMessage = err?.error?.errors?.[0] || 'An unexpected error occurred. Please try again.';
          this.toastService.showError('Failed to create due diligence check');
          this.cdr.markForCheck();
        }
      });
    }
  }

  /** Close the modal */
  onClose(): void {
    if (this.loading) return;
    this.closed.emit();
  }

  /** Reset form to initial state */
  private resetForm(): void {
    this.selectedType = '';
    this.selectedStatus = '';
    this.findings = '';
    this.loading = false;
    this.errorMessage = '';
  }
}
