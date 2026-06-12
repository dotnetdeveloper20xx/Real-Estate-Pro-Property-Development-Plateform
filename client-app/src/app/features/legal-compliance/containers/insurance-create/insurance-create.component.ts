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
import { take, filter } from 'rxjs/operators';

import { InsuranceActions } from '../../store/insurance/insurance.actions';
import {
  selectInsuranceLoading,
  selectInsuranceError,
  selectInsuranceRecordById
} from '../../store/insurance/insurance.selectors';
import {
  ICreateInsuranceRecord,
  IUpdateInsuranceRecord,
  IInsuranceRecordListItem,
  CoverageType
} from '../../models';
import { HasUnsavedChanges } from '../../guards/unsaved-changes.guard';

/**
 * Typed form interface for the Insurance create/edit form.
 * Maps to the fields required by Requirements 7.1 and 7.2.
 */
export interface IInsuranceForm {
  policyNumber: FormControl<string>;
  insurer: FormControl<string>;
  coverageType: FormControl<CoverageType | ''>;
  coverAmount: FormControl<number | null>;
  premium: FormControl<number | null>;
  currency: FormControl<string>;
  startDate: FormControl<string>;
  expiryDate: FormControl<string>;
  legalCaseId: FormControl<string>;
  opportunityId: FormControl<string>;
}

/**
 * Custom validator: ensures startDate is before expiryDate.
 * Applied at form group level to cross-validate both date fields.
 */
function dateRangeValidator(group: AbstractControl): ValidationErrors | null {
  const startDate = group.get('startDate')?.value as string;
  const expiryDate = group.get('expiryDate')?.value as string;

  if (!startDate || !expiryDate) {
    return null;
  }

  const start = new Date(startDate);
  const expiry = new Date(expiryDate);

  if (start >= expiry) {
    return { dateRange: true };
  }
  return null;
}

/**
 * Custom validator: ensures a valid ISO 4217 currency code (3 uppercase letters).
 */
function currencyCodeValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value as string;
  if (!value) {
    return null;
  }
  const iso4217Pattern = /^[A-Z]{3}$/;
  if (!iso4217Pattern.test(value.trim())) {
    return { invalidCurrency: true };
  }
  return null;
}

/**
 * Custom validator: ensures the value is a positive number.
 */
function positiveNumberValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value as number | null;
  if (value === null || value === undefined) {
    return null;
  }
  if (value <= 0) {
    return { positiveNumber: true };
  }
  return null;
}

/**
 * Insurance Create/Edit container component.
 *
 * Supports both creation and editing of insurance records through a single
 * reactive form with typed FormGroup. When an `id` route parameter is
 * present, the component operates in edit mode and pre-populates the form.
 *
 * Features:
 * - Typed FormGroup with PolicyNumber (3-50), Insurer (2-200), CoverageType (dropdown),
 *   CoverAmount, Premium, Currency (ISO 4217), StartDate, ExpiryDate
 * - Inline validation error messages on blur/submit (Requirement 16.2)
 * - Submit button disabled until form passes client-side validation (Requirement 16.3)
 * - Server-side error mapping to form fields (Requirement 16.4)
 * - Unsaved changes detection with canDeactivate guard (Requirement 16.5)
 * - Helper text on complex form fields (Requirement 16.6)
 * - Dispatches InsuranceActions.createInsuranceRecord on submit (Requirement 7.1)
 */
