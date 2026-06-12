import {
  Component,
  ChangeDetectionStrategy,
  inject,
  DestroyRef,
  OnInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  FormControl,
  Validators,
  AbstractControl,
  ValidationErrors
} from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Actions, ofType } from '@ngrx/effects';
import { take } from 'rxjs/operators';

import { ComplianceCheckActions } from '../../store/compliance/compliance.actions';
import {
  selectChecksLoading,
  selectChecksError
} from '../../store/compliance/compliance.selectors';
import {
  ICreateComplianceCheck,
  ComplianceCheckOutcome
} from '../../models';

/**
 * Typed form interface for the Compliance Check form.
 * Maps to Requirements 6.1, 6.2, 6.3.
 */
export interface IComplianceCheckForm {
  checkDate: FormControl<string>;
  outcome: FormControl<ComplianceCheckOutcome | ''>;
  findings: FormControl<string>;
  evidenceReference: FormControl<string>;
  remediationPlan: FormControl<string>;
  remediationDueDate: FormControl<string>;
}

/**
 * Custom validator that ensures the date is today or in the past (not future).
 * Used for CheckDate validation per Requirement 6.2.
 */
function pastOrPresentDateValidator(control: AbstractControl): ValidationErrors | null {
  if (!control.value) {
    return null;
  }
  const inputDate = new Date(control.value);
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  if (inputDate > today) {
    return { futureDate: true };
  }
  return null;
}

/**
 * Custom validator that ensures the date is in the future.
 * Used for RemediationDueDate validation per Requirement 6.3.
 */
function futureDateValidator(control: AbstractControl): ValidationErrors | null {
  if (!control.value) {
    return null;
  }
  const inputDate = new Date(control.value);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (inputDate <= today) {
    return { pastDate: true };
  }
  return null;
}

/**
 * Compliance Check Form container component.
 *
 * Records compliance checks against a requirement. The form conditionally
 * displays RemediationPlan and RemediationDueDate fields when the Outcome
 * is NonCompliant, per Requirement 6.3.
 *
 * Features:
 * - Typed FormGroup with CheckDate, Outcome, Findings, EvidenceReference, RemediationPlan, RemediationDueDate
 * - Conditional fields shown when Outcome is NonCompliant (Requirement 6.3)
 * - Inline validation error messages on blur/submit (Requirement 16.2)
 * - Submit button disabled until form passes client-side validation (Requirement 16.3)
 * - Helper text on form fields for user guidance (Requirement 16.6)
 * - Dispatches ComplianceCheckActions.createCheck on submit (Requirement 6.1)
 */
