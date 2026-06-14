import {
  Component,
  ChangeDetectionStrategy,
  inject,
  DestroyRef,
  OnInit,
  Input
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  FormControl,
  Validators
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Actions, ofType } from '@ngrx/effects';
import { take } from 'rxjs/operators';

import { AuditRecordActions } from '../../store/audit-records/audit-records.actions';
import {
  selectAuditRecordLoading,
  selectAuditRecordError
} from '../../store/audit-records/audit-records.selectors';
import {
  AuditType,
  AuditRecordStatus,
  RiskRating,
  ICreateAuditRecord,
  ITransitionAuditRecordStatus,
  IAuditRecordListItem
} from '../../models/audit-record.model';
import {
  StatusTransitionDialogComponent,
  IStatusTransitionEvent
} from '../../components/status-transition-dialog/status-transition-dialog.component';
import { HasUnsavedChanges } from '../../guards/unsaved-changes.guard';

/** Utility type to remove readonly from all properties. */
type Mutable<T> = { -readonly [P in keyof T]: T[P] };

/**
 * Typed form interface for the Audit Record create form.
 * Maps to the fields required by Requirement 9.1.
 */
export interface IAuditRecordForm {
  auditType: FormControl<AuditType | ''>;
  scope: FormControl<string>;
  auditorName: FormControl<string>;
  auditDate: FormControl<string>;
}

/**
 * Typed form interface for the status transition conditional fields.
 * Required when transitioning to FindingsRecorded or ActionsRequired.
 */
export interface IAuditRecordTransitionForm {
  findings: FormControl<string>;
  riskRating: FormControl<RiskRating | ''>;
  recommendations: FormControl<string>;
  actionDueDate: FormControl<string>;
}

/**
 * Audit Record Create container component.
 *
 * Provides:
 * - Typed ReactiveForm for creating a new audit record with AuditType, Scope, AuditorName, AuditDate
 * - Status transition dialog for transitioning an existing audit record through the state machine
 * - Conditional fields for FindingsRecorded (Findings + RiskRating) and ActionsRequired (Recommendations + ActionDueDate)
 * - Inline validation with user-friendly error messages
 * - Server-side error mapping
 * - Unsaved changes protection via canDeactivate guard
 *
 * Requirements: 9.1, 9.4, 9.5, 16.1
 */