@Component({
  selector: 'app-insurance-create',
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
          <a routerLink="/legal-compliance/insurance" class="hover:text-primary">Insurance</a>
          <span>/</span>
          <span>{{ isEditMode ? 'Edit Insurance Record' : 'Create Insurance Record' }}</span>
        </div>
        <h1 class="text-2xl font-semibold text-gray-900">
          {{ isEditMode ? 'Edit Insurance Record' : 'Create New Insurance Record' }}
        </h1>
        <p class="mt-1 text-sm text-gray-600">
          {{ isEditMode
            ? 'Update the insurance policy details below. All changes are tracked in the audit trail.'
            : 'Register a new insurance policy. Complete the required fields below to add coverage to the register.'
          }}
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

          <!-- Policy Number and Insurer Row -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Policy Number Field -->
            <div class="form-control w-full">
              <label class="label" for="policyNumber">
                <span class="label-text font-medium">Policy Number <span class="text-error">*</span></span>
              </label>
              <input
                id="policyNumber"
                type="text"
                formControlName="policyNumber"
                class="input input-bordered w-full"
                [class.input-error]="isFieldInvalid('policyNumber')"
                placeholder="e.g., PI-2024-00123"
                (blur)="markTouched('policyNumber')"
                aria-describedby="policyNumber-help policyNumber-error"
              />
              <label class="label" id="policyNumber-help">
                <span class="label-text-alt text-gray-500">The unique policy reference number (3–50 characters)</span>
              </label>
              @if (isFieldInvalid('policyNumber')) {
                <label class="label" id="policyNumber-error" role="alert">
                  <span class="label-text-alt text-error">{{ getFieldError('policyNumber') }}</span>
                </label>
              }
            </div>

            <!-- Insurer Field -->
            <div class="form-control w-full">
              <label class="label" for="insurer">
                <span class="label-text font-medium">Insurer <span class="text-error">*</span></span>
              </label>
              <input
                id="insurer"
                type="text"
                formControlName="insurer"
                class="input input-bordered w-full"
                [class.input-error]="isFieldInvalid('insurer')"
                placeholder="e.g., Aviva PLC"
                (blur)="markTouched('insurer')"
                aria-describedby="insurer-help insurer-error"
              />
              <label class="label" id="insurer-help">
                <span class="label-text-alt text-gray-500">The insurance company or underwriter (2–200 characters)</span>
              </label>
              @if (isFieldInvalid('insurer')) {
                <label class="label" id="insurer-error" role="alert">
                  <span class="label-text-alt text-error">{{ getFieldError('insurer') }}</span>
                </label>
              }
            </div>
          </div>

          <!-- Coverage Type Field -->
          <div class="form-control w-full">
            <label class="label" for="coverageType">
              <span class="label-text font-medium">Coverage Type <span class="text-error">*</span></span>
            </label>
            <select
              id="coverageType"
              formControlName="coverageType"
              class="select select-bordered w-full"
              [class.select-error]="isFieldInvalid('coverageType')"
              (blur)="markTouched('coverageType')"
              aria-describedby="coverageType-help coverageType-error"
            >
              <option value="" disabled>Select a coverage type</option>
              @for (type of coverageTypes; track type.value) {
                <option [value]="type.value">{{ type.label }}</option>
              }
            </select>
            <label class="label" id="coverageType-help">
              <span class="label-text-alt text-gray-500">
                Professional Indemnity: professional negligence claims.
                Public Liability: injury/damage to third parties.
                Employers Liability: employee workplace injuries.
                Building Insurance: physical property damage.
                Title Insurance: title defects.
                Contractors All Risk: construction project cover.
                Legal Expenses: legal costs cover.
              </span>
            </label>
            @if (isFieldInvalid('coverageType')) {
              <label class="label" id="coverageType-error" role="alert">
                <span class="label-text-alt text-error">{{ getFieldError('coverageType') }}</span>
              </label>
            }
          </div>

          <!-- Cover Amount, Premium, and Currency Row -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <!-- Cover Amount Field -->
            <div class="form-control w-full">
              <label class="label" for="coverAmount">
                <span class="label-text font-medium">Cover Amount <span class="text-error">*</span></span>
              </label>
              <input
                id="coverAmount"
                type="number"
                formControlName="coverAmount"
                class="input input-bordered w-full"
                [class.input-error]="isFieldInvalid('coverAmount')"
                placeholder="e.g., 5000000.00"
                step="0.01"
                min="0.01"
                (blur)="markTouched('coverAmount')"
                aria-describedby="coverAmount-help coverAmount-error"
              />
              <label class="label" id="coverAmount-help">
                <span class="label-text-alt text-gray-500">Maximum coverage value. Must be positive.</span>
              </label>
              @if (isFieldInvalid('coverAmount')) {
                <label class="label" id="coverAmount-error" role="alert">
                  <span class="label-text-alt text-error">{{ getFieldError('coverAmount') }}</span>
                </label>
              }
            </div>

            <!-- Premium Field -->
            <div class="form-control w-full">
              <label class="label" for="premium">
                <span class="label-text font-medium">Premium <span class="text-error">*</span></span>
              </label>
              <input
                id="premium"
                type="number"
                formControlName="premium"
                class="input input-bordered w-full"
                [class.input-error]="isFieldInvalid('premium')"
                placeholder="e.g., 12500.00"
                step="0.01"
                min="0.01"
                (blur)="markTouched('premium')"
                aria-describedby="premium-help premium-error"
              />
              <label class="label" id="premium-help">
                <span class="label-text-alt text-gray-500">Annual premium amount. Must be positive.</span>
              </label>
              @if (isFieldInvalid('premium')) {
                <label class="label" id="premium-error" role="alert">
                  <span class="label-text-alt text-error">{{ getFieldError('premium') }}</span>
                </label>
              }
            </div>

            <!-- Currency Field -->
            <div class="form-control w-full">
              <label class="label" for="currency">
                <span class="label-text font-medium">Currency <span class="text-error">*</span></span>
              </label>
              <input
                id="currency"
                type="text"
                formControlName="currency"
                class="input input-bordered w-full"
                [class.input-error]="isFieldInvalid('currency')"
                placeholder="e.g., GBP"
                maxlength="3"
                (blur)="markTouched('currency')"
                aria-describedby="currency-help currency-error"
              />
              <label class="label" id="currency-help">
                <span class="label-text-alt text-gray-500">ISO 4217 code (e.g., GBP, EUR, USD)</span>
              </label>
              @if (isFieldInvalid('currency')) {
                <label class="label" id="currency-error" role="alert">
                  <span class="label-text-alt text-error">{{ getFieldError('currency') }}</span>
                </label>
              }
            </div>
          </div>

          <!-- Date Range Row -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Start Date Field -->
            <div class="form-control w-full">
              <label class="label" for="startDate">
                <span class="label-text font-medium">Start Date <span class="text-error">*</span></span>
              </label>
              <input
                id="startDate"
                type="date"
                formControlName="startDate"
                class="input input-bordered w-full"
                [class.input-error]="isFieldInvalid('startDate') || hasDateRangeError()"
                (blur)="markTouched('startDate')"
                aria-describedby="startDate-help startDate-error"
              />
              <label class="label" id="startDate-help">
                <span class="label-text-alt text-gray-500">The date coverage begins</span>
              </label>
              @if (isFieldInvalid('startDate')) {
                <label class="label" id="startDate-error" role="alert">
                  <span class="label-text-alt text-error">{{ getFieldError('startDate') }}</span>
                </label>
              }
            </div>

            <!-- Expiry Date Field -->
            <div class="form-control w-full">
              <label class="label" for="expiryDate">
                <span class="label-text font-medium">Expiry Date <span class="text-error">*</span></span>
              </label>
              <input
                id="expiryDate"
                type="date"
                formControlName="expiryDate"
                class="input input-bordered w-full"
                [class.input-error]="isFieldInvalid('expiryDate') || hasDateRangeError()"
                (blur)="markTouched('expiryDate')"
                aria-describedby="expiryDate-help expiryDate-error"
              />
              <label class="label" id="expiryDate-help">
                <span class="label-text-alt text-gray-500">The date coverage expires. Must be after Start Date.</span>
              </label>
              @if (isFieldInvalid('expiryDate')) {
                <label class="label" id="expiryDate-error" role="alert">
                  <span class="label-text-alt text-error">{{ getFieldError('expiryDate') }}</span>
                </label>
              }
            </div>
          </div>

          <!-- Date Range Cross-Field Validation Error -->
          @if (hasDateRangeError()) {
            <div class="text-error text-sm mt-1" role="alert">
              Start Date must be before Expiry Date.
            </div>
          }

          <!-- Linked Entities Section -->
          <div class="divider text-sm text-gray-500">Linked Entities (Optional)</div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Legal Case ID Field -->
            <div class="form-control w-full">
              <label class="label" for="legalCaseId">
                <span class="label-text font-medium">Legal Case ID</span>
              </label>
              <input
                id="legalCaseId"
                type="text"
                formControlName="legalCaseId"
                class="input input-bordered w-full"
                placeholder="e.g., 3fa85f64-5717-4562-b3fc-2c963f66afa6"
                (blur)="markTouched('legalCaseId')"
                aria-describedby="legalCaseId-help"
              />
              <label class="label" id="legalCaseId-help">
                <span class="label-text-alt text-gray-500">
                  Optionally link this policy to a legal case.
                </span>
              </label>
            </div>

            <!-- Opportunity ID Field -->
            <div class="form-control w-full">
              <label class="label" for="opportunityId">
                <span class="label-text font-medium">Opportunity ID</span>
              </label>
              <input
                id="opportunityId"
                type="text"
                formControlName="opportunityId"
                class="input input-bordered w-full"
                placeholder="e.g., 3fa85f64-5717-4562-b3fc-2c963f66afa6"
                (blur)="markTouched('opportunityId')"
                aria-describedby="opportunityId-help"
              />
              <label class="label" id="opportunityId-help">
                <span class="label-text-alt text-gray-500">
                  Optionally link this policy to a land opportunity.
                </span>
              </label>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="card-actions justify-end pt-4 border-t border-base-200">
            <a routerLink="/legal-compliance/insurance" class="btn btn-ghost">
              Cancel
            </a>
            <button
              type="submit"
              class="btn btn-primary"
              [disabled]="(form.invalid && submitted) || (loading$ | async)"
            >
              @if (loading$ | async) {
                <span class="loading loading-spinner loading-sm"></span>
                {{ isEditMode ? 'Saving...' : 'Creating...' }}
              } @else {
                {{ isEditMode ? 'Save Changes' : 'Create Insurance Record' }}
              }
            </button>
          </div>

        </div>
      </form>
    </div>
  `
})
export class InsuranceCreateComponent implements OnInit, HasUnsavedChanges {
  private readonly fb = inject(FormBuilder);
  private readonly store = inject(Store);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly actions$ = inject(Actions);
  private readonly destroyRef = inject(DestroyRef);

  /** Whether form has been submitted (triggers showing all validation errors). */
  submitted = false;

  /** Whether the form was saved successfully (disables unsaved changes guard). */
  private saved = false;

  /** Edit mode flag — true when editing an existing insurance record. */
  isEditMode = false;

  /** The insurance record ID when in edit mode. */
  private recordId: string | null = null;

  /** Loading state from the store. */
  readonly loading$ = this.store.select(selectInsuranceLoading);

  /** Server error from the store. */
  readonly serverError$ = this.store.select(selectInsuranceError);

  /** Available coverage type options with user-friendly labels. */
  readonly coverageTypes: readonly { value: CoverageType; label: string }[] = [
    { value: CoverageType.ProfessionalIndemnity, label: 'Professional Indemnity' },
    { value: CoverageType.PublicLiability, label: 'Public Liability' },
    { value: CoverageType.EmployersLiability, label: 'Employers Liability' },
    { value: CoverageType.BuildingInsurance, label: 'Building Insurance' },
    { value: CoverageType.TitleInsurance, label: 'Title Insurance' },
    { value: CoverageType.ContractorsAllRisk, label: 'Contractors All Risk' },
    { value: CoverageType.LegalExpenses, label: 'Legal Expenses' }
  ];

  /** Typed reactive form for insurance record creation/edit. */
  readonly form: FormGroup<IInsuranceForm> = this.fb.group<IInsuranceForm>(
    {
      policyNumber: this.fb.control('', {
        nonNullable: true,
        validators: [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(50)
        ]
      }),
      insurer: this.fb.control('', {
        nonNullable: true,
        validators: [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(200)
        ]
      }),
      coverageType: this.fb.control('' as CoverageType | '', {
        nonNullable: true,
        validators: [Validators.required]
      }),
      coverAmount: this.fb.control<number | null>(null, {
        validators: [
          Validators.required,
          positiveNumberValidator
        ]
      }),
      premium: this.fb.control<number | null>(null, {
        validators: [
          Validators.required,
          positiveNumberValidator
        ]
      }),
      currency: this.fb.control('GBP', {
        nonNullable: true,
        validators: [
          Validators.required,
          currencyCodeValidator
        ]
      }),
      startDate: this.fb.control('', {
        nonNullable: true,
        validators: [Validators.required]
      }),
      expiryDate: this.fb.control('', {
        nonNullable: true,
        validators: [Validators.required]
      }),
      legalCaseId: this.fb.control('', {
        nonNullable: true
      }),
      opportunityId: this.fb.control('', {
        nonNullable: true
      })
    },
    { validators: [dateRangeValidator] }
  );

  ngOnInit(): void {
    // Determine if we are in edit mode from route params
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.recordId = id;
      this.loadExistingRecord(id);
    }

    // Pre-populate legalCaseId from query params (when navigating from case detail)
    const caseId = this.route.snapshot.queryParamMap.get('legalCaseId');
    if (caseId && !this.isEditMode) {
      this.form.patchValue({ legalCaseId: caseId });
    }

    // Pre-populate opportunityId from query params
    const oppId = this.route.snapshot.queryParamMap.get('opportunityId');
    if (oppId && !this.isEditMode) {
      this.form.patchValue({ opportunityId: oppId });
    }

    // Listen for successful creation to navigate to insurance list
    this.actions$
      .pipe(
        ofType(InsuranceActions.createInsuranceRecordSuccess),
        take(1),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        this.saved = true;
        this.router.navigate(['/legal-compliance/insurance']);
      });

    // Listen for successful update to navigate back
    this.actions$
      .pipe(
        ofType(InsuranceActions.updateInsuranceRecordSuccess),
        take(1),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        this.saved = true;
        this.router.navigate(['/legal-compliance/insurance']);
      });

    // Listen for server errors and map to form fields
    this.actions$
      .pipe(
        ofType(InsuranceActions.createInsuranceRecordFailure, InsuranceActions.updateInsuranceRecordFailure),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(({ error }: { error: string }) => {
        this.mapServerErrorsToForm(error);
      });
  }

  /**
   * Whether the component has unsaved form changes.
   * Used by the unsaved changes guard (canDeactivate).
   */
  hasUnsavedChanges(): boolean {
    if (this.saved) {
      return false;
    }
    return this.form.dirty;
  }

  /**
   * Submit the form — dispatch CreateInsuranceRecord or UpdateInsuranceRecord action.
   */
  onSubmit(): void {
    this.submitted = true;
    this.form.markAllAsTouched();

    if (this.form.invalid) {
      return;
    }

    const formValue = this.form.getRawValue();

    if (this.isEditMode && this.recordId) {
      const changes: IUpdateInsuranceRecord = {
        insurer: formValue.insurer.trim(),
        coverAmount: formValue.coverAmount!,
        premium: formValue.premium!,
        currency: formValue.currency.trim().toUpperCase(),
        startDate: formValue.startDate,
        expiryDate: formValue.expiryDate
      };

      this.store.dispatch(InsuranceActions.updateInsuranceRecord({ id: this.recordId, changes }));
    } else {
      const payload: ICreateInsuranceRecord = {
        policyNumber: formValue.policyNumber.trim(),
        insurer: formValue.insurer.trim(),
        coverageType: formValue.coverageType as CoverageType,
        coverAmount: formValue.coverAmount!,
        premium: formValue.premium!,
        currency: formValue.currency.trim().toUpperCase(),
        startDate: formValue.startDate,
        expiryDate: formValue.expiryDate,
        legalCaseId: formValue.legalCaseId.trim() || null,
        opportunityId: formValue.opportunityId.trim() || null
      };

      this.store.dispatch(InsuranceActions.createInsuranceRecord({ record: payload }));
    }
  }

  /**
   * Check if a specific form field should display its validation error.
   * Shows error when field is touched or the form has been submitted.
   */
  isFieldInvalid(fieldName: keyof IInsuranceForm): boolean {
    const control = this.form.get(fieldName);
    return !!(control && control.invalid && (control.touched || this.submitted));
  }

  /**
   * Whether the cross-field date range validator has produced an error.
   */
  hasDateRangeError(): boolean {
    const startTouched = this.form.get('startDate')?.touched ?? false;
    const expiryTouched = this.form.get('expiryDate')?.touched ?? false;
    return !!(this.form.errors?.['dateRange'] && (startTouched || expiryTouched || this.submitted));
  }

  /**
   * Mark a field as touched (used on blur to trigger inline validation).
   */
  markTouched(fieldName: keyof IInsuranceForm): void {
    const control = this.form.get(fieldName);
    control?.markAsTouched();
  }

  /**
   * Get the user-friendly error message for a field.
   */
  getFieldError(fieldName: keyof IInsuranceForm): string {
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
    if (errors['positiveNumber']) {
      return 'Must be a positive amount.';
    }
    if (errors['invalidCurrency']) {
      return 'Please enter a valid 3-letter ISO 4217 currency code (e.g., GBP, EUR, USD).';
    }
    if (errors['serverError']) {
      return errors['serverError'] as string;
    }

    return 'Invalid value.';
  }

  /**
   * Load existing insurance record data for edit mode.
   */
  private loadExistingRecord(id: string): void {
    this.store
      .select(selectInsuranceRecordById(id))
      .pipe(
        filter((record: IInsuranceRecordListItem | undefined): record is IInsuranceRecordListItem => record !== undefined),
        take(1),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((record: IInsuranceRecordListItem) => {
        this.form.patchValue({
          policyNumber: record.policyNumber,
          insurer: record.insurer,
          coverageType: record.coverageType,
          coverAmount: record.coverAmount,
          premium: record.premium,
          currency: record.currency,
          startDate: record.startDate.substring(0, 10),
          expiryDate: record.expiryDate.substring(0, 10),
          legalCaseId: record.legalCaseId ?? ''
        });
        // Mark form as pristine after patching to avoid false unsaved changes
        this.form.markAsPristine();
      });
  }

  /**
   * Map server-side errors to form field errors for inline display.
   */
  private mapServerErrorsToForm(error: string): void {
    const lowerError = error.toLowerCase();

    if (lowerError.includes('policy number') || lowerError.includes('policynumber')) {
      this.form.get('policyNumber')?.setErrors({ serverError: error });
    } else if (lowerError.includes('insurer')) {
      this.form.get('insurer')?.setErrors({ serverError: error });
    } else if (lowerError.includes('coverage type') || lowerError.includes('coveragetype')) {
      this.form.get('coverageType')?.setErrors({ serverError: error });
    } else if (lowerError.includes('cover amount') || lowerError.includes('coveramount')) {
      this.form.get('coverAmount')?.setErrors({ serverError: error });
    } else if (lowerError.includes('premium')) {
      this.form.get('premium')?.setErrors({ serverError: error });
    } else if (lowerError.includes('currency')) {
      this.form.get('currency')?.setErrors({ serverError: error });
    } else if (lowerError.includes('start date') || lowerError.includes('startdate')) {
      this.form.get('startDate')?.setErrors({ serverError: error });
    } else if (lowerError.includes('expiry') || lowerError.includes('expirydate')) {
      this.form.get('expiryDate')?.setErrors({ serverError: error });
    } else if (lowerError.includes('legal case') || lowerError.includes('legalcaseid')) {
      this.form.get('legalCaseId')?.setErrors({ serverError: 'The referenced legal case does not exist or is not in a valid status.' });
    } else if (lowerError.includes('opportunity') || lowerError.includes('opportunityid')) {
      this.form.get('opportunityId')?.setErrors({ serverError: 'The referenced opportunity does not exist.' });
    }
  }

  /**
   * Get a user-friendly required message by field name.
   */
  private getRequiredMessage(fieldName: keyof IInsuranceForm): string {
    const messages: Record<keyof IInsuranceForm, string> = {
      policyNumber: 'Please enter the policy number.',
      insurer: 'Please enter the insurer name.',
      coverageType: 'Please select a coverage type.',
      coverAmount: 'Please enter the cover amount.',
      premium: 'Please enter the premium amount.',
      currency: 'Please enter a currency code.',
      startDate: 'Please select a start date.',
      expiryDate: 'Please select an expiry date.',
      legalCaseId: 'Please enter the linked legal case ID.',
      opportunityId: 'Please enter the linked opportunity ID.'
    };
    return messages[fieldName];
  }
}