@Component({
  selector: 'app-compliance-check-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-6 max-w-3xl mx-auto">
      <!-- Page Header -->
      <div class="mb-6">
        <div class="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <a routerLink="/legal-compliance" class="hover:text-primary">Legal &amp; Compliance</a>
          <span>/</span>
          <a routerLink="/legal-compliance/compliance" class="hover:text-primary">Compliance</a>
          <span>/</span>
          <span>Record Check</span>
        </div>
        <h1 class="text-2xl font-semibold text-gray-900">Record Compliance Check</h1>
        <p class="mt-1 text-sm text-gray-600">
          Record the outcome of a compliance check against a requirement.
          If the outcome is Non-Compliant, a remediation plan and due date are required.
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

      <!-- Form -->
      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="card bg-base-100 shadow-sm" novalidate>
        <div class="card-body space-y-5">

          <!-- Check Date Field -->
          <div class="form-control w-full">
            <label class="label" for="checkDate">
              <span class="label-text font-medium">Check Date <span class="text-error">*</span></span>
            </label>
            <input
              id="checkDate"
              type="date"
              formControlName="checkDate"
              class="input input-bordered w-full"
              [class.input-error]="isFieldInvalid('checkDate')"
              [max]="todayDate"
              (blur)="markTouched('checkDate')"
              aria-describedby="checkDate-help checkDate-error"
            />
            <label class="label" id="checkDate-help">
              <span class="label-text-alt text-gray-500">The date this compliance check was performed. Must be today or earlier.</span>
            </label>
            @if (isFieldInvalid('checkDate')) {
              <label class="label" id="checkDate-error" role="alert">
                <span class="label-text-alt text-error">{{ getFieldError('checkDate') }}</span>
              </label>
            }
          </div>

          <!-- Outcome Field -->
          <div class="form-control w-full">
            <label class="label" for="outcome">
              <span class="label-text font-medium">Outcome <span class="text-error">*</span></span>
            </label>
            <select
              id="outcome"
              formControlName="outcome"
              class="select select-bordered w-full"
              [class.select-error]="isFieldInvalid('outcome')"
              (blur)="markTouched('outcome')"
              aria-describedby="outcome-help outcome-error"
            >
              <option value="" disabled>Select outcome</option>
              @for (o of outcomeOptions; track o.value) {
                <option [value]="o.value">{{ o.label }}</option>
              }
            </select>
            <label class="label" id="outcome-help">
              <span class="label-text-alt text-gray-500">
                Compliant: requirement met. Non-Compliant: requirement not met, remediation required.
                Partially Compliant: partially met. Not Applicable: does not apply in this period.
              </span>
            </label>
            @if (isFieldInvalid('outcome')) {
              <label class="label" id="outcome-error" role="alert">
                <span class="label-text-alt text-error">{{ getFieldError('outcome') }}</span>
              </label>
            }
          </div>

          <!-- Findings Field -->
          <div class="form-control w-full">
            <label class="label" for="findings">
              <span class="label-text font-medium">Findings <span class="text-error">*</span></span>
            </label>
            <textarea
              id="findings"
              formControlName="findings"
              class="textarea textarea-bordered w-full"
              [class.textarea-error]="isFieldInvalid('findings')"
              placeholder="Describe what was observed during this compliance check, including any evidence reviewed and conclusions reached..."
              rows="4"
              (blur)="markTouched('findings')"
              aria-describedby="findings-help findings-error"
            ></textarea>
            <label class="label" id="findings-help">
              <span class="label-text-alt text-gray-500">Detailed findings from the check (10–3000 characters). Include evidence reviewed and conclusions.</span>
            </label>
            @if (isFieldInvalid('findings')) {
              <label class="label" id="findings-error" role="alert">
                <span class="label-text-alt text-error">{{ getFieldError('findings') }}</span>
              </label>
            }
          </div>

          <!-- Evidence Reference Field -->
          <div class="form-control w-full">
            <label class="label" for="evidenceReference">
              <span class="label-text font-medium">Evidence Reference</span>
            </label>
            <input
              id="evidenceReference"
              type="text"
              formControlName="evidenceReference"
              class="input input-bordered w-full"
              placeholder="e.g., Document ID, file reference, or URL to supporting evidence"
              (blur)="markTouched('evidenceReference')"
              aria-describedby="evidenceReference-help"
            />
            <label class="label" id="evidenceReference-help">
              <span class="label-text-alt text-gray-500">Optional reference to the evidence that supports this check (e.g., document ID, certificate number, or URL).</span>
            </label>
          </div>

          <!-- Conditional: Remediation Section (shown when NonCompliant) -->
          @if (isNonCompliant) {
            <div class="divider text-sm text-error">Remediation Required</div>

            <div class="alert alert-warning mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-5 w-5" fill="none" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <span>Non-compliant outcome detected. A remediation plan and due date must be provided.</span>
            </div>

            <!-- Remediation Plan Field -->
            <div class="form-control w-full">
              <label class="label" for="remediationPlan">
                <span class="label-text font-medium">Remediation Plan <span class="text-error">*</span></span>
              </label>
              <textarea
                id="remediationPlan"
                formControlName="remediationPlan"
                class="textarea textarea-bordered w-full"
                [class.textarea-error]="isFieldInvalid('remediationPlan')"
                placeholder="Describe the corrective actions required to achieve compliance, including steps, responsible parties, and expected outcomes..."
                rows="4"
                (blur)="markTouched('remediationPlan')"
                aria-describedby="remediationPlan-help remediationPlan-error"
              ></textarea>
              <label class="label" id="remediationPlan-help">
                <span class="label-text-alt text-gray-500">Detailed plan to address non-compliance (minimum 20 characters). Include corrective actions and responsible parties.</span>
              </label>
              @if (isFieldInvalid('remediationPlan')) {
                <label class="label" id="remediationPlan-error" role="alert">
                  <span class="label-text-alt text-error">{{ getFieldError('remediationPlan') }}</span>
                </label>
              }
            </div>

            <!-- Remediation Due Date Field -->
            <div class="form-control w-full">
              <label class="label" for="remediationDueDate">
                <span class="label-text font-medium">Remediation Due Date <span class="text-error">*</span></span>
              </label>
              <input
                id="remediationDueDate"
                type="date"
                formControlName="remediationDueDate"
                class="input input-bordered w-full"
                [class.input-error]="isFieldInvalid('remediationDueDate')"
                [min]="tomorrowDate"
                (blur)="markTouched('remediationDueDate')"
                aria-describedby="remediationDueDate-help remediationDueDate-error"
              />
              <label class="label" id="remediationDueDate-help">
                <span class="label-text-alt text-gray-500">The date by which remediation must be completed. Must be a future date.</span>
              </label>
              @if (isFieldInvalid('remediationDueDate')) {
                <label class="label" id="remediationDueDate-error" role="alert">
                  <span class="label-text-alt text-error">{{ getFieldError('remediationDueDate') }}</span>
                </label>
              }
            </div>
          }

          <!-- Action Buttons -->
          <div class="card-actions justify-end pt-4 border-t border-base-200">
            <button type="button" class="btn btn-ghost" (click)="onCancel()">
              Cancel
            </button>
            <button
              type="submit"
              class="btn btn-primary"
              [disabled]="form.invalid || (loading$ | async)"
            >
              @if (loading$ | async) {
                <span class="loading loading-spinner loading-sm"></span>
                Recording...
              } @else {
                Record Compliance Check
              }
            </button>
          </div>

        </div>
      </form>
    </div>
  `
})
export class ComplianceCheckFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly store = inject(Store);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly actions$ = inject(Actions);
  private readonly destroyRef = inject(DestroyRef);

  /** Whether the form has been submitted (triggers full validation display). */
  submitted = false;

  /** The compliance requirement ID this check is being recorded against. */
  private requirementId = '';

  /** Loading state from the store. */
  readonly loading$ = this.store.select(selectChecksLoading);

  /** Server error from the store. */
  readonly serverError$ = this.store.select(selectChecksError);

  /** Today's date formatted as YYYY-MM-DD for the max attribute on CheckDate. */
  readonly todayDate: string;

  /** Tomorrow's date formatted as YYYY-MM-DD for the min attribute on RemediationDueDate. */
  readonly tomorrowDate: string;

  /** Available outcome options with user-friendly labels. */
  readonly outcomeOptions: readonly { value: ComplianceCheckOutcome; label: string }[] = [
    { value: ComplianceCheckOutcome.Compliant, label: 'Compliant' },
    { value: ComplianceCheckOutcome.NonCompliant, label: 'Non-Compliant' },
    { value: ComplianceCheckOutcome.PartiallyCompliant, label: 'Partially Compliant' },
    { value: ComplianceCheckOutcome.NotApplicable, label: 'Not Applicable' }
  ];

  /** Typed reactive form for compliance check creation. */
  readonly form: FormGroup<IComplianceCheckForm>;

  constructor() {
    const now = new Date();
    this.todayDate = this.formatDate(now);

    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    this.tomorrowDate = this.formatDate(tomorrow);

    this.form = this.fb.group<IComplianceCheckForm>({
      checkDate: this.fb.control('', {
        nonNullable: true,
        validators: [Validators.required, pastOrPresentDateValidator]
      }),
      outcome: this.fb.control('' as ComplianceCheckOutcome | '', {
        nonNullable: true,
        validators: [Validators.required]
      }),
      findings: this.fb.control('', {
        nonNullable: true,
        validators: [
          Validators.required,
          Validators.minLength(10),
          Validators.maxLength(3000)
        ]
      }),
      evidenceReference: this.fb.control('', {
        nonNullable: true
      }),
      remediationPlan: this.fb.control('', {
        nonNullable: true
      }),
      remediationDueDate: this.fb.control('', {
        nonNullable: true
      })
    });

    // Listen for outcome changes to toggle remediation field validators
    this.form.controls.outcome.valueChanges.subscribe((outcome: ComplianceCheckOutcome | '') => {
      this.updateRemediationValidators(outcome);
    });
  }

  ngOnInit(): void {
    // Extract requirementId from route params
    this.requirementId = this.route.snapshot.paramMap.get('requirementId')
      ?? this.route.snapshot.queryParamMap.get('requirementId')
      ?? '';

    // Listen for successful check creation to navigate back
    this.actions$
      .pipe(
        ofType(ComplianceCheckActions.createCheckSuccess),
        take(1),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        this.navigateBack();
      });

    // Listen for server errors and map to form fields
    this.actions$
      .pipe(
        ofType(ComplianceCheckActions.createCheckFailure),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(({ error }: { error: string }) => {
        this.mapServerErrorsToForm(error);
      });
  }

  /**
   * Whether the current outcome is NonCompliant — controls conditional field visibility.
   */
  get isNonCompliant(): boolean {
    return this.form.controls.outcome.value === ComplianceCheckOutcome.NonCompliant;
  }

  /**
   * Submit the form — dispatch ComplianceCheckActions.createCheck.
   */
  onSubmit(): void {
    this.submitted = true;
    this.form.markAllAsTouched();

    if (this.form.invalid) {
      return;
    }

    const formValue = this.form.getRawValue();

    const payload: ICreateComplianceCheck = {
      complianceRequirementId: this.requirementId,
      checkDate: formValue.checkDate,
      outcome: formValue.outcome as ComplianceCheckOutcome,
      findings: formValue.findings.trim(),
      evidenceReference: formValue.evidenceReference.trim() || null,
      remediationPlan: this.isNonCompliant ? formValue.remediationPlan.trim() || null : null,
      remediationDueDate: this.isNonCompliant ? formValue.remediationDueDate || null : null
    };

    this.store.dispatch(ComplianceCheckActions.createCheck({ check: payload }));
  }

  /**
   * Navigate back to the compliance section.
   */
  onCancel(): void {
    this.navigateBack();
  }

  /**
   * Check if a specific form field should display its validation error.
   * Shows error when field is touched or the form has been submitted.
   */
  isFieldInvalid(fieldName: keyof IComplianceCheckForm): boolean {
    const control = this.form.get(fieldName);
    return !!(control && control.invalid && (control.touched || this.submitted));
  }

  /**
   * Mark a field as touched (used on blur to trigger inline validation).
   */
  markTouched(fieldName: keyof IComplianceCheckForm): void {
    const control = this.form.get(fieldName);
    control?.markAsTouched();
  }

  /**
   * Get the user-friendly error message for a field.
   */
  getFieldError(fieldName: keyof IComplianceCheckForm): string {
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
    if (errors['futureDate']) {
      return 'Check date must be today or in the past.';
    }
    if (errors['pastDate']) {
      return 'Remediation due date must be a future date.';
    }
    if (errors['serverError']) {
      return errors['serverError'] as string;
    }

    return 'Invalid value.';
  }

  /**
   * Update validators on remediation fields based on outcome selection.
   * NonCompliant requires remediationPlan (≥20 chars) and remediationDueDate (future date).
   */
  private updateRemediationValidators(outcome: ComplianceCheckOutcome | ''): void {
    const planControl = this.form.controls.remediationPlan;
    const dueDateControl = this.form.controls.remediationDueDate;

    if (outcome === ComplianceCheckOutcome.NonCompliant) {
      planControl.setValidators([Validators.required, Validators.minLength(20)]);
      dueDateControl.setValidators([Validators.required, futureDateValidator]);
    } else {
      planControl.clearValidators();
      dueDateControl.clearValidators();
      planControl.setValue('');
      dueDateControl.setValue('');
    }

    planControl.updateValueAndValidity();
    dueDateControl.updateValueAndValidity();
  }

  /**
   * Navigate back to the compliance requirement detail or list.
   */
  private navigateBack(): void {
    if (this.requirementId) {
      this.router.navigate(['/legal-compliance/compliance', this.requirementId]);
    } else {
      this.router.navigate(['/legal-compliance/compliance']);
    }
  }

  /**
   * Map server-side errors to form field errors for inline display.
   */
  private mapServerErrorsToForm(error: string): void {
    const lowerError = error.toLowerCase();

    if (lowerError.includes('check date') || lowerError.includes('checkdate')) {
      this.form.get('checkDate')?.setErrors({ serverError: error });
    } else if (lowerError.includes('outcome')) {
      this.form.get('outcome')?.setErrors({ serverError: error });
    } else if (lowerError.includes('findings')) {
      this.form.get('findings')?.setErrors({ serverError: error });
    } else if (lowerError.includes('remediation plan') || lowerError.includes('remediationplan')) {
      this.form.get('remediationPlan')?.setErrors({ serverError: error });
    } else if (lowerError.includes('remediation') && lowerError.includes('date')) {
      this.form.get('remediationDueDate')?.setErrors({ serverError: error });
    } else if (lowerError.includes('evidence')) {
      this.form.get('evidenceReference')?.setErrors({ serverError: error });
    }
  }

  /**
   * Get a user-friendly required message by field name.
   */
  private getRequiredMessage(fieldName: keyof IComplianceCheckForm): string {
    const messages: Record<keyof IComplianceCheckForm, string> = {
      checkDate: 'Please select the date this check was performed.',
      outcome: 'Please select the compliance check outcome.',
      findings: 'Please enter the findings from this check.',
      evidenceReference: 'Please enter an evidence reference.',
      remediationPlan: 'A remediation plan is required for non-compliant outcomes.',
      remediationDueDate: 'A remediation due date is required for non-compliant outcomes.'
    };
    return messages[fieldName];
  }

  /**
   * Format a Date as YYYY-MM-DD string for HTML date inputs.
   */
  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
