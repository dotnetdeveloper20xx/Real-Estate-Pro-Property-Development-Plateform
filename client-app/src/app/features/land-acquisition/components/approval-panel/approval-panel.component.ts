import {
  Component,
  ChangeDetectionStrategy,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnChanges,
  SimpleChanges
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { IApprovalRequest, ApprovalStatus } from '../../models/approval.model';

/**
 * Payload emitted when the Finance Director approves an approval request.
 */
export interface IApprovalDecision {
  readonly approvalId: string;
  readonly notes: string;
}

/**
 * Payload emitted when the Finance Director rejects an approval request.
 */
export interface IRejectionDecision {
  readonly approvalId: string;
  readonly reason: string;
}

/**
 * Typed form interface for the approval action fields.
 */
interface IApprovalForm {
  notes: FormControl<string>;
  reason: FormControl<string>;
}

/**
 * Approval Panel Component
 *
 * Displays pending approval request details and provides approve/reject actions.
 * - Shows opportunity ID, requested amount, and current status
 * - Approve action with optional notes textarea
 * - Reject action with required reason textarea (minimum 5 characters)
 * - Validates before emitting events
 *
 * Validates: Requirements 11.3, 11.4
 */
@Component({
  selector: 'app-approval-panel',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="card bg-base-100 shadow-md border border-base-300" *ngIf="approval">
      <!-- Header -->
      <div class="card-body">
        <div class="flex items-center justify-between mb-4">
          <h3 class="card-title text-lg font-semibold">Approval Request</h3>
          <span
            class="badge"
            [ngClass]="statusBadgeClass"
            aria-label="Approval status">
            {{ approval.status }}
          </span>
        </div>

        <!-- Approval Details -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div>
            <p class="text-sm text-base-content/60">Opportunity ID</p>
            <p class="text-sm font-medium truncate" [title]="approval.opportunityId">
              {{ approval.opportunityId }}
            </p>
          </div>
          <div>
            <p class="text-sm text-base-content/60">Requested Amount</p>
            <p class="text-sm font-medium">
              {{ approval.requestedAmount | number:'1.2-2' }}
            </p>
          </div>
          <div>
            <p class="text-sm text-base-content/60">Submitted</p>
            <p class="text-sm font-medium">
              {{ approval.createdAt | date:'medium' }}
            </p>
          </div>
        </div>

        <!-- Action Form (only for pending approvals) -->
        <form
          *ngIf="isPending"
          [formGroup]="form"
          class="space-y-4"
          aria-label="Approval decision form">

          <!-- Approve Section -->
          <div class="form-control">
            <label class="label" for="approval-notes">
              <span class="label-text">Approval Notes (optional)</span>
            </label>
            <textarea
              id="approval-notes"
              class="textarea textarea-bordered w-full"
              formControlName="notes"
              placeholder="Add any notes for this approval..."
              rows="3"
              aria-describedby="notes-help">
            </textarea>
            <label class="label" id="notes-help">
              <span class="label-text-alt text-base-content/50">
                Provide context or conditions for the approval decision.
              </span>
            </label>
          </div>

          <!-- Reject Section -->
          <div class="form-control">
            <label class="label" for="rejection-reason">
              <span class="label-text">
                Rejection Reason
                <span class="text-error">*</span>
              </span>
            </label>
            <textarea
              id="rejection-reason"
              class="textarea textarea-bordered w-full"
              [ngClass]="{ 'textarea-error': isReasonInvalid }"
              formControlName="reason"
              placeholder="Explain why this request is being rejected..."
              rows="3"
              aria-describedby="reason-error reason-help"
              aria-required="true">
            </textarea>
            <label class="label" *ngIf="isReasonInvalid" id="reason-error">
              <span class="label-text-alt text-error" role="alert">
                <span *ngIf="form.controls.reason.errors?.['required']">
                  Rejection reason is required.
                </span>
                <span *ngIf="form.controls.reason.errors?.['minlength']">
                  Reason must be at least 5 characters.
                </span>
              </span>
            </label>
            <label class="label" id="reason-help" *ngIf="!isReasonInvalid">
              <span class="label-text-alt text-base-content/50">
                Required when rejecting. Minimum 5 characters.
              </span>
            </label>
          </div>

          <!-- Action Buttons -->
          <div class="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="button"
              class="btn btn-success flex-1"
              (click)="onApprove()"
              aria-label="Approve this request">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
              </svg>
              Approve Acquisition
            </button>
            <button
              type="button"
              class="btn btn-error flex-1"
              (click)="onReject()"
              aria-label="Reject this request">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
              </svg>
              Reject Acquisition
            </button>
          </div>
        </form>

        <!-- Already Decided State -->
        <div *ngIf="!isPending" class="mt-4">
          <div *ngIf="approval.status === ApprovalStatus.Approved" class="alert alert-success">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
            </svg>
            <div>
              <p class="font-medium">Approved</p>
              <p class="text-sm" *ngIf="approval.approvalNotes">{{ approval.approvalNotes }}</p>
            </div>
          </div>
          <div *ngIf="approval.status === ApprovalStatus.Rejected" class="alert alert-error">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
            <div>
              <p class="font-medium">Rejected</p>
              <p class="text-sm" *ngIf="approval.rejectionReason">{{ approval.rejectionReason }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ApprovalPanelComponent implements OnInit, OnChanges {
  /**
   * The approval request to display and act upon.
   */
  @Input() approval!: IApprovalRequest;

  /**
   * Emitted when the Finance Director approves the request.
   * Payload includes the approval ID and optional notes.
   */
  @Output() approved = new EventEmitter<IApprovalDecision>();

  /**
   * Emitted when the Finance Director rejects the request.
   * Payload includes the approval ID and required reason.
   */
  @Output() rejected = new EventEmitter<IRejectionDecision>();

  /** Expose enum to template */
  readonly ApprovalStatus = ApprovalStatus;

  /** Reactive form for approve/reject fields */
  form!: FormGroup<IApprovalForm>;

  /** Track whether reject was attempted (for validation display) */
  private rejectAttempted = false;

  constructor(private readonly fb: FormBuilder) {}

  ngOnInit(): void {
    this.initForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['approval'] && !changes['approval'].firstChange) {
      this.initForm();
      this.rejectAttempted = false;
    }
  }

  /**
   * Whether the approval is in a pending/actionable state.
   */
  get isPending(): boolean {
    return (
      this.approval?.status === ApprovalStatus.Pending ||
      this.approval?.status === ApprovalStatus.UnderReview
    );
  }

  /**
   * CSS class for the status badge based on current approval status.
   */
  get statusBadgeClass(): string {
    switch (this.approval?.status) {
      case ApprovalStatus.Pending:
        return 'badge-warning';
      case ApprovalStatus.UnderReview:
        return 'badge-info';
      case ApprovalStatus.Approved:
        return 'badge-success';
      case ApprovalStatus.Rejected:
        return 'badge-error';
      case ApprovalStatus.Escalated:
        return 'badge-secondary';
      default:
        return 'badge-ghost';
    }
  }

  /**
   * Whether the reason field should show validation errors.
   */
  get isReasonInvalid(): boolean {
    const control = this.form?.controls.reason;
    return !!control && control.invalid && (control.touched || this.rejectAttempted);
  }

  /**
   * Handle approve action. Notes are optional, so we emit directly.
   */
  onApprove(): void {
    if (!this.approval) {
      return;
    }

    const notes = this.form.controls.notes.value.trim();

    this.approved.emit({
      approvalId: this.approval.id,
      notes
    });
  }

  /**
   * Handle reject action. Validates that reason meets minimum length requirement.
   */
  onReject(): void {
    if (!this.approval) {
      return;
    }

    this.rejectAttempted = true;
    this.form.controls.reason.markAsTouched();
    this.form.controls.reason.updateValueAndValidity();

    if (this.form.controls.reason.invalid) {
      return;
    }

    const reason = this.form.controls.reason.value.trim();

    this.rejected.emit({
      approvalId: this.approval.id,
      reason
    });
  }

  /**
   * Initialize or reset the reactive form.
   */
  private initForm(): void {
    this.form = this.fb.group<IApprovalForm>({
      notes: this.fb.control('', { nonNullable: true }),
      reason: this.fb.control('', {
        nonNullable: true,
        validators: [Validators.required, Validators.minLength(5)]
      })
    });
  }
}
