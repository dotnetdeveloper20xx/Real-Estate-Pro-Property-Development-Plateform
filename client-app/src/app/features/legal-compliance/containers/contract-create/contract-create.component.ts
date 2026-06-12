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

import { ContractActions } from '../../store/contracts/contracts.actions';
import {
  selectContractsLoading,
  selectContractsError,
  selectContractById
} from '../../store/contracts/contracts.selectors';
import {
  ICreateContract,
  IUpdateContract,
  IContractListItem,
  LegalContractType
} from '../../models';
import { HasUnsavedChanges } from '../../guards/unsaved-changes.guard';

/**
 * Typed form interface for the Contract create/edit form.
 * Maps to the fields required by Requirements 3.1 and 16.1.
 */
export interface IContractForm {
  title: FormControl<string>;
  contractType: FormControl<LegalContractType | ''>;
  counterpartyName: FormControl<string>;
  contractValue: FormControl<number | null>;
  currency: FormControl<string>;
  startDate: FormControl<string>;
  endDate: FormControl<string>;
  legalCaseId: FormControl<string>;
}

/**
 * Custom validator: ensures startDate is before or equal to endDate.
 * Applied at form group level to cross-validate both date fields.
 */
function dateRangeValidator(group: AbstractControl): ValidationErrors | null {
  const startDate = group.get('startDate')?.value as string;
  const endDate = group.get('endDate')?.value as string;

  if (!startDate || !endDate) {
    return null;
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (start > end) {
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
 * Contract Create/Edit container component.
 *
 * Supports both creation and editing of contracts through a single
 * reactive form with typed FormGroup. When an `id` route parameter is
 * present, the component operates in edit mode and pre-populates the form.
 *
 * Features:
 * - Typed FormGroup with ContractType, CounterpartyName, ContractValue, Currency, StartDate, EndDate, LegalCaseId
 * - Inline validation error messages on blur/submit (Requirement 16.2)
 * - Submit button disabled until form passes client-side validation (Requirement 16.3)
 * - Server-side error mapping to form fields (Requirement 16.4)
 * - Unsaved changes detection with canDeactivate guard (Requirement 16.5)
 * - Helper text on complex form fields (Requirement 16.6)
 * - Dispatches CreateContract on submit (Requirement 3.1)
 */
@Component({
  selector: 'app-contract-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-6 max-w-3xl mx-auto">
      <!-- Page Header -->
      <div class="mb-6">
        <div class="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <a routerLink="/legal-compliance" class="hover:text-primary">Legal & Compliance</a>
          <span>/</span>
          <a routerLink="/legal-compliance/contracts" class="hover:text-primary">Contracts</a>
          <span>/</span>
          <span>{{ isEditMode ? 'Edit Contract' : 'Create Contract' }}</span>
        </div>
        <h1 class="text-2xl font-semibold text-gray-900">
          {{ isEditMode ? 'Edit Contract' : 'Create New Contract' }}
        </h1>
        <p class="mt-1 text-sm text-gray-600">
          {{ isEditMode
            ? 'Update the contract details below. All changes are tracked in the audit trail.'
            : 'Create a new contract linked to a legal case. Complete the required fields below to register the agreement.'
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

          <!-- Title Field -->
          <div class="form-control w-full">
            <label class="label" for="title">
              <span class="label-text font-medium">Contract Title <span class="text-error">*</span></span>
            </label>
            <input
              id="title"
              type="text"
              formControlName="title"
              class="input input-bordered w-full"
              [class.input-error]="isFieldInvalid('title')"
              placeholder="e.g., Land Purchase Agreement — Oaklands Road"
              (blur)="markTouched('title')"
              aria-describedby="title-help title-error"
            />
            <label class="label" id="title-help">
              <span class="label-text-alt text-gray-500">A descriptive title for the contract (5–300 characters)</span>
            </label>
            @if (isFieldInvalid('title')) {
              <label class="label" id="title-error" role="alert">
                <span class="label-text-alt text-error">{{ getFieldError('title') }}</span>
              </label>
            }
          </div>

          <!-- Contract Type and Counterparty Row -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Contract Type Field -->
            <div class="form-control w-full">
              <label class="label" for="contractType">
                <span class="label-text font-medium">Contract Type <span class="text-error">*</span></span>
              </label>
              <select
                id="contractType"
                formControlName="contractType"
                class="select select-bordered w-full"
                [class.select-error]="isFieldInvalid('contractType')"
                (blur)="markTouched('contractType')"
                aria-describedby="contractType-help contractType-error"
              >
                <option value="" disabled>Select a contract type</option>
                @for (type of contractTypes; track type.value) {
                  <option [value]="type.value">{{ type.label }}</option>
                }
              </select>
              <label class="label" id="contractType-help">
                <span class="label-text-alt text-gray-500">
                  Land Purchase: property acquisition. Construction: building works. Professional Services: consultants.
                  Insurance: cover policies. Lease: tenancy agreements. Settlement: dispute resolution. Framework Agreement: multi-project terms.
                </span>
              </label>
              @if (isFieldInvalid('contractType')) {
                <label class="label" id="contractType-error" role="alert">
                  <span class="label-text-alt text-error">{{ getFieldError('contractType') }}</span>
                </label>
              }
            </div>

            <!-- Counterparty Name Field -->
            <div class="form-control w-full">
              <label class="label" for="counterpartyName">
                <span class="label-text font-medium">Counterparty Name <span class="text-error">*</span></span>
              </label>
              <input
                id="counterpartyName"
                type="text"
                formControlName="counterpartyName"
                class="input input-bordered w-full"
                [class.input-error]="isFieldInvalid('counterpartyName')"
                placeholder="e.g., Barratt Developments PLC"
                (blur)="markTouched('counterpartyName')"
                aria-describedby="counterpartyName-help counterpartyName-error"
              />
              <label class="label" id="counterpartyName-help">
                <span class="label-text-alt text-gray-500">The other party to this contract (2–200 characters)</span>
              </label>
              @if (isFieldInvalid('counterpartyName')) {
                <label class="label" id="counterpartyName-error" role="alert">
                  <span class="label-text-alt text-error">{{ getFieldError('counterpartyName') }}</span>
                </label>
              }
            </div>
          </div>

          <!-- Contract Value and Currency Row -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Contract Value Field -->
            <div class="form-control w-full">
              <label class="label" for="contractValue">
                <span class="label-text font-medium">Contract Value <span class="text-error">*</span></span>
              </label>
              <input
                id="contractValue"
                type="number"
                formControlName="contractValue"
                class="input input-bordered w-full"
                [class.input-error]="isFieldInvalid('contractValue')"
                placeholder="e.g., 150000.00"
                step="0.01"
                min="0.01"
                (blur)="markTouched('contractValue')"
                aria-describedby="contractValue-help contractValue-error"
              />
              <label class="label" id="contractValue-help">
                <span class="label-text-alt text-gray-500">
                  Total value of the contract in the specified currency. Must be a positive amount.
                  Contracts exceeding £50,000 require Finance Director approval.
                </span>
              </label>
              @if (isFieldInvalid('contractValue')) {
                <label class="label" id="contractValue-error" role="alert">
                  <span class="label-text-alt text-error">{{ getFieldError('contractValue') }}</span>
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
                <span class="label-text-alt text-gray-500">
                  ISO 4217 three-letter currency code (e.g., GBP, EUR, USD)
                </span>
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
                <span class="label-text-alt text-gray-500">The date this contract takes effect</span>
              </label>
              @if (isFieldInvalid('startDate')) {
                <label class="label" id="startDate-error" role="alert">
                  <span class="label-text-alt text-error">{{ getFieldError('startDate') }}</span>
                </label>
              }
            </div>

            <!-- End Date Field -->
            <div class="form-control w-full">
              <label class="label" for="endDate">
                <span class="label-text font-medium">End Date <span class="text-error">*</span></span>
              </label>
              <input
                id="endDate"
                type="date"
                formControlName="endDate"
                class="input input-bordered w-full"
                [class.input-error]="isFieldInvalid('endDate') || hasDateRangeError()"
                (blur)="markTouched('endDate')"
                aria-describedby="endDate-help endDate-error"
              />
              <label class="label" id="endDate-help">
                <span class="label-text-alt text-gray-500">The date this contract expires or is due for renewal</span>
              </label>
              @if (isFieldInvalid('endDate')) {
                <label class="label" id="endDate-error" role="alert">
                  <span class="label-text-alt text-error">{{ getFieldError('endDate') }}</span>
                </label>
              }
            </div>
          </div>

          <!-- Date Range Cross-Field Validation Error -->
          @if (hasDateRangeError()) {
            <div class="text-error text-sm mt-1" role="alert">
              Start Date must be before or equal to End Date.
            </div>
          }

          <!-- Legal Case ID Section -->
          <div class="divider text-sm text-gray-500">Linked Legal Case</div>

          <div class="form-control w-full">
            <label class="label" for="legalCaseId">
              <span class="label-text font-medium">Legal Case ID <span class="text-error">*</span></span>
            </label>
            <input
              id="legalCaseId"
              type="text"
              formControlName="legalCaseId"
              class="input input-bordered w-full"
              [class.input-error]="isFieldInvalid('legalCaseId')"
              placeholder="e.g., 3fa85f64-5717-4562-b3fc-2c963f66afa6"
              (blur)="markTouched('legalCaseId')"
              aria-describedby="legalCaseId-help legalCaseId-error"
            />
            <label class="label" id="legalCaseId-help">
              <span class="label-text-alt text-gray-500">
                Every contract must be linked to an existing legal case (Open, In Progress, or Under Review).
                Enter the Case ID from the Legal Cases list.
              </span>
            </label>
            @if (isFieldInvalid('legalCaseId')) {
              <label class="label" id="legalCaseId-error" role="alert">
                <span class="label-text-alt text-error">{{ getFieldError('legalCaseId') }}</span>
              </label>
            }
          </div>

          <!-- Action Buttons -->
          <div class="card-actions justify-end pt-4 border-t border-base-200">
            <a routerLink="/legal-compliance/contracts" class="btn btn-ghost">
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
                {{ isEditMode ? 'Save Changes' : 'Create Contract' }}
              }
            </button>
          </div>

        </div>
      </form>
    </div>
  `
})
export class ContractCreateComponent implements OnInit, HasUnsavedChanges {
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

  /** Edit mode flag — true when editing an existing contract. */
  isEditMode = false;

  /** The contract ID when in edit mode. */
  private contractId: string | null = null;

  /** Loading state from the store. */
  readonly loading$ = this.store.select(selectContractsLoading);

  /** Server error from the store. */
  readonly serverError$ = this.store.select(selectContractsError);

  /** Available contract type options with user-friendly labels. */
  readonly contractTypes: readonly { value: LegalContractType; label: string }[] = [
    { value: LegalContractType.LandPurchase, label: 'Land Purchase' },
    { value: LegalContractType.Construction, label: 'Construction' },
    { value: LegalContractType.ProfessionalServices, label: 'Professional Services' },
    { value: LegalContractType.Insurance, label: 'Insurance' },
    { value: LegalContractType.Lease, label: 'Lease' },
    { value: LegalContractType.Settlement, label: 'Settlement' },
    { value: LegalContractType.FrameworkAgreement, label: 'Framework Agreement' }
  ];

  /** Typed reactive form for contract creation/edit. */
  readonly form: FormGroup<IContractForm> = this.fb.group<IContractForm>(
    {
      title: this.fb.control('', {
        nonNullable: true,
        validators: [
          Validators.required,
          Validators.minLength(5),
          Validators.maxLength(300)
        ]
      }),
      contractType: this.fb.control('' as LegalContractType | '', {
        nonNullable: true,
        validators: [Validators.required]
      }),
      counterpartyName: this.fb.control('', {
        nonNullable: true,
        validators: [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(200)
        ]
      }),
      contractValue: this.fb.control<number | null>(null, {
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
      endDate: this.fb.control('', {
        nonNullable: true,
        validators: [Validators.required]
      }),
      legalCaseId: this.fb.control('', {
        nonNullable: true,
        validators: [Validators.required]
      })
    },
    { validators: [dateRangeValidator] }
  );

  ngOnInit(): void {
    // Determine if we are in edit mode from route params
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.contractId = id;
      this.loadExistingContract(id);
    }

    // Pre-populate legalCaseId from query params (when navigating from case detail)
    const caseId = this.route.snapshot.queryParamMap.get('legalCaseId');
    if (caseId && !this.isEditMode) {
      this.form.patchValue({ legalCaseId: caseId });
    }

    // Listen for successful creation to navigate to contracts list
    this.actions$
      .pipe(
        ofType(ContractActions.createContractSuccess),
        take(1),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        this.saved = true;
        this.router.navigate(['/legal-compliance/contracts']);
      });

    // Listen for successful update to navigate back
    this.actions$
      .pipe(
        ofType(ContractActions.updateContractSuccess),
        take(1),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        this.saved = true;
        this.router.navigate(['/legal-compliance/contracts']);
      });

    // Listen for server errors and map to form fields
    this.actions$
      .pipe(
        ofType(ContractActions.createContractFailure, ContractActions.updateContractFailure),
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
   * Submit the form — dispatch CreateContract or UpdateContract action.
   */
  onSubmit(): void {
    this.submitted = true;
    this.form.markAllAsTouched();

    if (this.form.invalid) {
      return;
    }

    const formValue = this.form.getRawValue();

    if (this.isEditMode && this.contractId) {
      const changes: IUpdateContract = {
        title: formValue.title.trim(),
        counterpartyName: formValue.counterpartyName.trim(),
        contractValue: formValue.contractValue!,
        currency: formValue.currency.trim().toUpperCase(),
        startDate: formValue.startDate,
        endDate: formValue.endDate
      };

      this.store.dispatch(ContractActions.updateContract({ id: this.contractId, changes }));
    } else {
      const payload: ICreateContract = {
        title: formValue.title.trim(),
        contractType: formValue.contractType as LegalContractType,
        counterpartyName: formValue.counterpartyName.trim(),
        contractValue: formValue.contractValue!,
        currency: formValue.currency.trim().toUpperCase(),
        startDate: formValue.startDate,
        endDate: formValue.endDate,
        legalCaseId: formValue.legalCaseId.trim()
      };

      this.store.dispatch(ContractActions.createContract({ contract: payload }));
    }
  }

  /**
   * Check if a specific form field should display its validation error.
   * Shows error when field is touched or the form has been submitted.
   */
  isFieldInvalid(fieldName: keyof IContractForm): boolean {
    const control = this.form.get(fieldName);
    return !!(control && control.invalid && (control.touched || this.submitted));
  }

  /**
   * Whether the cross-field date range validator has produced an error.
   */
  hasDateRangeError(): boolean {
    const startTouched = this.form.get('startDate')?.touched ?? false;
    const endTouched = this.form.get('endDate')?.touched ?? false;
    return !!(this.form.errors?.['dateRange'] && (startTouched || endTouched || this.submitted));
  }

  /**
   * Mark a field as touched (used on blur to trigger inline validation).
   */
  markTouched(fieldName: keyof IContractForm): void {
    const control = this.form.get(fieldName);
    control?.markAsTouched();
  }

  /**
   * Get the user-friendly error message for a field.
   */
  getFieldError(fieldName: keyof IContractForm): string {
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
      return 'Contract value must be a positive amount.';
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
   * Load existing contract data for edit mode.
   */
  private loadExistingContract(id: string): void {
    this.store
      .select(selectContractById(id))
      .pipe(
        filter((contract: IContractListItem | undefined): contract is IContractListItem => contract !== undefined),
        take(1),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((contract: IContractListItem) => {
        this.form.patchValue({
          title: contract.title,
          contractType: contract.contractType,
          counterpartyName: contract.counterpartyName,
          contractValue: contract.contractValue,
          currency: contract.currency,
          startDate: contract.startDate.substring(0, 10),
          endDate: contract.endDate.substring(0, 10),
          legalCaseId: contract.legalCaseId
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

    if (lowerError.includes('title')) {
      this.form.get('title')?.setErrors({ serverError: error });
    } else if (lowerError.includes('contract type') || lowerError.includes('contracttype')) {
      this.form.get('contractType')?.setErrors({ serverError: error });
    } else if (lowerError.includes('counterparty')) {
      this.form.get('counterpartyName')?.setErrors({ serverError: error });
    } else if (lowerError.includes('value') || lowerError.includes('contractvalue')) {
      this.form.get('contractValue')?.setErrors({ serverError: error });
    } else if (lowerError.includes('currency')) {
      this.form.get('currency')?.setErrors({ serverError: error });
    } else if (lowerError.includes('start date') || lowerError.includes('startdate')) {
      this.form.get('startDate')?.setErrors({ serverError: error });
    } else if (lowerError.includes('end date') || lowerError.includes('enddate')) {
      this.form.get('endDate')?.setErrors({ serverError: error });
    } else if (lowerError.includes('legal case') || lowerError.includes('legalcaseid')) {
      this.form.get('legalCaseId')?.setErrors({ serverError: 'The referenced legal case does not exist or is not in a valid status.' });
    }
  }

  /**
   * Get a user-friendly required message by field name.
   */
  private getRequiredMessage(fieldName: keyof IContractForm): string {
    const messages: Record<keyof IContractForm, string> = {
      title: 'Please enter a contract title.',
      contractType: 'Please select a contract type.',
      counterpartyName: 'Please enter the counterparty name.',
      contractValue: 'Please enter the contract value.',
      currency: 'Please enter a currency code.',
      startDate: 'Please select a start date.',
      endDate: 'Please select an end date.',
      legalCaseId: 'Please enter the linked legal case ID.'
    };
    return messages[fieldName];
  }
}