@Component({
  selector: 'app-audit-record-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, StatusTransitionDialogComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-6 max-w-3xl mx-auto">
      <!-- Page Header -->
      <div class="mb-6">
        <div class="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <a routerLink="/legal-compliance" class="hover:text-primary">Legal &amp; Compliance</a>
          <span>/</span>
          <a routerLink="/legal-compliance/audit-records" class="hover:text-primary">Audit Records</a>
          <span>/</span>
          <span>Create</span>
        </div>
        <h1 class="text-2xl font-semibold text-gray-900">Create New Audit Record</h1>
        <p class="mt-1 text-sm text-gray-600">
          Schedule a new audit by selecting the type, defining the scope, and assigning an auditor. The record starts in Planned status.
        </p>
      </div>

      <!-- Server Error Banner -->
      @if (serverError$ | async; as serverError) {
        <div class="alert alert-error mb-4" role="alert">
          <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-5 w-5" fill="none" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{{ serverError }}</span>
        </div>
      }

      <!-- Create Form -->
      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="card bg-base-100 shadow-sm" novalidate>
        <div class="card-body space-y-5">

          <!-- Audit Type Field -->
          <div class="form-control w-full">
            <label class="label" for="auditType">
              <span class="label-text font-medium">Audit Type <span class="text-error">*</span></span>
            </label>
            <select
              id="auditType"
              formControlName="auditType"
              class="select select-bordered w-full"
              [class.select-error]="isFieldInvalid('auditType')"
              (blur)="markTouched('auditType')"
              aria-describedby="auditType-help auditType-error"
            >
              <option value="" disabled>Select audit type</option>
              @for (type of auditTypes; track type.value) {
                <option [value]="type.value">{{ type.label }}</option>
              }
            </select>
            <label class="label" id="auditType-help">
              <span class="label-text-alt text-gray-500">
                Internal: conducted by internal team. External: independent third-party auditor.
                Regulatory: mandated by regulatory body. Spot Check: unplanned compliance check.
              </span>
            </label>
            @if (isFieldInvalid('auditType')) {
              <label class="label" id="auditType-error" role="alert">
                <span class="label-text-alt text-error">{{ getFieldError('auditType') }}</span>
              </label>
            }
          </div>

          <!-- Scope Field -->
          <div class="form-control w-full">
            <label class="label" for="scope">
              <span class="label-text font-medium">Scope <span class="text-error">*</span></span>
            </label>
            <textarea
              id="scope"
              formControlName="scope"
              class="textarea textarea-bordered w-full"
              [class.textarea-error]="isFieldInvalid('scope')"
              placeholder="Define what areas, processes, or systems this audit will cover..."
              rows="4"
              (blur)="markTouched('scope')"
              aria-describedby="scope-help scope-error"
            ></textarea>
            <label class="label" id="scope-help">
              <span class="label-text-alt text-gray-500">Describe the audit scope — what will be examined and the boundaries of the review (10–1000 characters)</span>
            </label>
            @if (isFieldInvalid('scope')) {
              <label class="label" id="scope-error" role="alert">
                <span class="label-text-alt text-error">{{ getFieldError('scope') }}</span>
              </label>
            }
          </div>

          <!-- Auditor Name and Audit Date Row -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Auditor Name Field -->
            <div class="form-control w-full">
              <label class="label" for="auditorName">
                <span class="label-text font-medium">Auditor Name <span class="text-error">*</span></span>
              </label>
              <input
                id="auditorName"
                type="text"
                formControlName="auditorName"
                class="input input-bordered w-full"
                [class.input-error]="isFieldInvalid('auditorName')"
                placeholder="e.g., John Smith"
                (blur)="markTouched('auditorName')"
                aria-describedby="auditorName-help auditorName-error"
              />
              <label class="label" id="auditorName-help">
                <span class="label-text-alt text-gray-500">Full name of the person or firm conducting the audit (2–150 characters)</span>
              </label>
              @if (isFieldInvalid('auditorName')) {
                <label class="label" id="auditorName-error" role="alert">
                  <span class="label-text-alt text-error">{{ getFieldError('auditorName') }}</span>
                </label>
              }
            </div>

            <!-- Audit Date Field -->
            <div class="form-control w-full">
              <label class="label" for="auditDate">
                <span class="label-text font-medium">Audit Date <span class="text-error">*</span></span>
              </label>
              <input
                id="auditDate"
                type="date"
                formControlName="auditDate"
                class="input input-bordered w-full"
                [class.input-error]="isFieldInvalid('auditDate')"
                (blur)="markTouched('auditDate')"
                aria-describedby="auditDate-help auditDate-error"
              />
              <label class="label" id="auditDate-help">
                <span class="label-text-alt text-gray-500">Scheduled or actual date when the audit takes place</span>
              </label>
              @if (isFieldInvalid('auditDate')) {
                <label class="label" id="auditDate-error" role="alert">
                  <span class="label-text-alt text-error">{{ getFieldError('auditDate') }}</span>
                </label>
              }
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="card-actions justify-end pt-4 border-t border-base-200">
            <a routerLink="/legal-compliance/audit-records" class="btn btn-ghost">
              Cancel
            </a>
            <button
              type="submit"
              class="btn btn-primary"
              [disabled]="form.invalid || (loading$ | async)"
            >
              @if (loading$ | async) {
                <span class="loading loading-spinner loading-sm"></span>
                Creating...
              } @else {
                Create Audit Record
              }
            </button>
          </div>

        </div>
      </form>

      <!-- Status Transition Section (for existing records) -->
      @if (auditRecord) {
        <div class="card bg-base-100 shadow-sm mt-6">
          <div class="card-body">
            <h2 class="card-title text-lg">Transition Status</h2>
            <p class="text-sm text-gray-600 mb-4">
              Change the audit record status. Some transitions require additional information.
            </p>

            <div class="flex items-center gap-3">
              <span class="text-sm text-gray-500">Current status:</span>
              <span class="badge badge-outline">{{ formatStatus(auditRecord.status) }}</span>
              <button
                class="btn btn-sm btn-outline btn-primary ml-auto"
                (click)="openTransitionDialog()"
                [disabled]="permittedTransitions.length === 0"
              >
                Change Status
              </button>
            </div>

            @if (permittedTransitions.length === 0) {
              <p class="text-sm text-gray-400 mt-2">No further transitions available from this status.</p>
            }
          </div>
        </div>

        <!-- Transition Conditional Fields Dialog -->
        @if (showConditionalForm) {
          <div class="card bg-base-100 shadow-sm mt-4 border-l-4 border-primary">
            <div class="card-body">
              <h3 class="font-semibold text-base">
                Additional Information Required for {{ formatStatus(pendingTransitionStatus) }}
              </h3>
              <p class="text-sm text-gray-600 mb-4">
                {{ getTransitionGuidance() }}
              </p>

              <form [formGroup]="transitionForm" (ngSubmit)="onTransitionSubmit()" novalidate>
                <div class="space-y-4">

                  @if (requiresFindings) {
                    <!-- Findings Field -->
                    <div class="form-control w-full">
                      <label class="label" for="findings">
                        <span class="label-text font-medium">Findings <span class="text-error">*</span></span>
                      </label>
                      <textarea
                        id="findings"
                        formControlName="findings"
                        class="textarea textarea-bordered w-full"
                        [class.textarea-error]="isTransitionFieldInvalid('findings')"
                        placeholder="Document the audit findings..."
                        rows="3"
                        (blur)="markTransitionTouched('findings')"
                        aria-describedby="findings-error"
                      ></textarea>
                      @if (isTransitionFieldInvalid('findings')) {
                        <label class="label" id="findings-error" role="alert">
                          <span class="label-text-alt text-error">{{ getTransitionFieldError('findings') }}</span>
                        </label>
                      }
                    </div>

                    <!-- Risk Rating Field -->
                    <div class="form-control w-full">
                      <label class="label" for="riskRating">
                        <span class="label-text font-medium">Risk Rating <span class="text-error">*</span></span>
                      </label>
                      <select
                        id="riskRating"
                        formControlName="riskRating"
                        class="select select-bordered w-full"
                        [class.select-error]="isTransitionFieldInvalid('riskRating')"
                        (blur)="markTransitionTouched('riskRating')"
                        aria-describedby="riskRating-error"
                      >
                        <option value="" disabled>Select risk rating</option>
                        @for (rating of riskRatings; track rating.value) {
                          <option [value]="rating.value">{{ rating.label }}</option>
                        }
                      </select>
                      @if (isTransitionFieldInvalid('riskRating')) {
                        <label class="label" id="riskRating-error" role="alert">
                          <span class="label-text-alt text-error">{{ getTransitionFieldError('riskRating') }}</span>
                        </label>
                      }
                    </div>
                  }

                  @if (requiresRecommendations) {
                    <!-- Recommendations Field -->
                    <div class="form-control w-full">
                      <label class="label" for="recommendations">
                        <span class="label-text font-medium">Recommendations <span class="text-error">*</span></span>
                      </label>
                      <textarea
                        id="recommendations"
                        formControlName="recommendations"
                        class="textarea textarea-bordered w-full"
                        [class.textarea-error]="isTransitionFieldInvalid('recommendations')"
                        placeholder="Describe the recommended actions to address findings..."
                        rows="3"
                        (blur)="markTransitionTouched('recommendations')"
                        aria-describedby="recommendations-error"
                      ></textarea>
                      @if (isTransitionFieldInvalid('recommendations')) {
                        <label class="label" id="recommendations-error" role="alert">
                          <span class="label-text-alt text-error">{{ getTransitionFieldError('recommendations') }}</span>
                        </label>
                      }
                    </div>

                    <!-- Action Due Date Field -->
                    <div class="form-control w-full">
                      <label class="label" for="actionDueDate">
                        <span class="label-text font-medium">Action Due Date <span class="text-error">*</span></span>
                      </label>
                      <input
                        id="actionDueDate"
                        type="date"
                        formControlName="actionDueDate"
                        class="input input-bordered w-full"
                        [class.input-error]="isTransitionFieldInvalid('actionDueDate')"
                        (blur)="markTransitionTouched('actionDueDate')"
                        aria-describedby="actionDueDate-error"
                      />
                      @if (isTransitionFieldInvalid('actionDueDate')) {
                        <label class="label" id="actionDueDate-error" role="alert">
                          <span class="label-text-alt text-error">{{ getTransitionFieldError('actionDueDate') }}</span>
                        </label>
                      }
                    </div>
                  }

                  <!-- Transition Form Actions -->
                  <div class="flex justify-end gap-2 pt-2">
                    <button type="button" class="btn btn-sm btn-ghost" (click)="cancelTransition()">
                      Cancel
                    </button>
                    <button
                      type="submit"
                      class="btn btn-sm btn-primary"
                      [disabled]="loading$ | async"
                    >
                      @if (loading$ | async) {
                        <span class="loading loading-spinner loading-xs"></span>
                      }
                      Confirm Transition
                    </button>
                  </div>

                </div>
              </form>
            </div>
          </div>
        }

        <!-- Status Transition Dialog -->
        <app-status-transition-dialog
          [open]="showTransitionDialog"
          [currentStatus]="auditRecord.status"
          [permittedTransitions]="permittedTransitions"
          entityType="Audit Record"
          (transitionSelected)="onTransitionSelected($event)"
          (dialogClosed)="closeTransitionDialog()">
        </app-status-transition-dialog>
      }
    </div>
  `
})
export class AuditRecordCreateComponent implements OnInit, HasUnsavedChanges {
  private readonly fb = inject(FormBuilder);
  private readonly store = inject(Store);
  private readonly router = inject(Router);
  private readonly actions$ = inject(Actions);
  private readonly destroyRef = inject(DestroyRef);

  /** Optional audit record for status transitions (passed when editing/viewing). */
  @Input() auditRecord: IAuditRecordListItem | null = null;

  /** Permitted transitions for the current audit record status. */
  @Input() permittedTransitions: readonly string[] = [];

  /** Whether form has been submitted. */
  submitted = false;

  /** Whether the transition form has been submitted. */
  transitionSubmitted = false;

  /** Whether the form was saved successfully. */
  private saved = false;

  /** Whether the status transition dialog is open. */
  showTransitionDialog = false;

  /** Whether the conditional transition form is visible. */
  showConditionalForm = false;

  /** The pending status to transition to. */
  pendingTransitionStatus = '';

  /** Loading state from the store. */
  readonly loading$ = this.store.select(selectAuditRecordLoading);

  /** Server error from the store. */
  readonly serverError$ = this.store.select(selectAuditRecordError);

  /** Available audit type options. */
  readonly auditTypes: readonly { value: AuditType; label: string }[] = [
    { value: AuditType.Internal, label: 'Internal' },
    { value: AuditType.External, label: 'External' },
    { value: AuditType.Regulatory, label: 'Regulatory' },
    { value: AuditType.SpotCheck, label: 'Spot Check' }
  ];

  /** Available risk rating options. */
  readonly riskRatings: readonly { value: RiskRating; label: string }[] = [
    { value: RiskRating.Low, label: 'Low' },
    { value: RiskRating.Medium, label: 'Medium' },
    { value: RiskRating.High, label: 'High' },
    { value: RiskRating.Critical, label: 'Critical' }
  ];

  /** Typed reactive form for audit record creation. */
  readonly form: FormGroup<IAuditRecordForm> = this.fb.group<IAuditRecordForm>({
    auditType: this.fb.control('' as AuditType | '', {
      nonNullable: true,
      validators: [Validators.required]
    }),
    scope: this.fb.control('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.minLength(10),
        Validators.maxLength(1000)
      ]
    }),
    auditorName: this.fb.control('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(150)
      ]
    }),
    auditDate: this.fb.control('', {
      nonNullable: true,
      validators: [Validators.required]
    })
  });

  /** Typed reactive form for transition conditional fields. */
  readonly transitionForm: FormGroup<IAuditRecordTransitionForm> = this.fb.group<IAuditRecordTransitionForm>({
    findings: this.fb.control('', { nonNullable: true }),
    riskRating: this.fb.control('' as RiskRating | '', { nonNullable: true }),
    recommendations: this.fb.control('', { nonNullable: true }),
    actionDueDate: this.fb.control('', { nonNullable: true })
  });

  /** Whether the current pending transition requires Findings + RiskRating. */
  get requiresFindings(): boolean {
    return this.pendingTransitionStatus === AuditRecordStatus.FindingsRecorded;
  }

  /** Whether the current pending transition requires Recommendations + ActionDueDate. */
  get requiresRecommendations(): boolean {
    return this.pendingTransitionStatus === AuditRecordStatus.ActionsRequired;
  }

  ngOnInit(): void {
    // Listen for successful creation to navigate to the audit records list
    this.actions$
      .pipe(
        ofType(AuditRecordActions.createAuditRecordSuccess),
        take(1),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        this.saved = true;
        this.router.navigate(['/legal-compliance/audit-records']);
      });

    // Listen for successful transition to close the form
    this.actions$
      .pipe(
        ofType(AuditRecordActions.transitionStatusSuccess),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        this.showConditionalForm = false;
        this.pendingTransitionStatus = '';
        this.transitionForm.reset();
        this.transitionSubmitted = false;
      });

    // Listen for creation errors and map to form fields
    this.actions$
      .pipe(
        ofType(AuditRecordActions.createAuditRecordFailure),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(({ error }: { error: string }) => {
        this.mapServerErrorsToForm(error);
      });
  }

  /**
   * Whether the component has unsaved form changes.
   */
  hasUnsavedChanges(): boolean {
    if (this.saved) {
      return false;
    }
    return this.form.dirty;
  }

  /**
   * Submit the create form — dispatch CreateAuditRecord action.
   */
  onSubmit(): void {
    this.submitted = true;
    this.form.markAllAsTouched();

    if (this.form.invalid) {
      return;
    }

    const formValue = this.form.getRawValue();

    const payload: ICreateAuditRecord = {
      auditType: formValue.auditType as AuditType,
      scope: formValue.scope.trim(),
      auditorName: formValue.auditorName.trim(),
      auditDate: formValue.auditDate
    };

    this.store.dispatch(AuditRecordActions.createAuditRecord({ auditRecord: payload }));
  }

  /**
   * Open the status transition dialog.
   */
  openTransitionDialog(): void {
    this.showTransitionDialog = true;
  }

  /**
   * Close the status transition dialog.
   */
  closeTransitionDialog(): void {
    this.showTransitionDialog = false;
  }

  /**
   * Handle a transition selection from the dialog.
   * If the target status requires conditional fields, show the form.
   * Otherwise, dispatch the transition directly.
   */
  onTransitionSelected(event: IStatusTransitionEvent): void {
    this.showTransitionDialog = false;
    this.pendingTransitionStatus = event.newStatus;

    if (this.requiresFindings || this.requiresRecommendations) {
      this.setupConditionalValidators();
      this.showConditionalForm = true;
    } else {
      // Dispatch transition without additional fields
      this.dispatchTransition(event.newStatus, {});
    }
  }

  /**
   * Submit the transition conditional form.
   */
  onTransitionSubmit(): void {
    this.transitionSubmitted = true;
    this.transitionForm.markAllAsTouched();

    // Only validate relevant fields
    if (this.requiresFindings) {
      const findings = this.transitionForm.get('findings');
      const riskRating = this.transitionForm.get('riskRating');
      if (findings?.invalid || riskRating?.invalid) {
        return;
      }
    }

    if (this.requiresRecommendations) {
      const recommendations = this.transitionForm.get('recommendations');
      const actionDueDate = this.transitionForm.get('actionDueDate');
      if (recommendations?.invalid || actionDueDate?.invalid) {
        return;
      }
    }

    const formValue = this.transitionForm.getRawValue();
    const additionalFields: Partial<Mutable<ITransitionAuditRecordStatus>> = {};

    if (this.requiresFindings) {
      additionalFields.findings = formValue.findings.trim();
      additionalFields.riskRating = formValue.riskRating as RiskRating;
    }

    if (this.requiresRecommendations) {
      additionalFields.recommendations = formValue.recommendations.trim();
      additionalFields.actionDueDate = formValue.actionDueDate;
    }

    this.dispatchTransition(this.pendingTransitionStatus, additionalFields as Partial<ITransitionAuditRecordStatus>);
  }

  /**
   * Cancel the conditional transition form.
   */
  cancelTransition(): void {
    this.showConditionalForm = false;
    this.pendingTransitionStatus = '';
    this.transitionForm.reset();
    this.transitionSubmitted = false;
    this.clearConditionalValidators();
  }

  /**
   * Check if a creation form field should display its validation error.
   */
  isFieldInvalid(fieldName: keyof IAuditRecordForm): boolean {
    const control = this.form.get(fieldName);
    return !!(control && control.invalid && (control.touched || this.submitted));
  }

  /**
   * Mark a creation form field as touched.
   */
  markTouched(fieldName: keyof IAuditRecordForm): void {
    const control = this.form.get(fieldName);
    control?.markAsTouched();
  }

  /**
   * Get the user-friendly error message for a creation form field.
   */
  getFieldError(fieldName: keyof IAuditRecordForm): string {
    const control = this.form.get(fieldName);
    if (!control || !control.errors) {
      return '';
    }

    const errors = control.errors;

    if (errors['required']) {
      return this.getRequiredMessage(fieldName);
    }
    if (errors['minlength']) {
      const requiredLength = errors['minlength'].requiredLength as number;
      return `Must be at least ${requiredLength} characters.`;
    }
    if (errors['maxlength']) {
      const requiredLength = errors['maxlength'].requiredLength as number;
      return `Must not exceed ${requiredLength} characters.`;
    }
    if (errors['serverError']) {
      return errors['serverError'] as string;
    }

    return 'Invalid value.';
  }

  /**
   * Check if a transition form field should display its validation error.
   */
  isTransitionFieldInvalid(fieldName: keyof IAuditRecordTransitionForm): boolean {
    const control = this.transitionForm.get(fieldName);
    return !!(control && control.invalid && (control.touched || this.transitionSubmitted));
  }

  /**
   * Mark a transition form field as touched.
   */
  markTransitionTouched(fieldName: keyof IAuditRecordTransitionForm): void {
    const control = this.transitionForm.get(fieldName);
    control?.markAsTouched();
  }

  /**
   * Get the user-friendly error message for a transition form field.
   */
  getTransitionFieldError(fieldName: keyof IAuditRecordTransitionForm): string {
    const control = this.transitionForm.get(fieldName);
    if (!control || !control.errors) {
      return '';
    }

    const errors = control.errors;

    if (errors['required']) {
      const messages: Record<keyof IAuditRecordTransitionForm, string> = {
        findings: 'Please document the audit findings.',
        riskRating: 'Please select a risk rating.',
        recommendations: 'Please provide recommendations for remediation.',
        actionDueDate: 'Please set a due date for the required actions.'
      };
      return messages[fieldName];
    }
    if (errors['minlength']) {
      const requiredLength = errors['minlength'].requiredLength as number;
      return `Must be at least ${requiredLength} characters.`;
    }

    return 'Invalid value.';
  }

  /**
   * Format a PascalCase status to a readable label.
   */
  formatStatus(status: string): string {
    return status
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2')
      .trim();
  }

  /**
   * Get guidance text for the current transition.
   */
  getTransitionGuidance(): string {
    if (this.requiresFindings) {
      return 'To record findings, please provide a summary of what was discovered during the audit and assign a risk rating.';
    }
    if (this.requiresRecommendations) {
      return 'To require actions, please provide specific recommendations and a deadline for completion.';
    }
    return '';
  }

  /**
   * Set up validators for conditional transition fields based on the target status.
   */
  private setupConditionalValidators(): void {
    this.clearConditionalValidators();

    if (this.requiresFindings) {
      this.transitionForm.get('findings')?.setValidators([Validators.required, Validators.minLength(10)]);
      this.transitionForm.get('riskRating')?.setValidators([Validators.required]);
    }

    if (this.requiresRecommendations) {
      this.transitionForm.get('recommendations')?.setValidators([Validators.required, Validators.minLength(10)]);
      this.transitionForm.get('actionDueDate')?.setValidators([Validators.required]);
    }

    this.transitionForm.get('findings')?.updateValueAndValidity();
    this.transitionForm.get('riskRating')?.updateValueAndValidity();
    this.transitionForm.get('recommendations')?.updateValueAndValidity();
    this.transitionForm.get('actionDueDate')?.updateValueAndValidity();
  }

  /**
   * Clear all conditional validators from the transition form.
   */
  private clearConditionalValidators(): void {
    this.transitionForm.get('findings')?.clearValidators();
    this.transitionForm.get('riskRating')?.clearValidators();
    this.transitionForm.get('recommendations')?.clearValidators();
    this.transitionForm.get('actionDueDate')?.clearValidators();

    this.transitionForm.get('findings')?.updateValueAndValidity();
    this.transitionForm.get('riskRating')?.updateValueAndValidity();
    this.transitionForm.get('recommendations')?.updateValueAndValidity();
    this.transitionForm.get('actionDueDate')?.updateValueAndValidity();
  }

  /**
   * Dispatch the transition action to the store.
   */
  private dispatchTransition(newStatus: string, additionalFields: Partial<ITransitionAuditRecordStatus>): void {
    if (!this.auditRecord) {
      return;
    }

    const transition: ITransitionAuditRecordStatus = {
      newStatus: newStatus as AuditRecordStatus,
      findings: additionalFields.findings ?? null,
      riskRating: additionalFields.riskRating ?? null,
      recommendations: additionalFields.recommendations ?? null,
      actionDueDate: additionalFields.actionDueDate ?? null
    };

    this.store.dispatch(AuditRecordActions.transitionStatus({
      id: this.auditRecord.id,
      transition
    }));
  }

  /**
   * Map server-side errors to form field errors.
   */
  private mapServerErrorsToForm(error: string): void {
    const lowerError = error.toLowerCase();

    if (lowerError.includes('scope')) {
      this.form.get('scope')?.setErrors({ serverError: error });
    } else if (lowerError.includes('auditor') || lowerError.includes('auditorname')) {
      this.form.get('auditorName')?.setErrors({ serverError: error });
    } else if (lowerError.includes('audit type') || lowerError.includes('audittype')) {
      this.form.get('auditType')?.setErrors({ serverError: error });
    } else if (lowerError.includes('date') || lowerError.includes('auditdate')) {
      this.form.get('auditDate')?.setErrors({ serverError: error });
    }
  }

  /**
   * Get a user-friendly required message by field name.
   */
  private getRequiredMessage(fieldName: keyof IAuditRecordForm): string {
    const messages: Record<keyof IAuditRecordForm, string> = {
      auditType: 'Please select an audit type.',
      scope: 'Please describe the audit scope.',
      auditorName: 'Please enter the auditor name.',
      auditDate: 'Please select the audit date.'
    };
    return messages[fieldName];
  }
}
