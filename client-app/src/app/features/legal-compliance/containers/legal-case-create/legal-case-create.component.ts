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
  Validators
} from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Actions, ofType } from '@ngrx/effects';
import { take, filter } from 'rxjs/operators';

import { LegalCasesActions } from '../../store/legal-cases/legal-cases.actions';
import {
  selectLegalCasesLoading,
  selectLegalCasesError,
  selectLegalCaseById
} from '../../store/legal-cases/legal-cases.selectors';
import {
  ICreateLegalCase,
  IUpdateLegalCase,
  ILegalCaseListItem,
  LegalCaseType,
  LegalCasePriority
} from '../../models';
import { HasUnsavedChanges } from '../../guards/unsaved-changes.guard';

/**
 * Typed form interface for the Legal Case create/edit form.
 * Maps directly to the form fields required by Requirements 1.1 and 16.1.
 */
export interface ILegalCaseForm {
  title: FormControl<string>;
  description: FormControl<string>;
  caseType: FormControl<LegalCaseType>;
  priority: FormControl<LegalCasePriority>;
  opportunityId: FormControl<string>;
  planningApplicationId: FormControl<string>;
}

/**
 * Legal Case Create/Edit container component.
 *
 * Supports both creation and editing of legal cases through a single
 * reactive form with typed FormGroup. When an `id` route parameter is
 * present, the component operates in edit mode and pre-populates the form.
 *
 * Features:
 * - Typed FormGroup with Title, Description, CaseType, Priority, OpportunityId, PlanningApplicationId
 * - Inline validation error messages on blur/submit (Requirement 16.2)
 * - Submit button disabled until form passes client-side validation (Requirement 16.3)
 * - Server-side error mapping to form fields (Requirement 16.4)
 * - Unsaved changes detection with canDeactivate guard (Requirement 16.5)
 * - Helper text on complex form fields (Requirement 16.6)
 * - Dispatches CreateLegalCase or UpdateLegalCase action on submit
 */
@Component({
  selector: 'app-legal-case-create',
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
          <a routerLink="/legal-compliance/cases" class="hover:text-primary">Cases</a>
          <span>/</span>
          <span>{{ isEditMode ? 'Edit Case' : 'Create Case' }}</span>
        </div>
        <h1 class="text-2xl font-semibold text-gray-900">
          {{ isEditMode ? 'Edit Legal Case' : 'Create New Legal Case' }}
        </h1>
        <p class="mt-1 text-sm text-gray-600">
          {{ isEditMode
            ? 'Update the legal case details below. All changes are tracked in the audit trail.'
            : 'Open a new legal case linked to a land opportunity or planning application. Complete the required fields below.'
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
              <span class="label-text font-medium">Case Title <span class="text-error">*</span></span>
            </label>
            <input
              id="title"
              type="text"
              formControlName="title"
              class="input input-bordered w-full"
              [class.input-error]="isFieldInvalid('title')"
              placeholder="e.g., Conveyancing — Oaklands Road Site Acquisition"
              (blur)="markTouched('title')"
              aria-describedby="title-help title-error"
            />
            <label class="label" id="title-help">
              <span class="label-text-alt text-gray-500">A clear, descriptive title for this legal case (5–200 characters)</span>
            </label>
            @if (isFieldInvalid('title')) {
              <label class="label" id="title-error" role="alert">
                <span class="label-text-alt text-error">{{ getFieldError('title') }}</span>
              </label>
            }
          </div>

          <!-- Description Field -->
          <div class="form-control w-full">
            <label class="label" for="description">
              <span class="label-text font-medium">Description <span class="text-error">*</span></span>
            </label>
            <textarea
              id="description"
              formControlName="description"
              class="textarea textarea-bordered w-full"
              [class.textarea-error]="isFieldInvalid('description')"
              placeholder="Describe the nature of this legal case, key parties involved, and initial scope of work..."
              rows="4"
              (blur)="markTouched('description')"
              aria-describedby="description-help description-error"
            ></textarea>
            <label class="label" id="description-help">
              <span class="label-text-alt text-gray-500">Provide context on the legal matter, scope, and relevant background (10–2000 characters)</span>
            </label>
            @if (isFieldInvalid('description')) {
              <label class="label" id="description-error" role="alert">
                <span class="label-text-alt text-error">{{ getFieldError('description') }}</span>
              </label>
            }
          </div>

          <!-- Case Type and Priority Row -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Case Type Field -->
            <div class="form-control w-full">
              <label class="label" for="caseType">
                <span class="label-text font-medium">Case Type <span class="text-error">*</span></span>
              </label>
              <select
                id="caseType"
                formControlName="caseType"
                class="select select-bordered w-full"
                [class.select-error]="isFieldInvalid('caseType')"
                (blur)="markTouched('caseType')"
                aria-describedby="caseType-help caseType-error"
              >
                <option value="" disabled>Select a case type</option>
                @for (type of caseTypes; track type.value) {
                  <option [value]="type.value">{{ type.label }}</option>
                }
              </select>
              <label class="label" id="caseType-help">
                <span class="label-text-alt text-gray-500">
                  Conveyancing: property transfers. Dispute: legal conflicts. Contract Review: agreement assessments.
                  Regulatory: compliance matters. Planning: permission issues. General: other legal matters.
                </span>
              </label>
              @if (isFieldInvalid('caseType')) {
                <label class="label" id="caseType-error" role="alert">
                  <span class="label-text-alt text-error">{{ getFieldError('caseType') }}</span>
                </label>
              }
            </div>

            <!-- Priority Field -->
            <div class="form-control w-full">
              <label class="label" for="priority">
                <span class="label-text font-medium">Priority <span class="text-error">*</span></span>
              </label>
              <select
                id="priority"
                formControlName="priority"
                class="select select-bordered w-full"
                [class.select-error]="isFieldInvalid('priority')"
                (blur)="markTouched('priority')"
                aria-describedby="priority-help priority-error"
              >
                <option value="" disabled>Select priority level</option>
                @for (p of priorities; track p.value) {
                  <option [value]="p.value">{{ p.label }}</option>
                }
              </select>
              <label class="label" id="priority-help">
                <span class="label-text-alt text-gray-500">
                  Low: routine matters. Medium: standard timescales. High: requires prompt attention. Critical: urgent legal risk.
                </span>
              </label>
              @if (isFieldInvalid('priority')) {
                <label class="label" id="priority-error" role="alert">
                  <span class="label-text-alt text-error">{{ getFieldError('priority') }}</span>
                </label>
              }
            </div>
          </div>

          <!-- Cross-Module Linking Section -->
          <div class="divider text-sm text-gray-500">Cross-Module Links (Optional)</div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                aria-describedby="opportunityId-help opportunityId-error"
              />
              <label class="label" id="opportunityId-help">
                <span class="label-text-alt text-gray-500">
                  Link this case to a Land Acquisition opportunity. Enter the Opportunity ID from the Land Acquisition module.
                </span>
              </label>
              @if (isFieldInvalid('opportunityId')) {
                <label class="label" id="opportunityId-error" role="alert">
                  <span class="label-text-alt text-error">{{ getFieldError('opportunityId') }}</span>
                </label>
              }
            </div>

            <!-- Planning Application ID Field -->
            <div class="form-control w-full">
              <label class="label" for="planningApplicationId">
                <span class="label-text font-medium">Planning Application ID</span>
              </label>
              <input
                id="planningApplicationId"
                type="text"
                formControlName="planningApplicationId"
                class="input input-bordered w-full"
                placeholder="e.g., 3fa85f64-5717-4562-b3fc-2c963f66afa6"
                (blur)="markTouched('planningApplicationId')"
                aria-describedby="planningApplicationId-help planningApplicationId-error"
              />
              <label class="label" id="planningApplicationId-help">
                <span class="label-text-alt text-gray-500">
                  Link this case to a Planning Application. Enter the Application ID from the Planning & Approvals module.
                </span>
              </label>
              @if (isFieldInvalid('planningApplicationId')) {
                <label class="label" id="planningApplicationId-error" role="alert">
                  <span class="label-text-alt text-error">{{ getFieldError('planningApplicationId') }}</span>
                </label>
              }
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="card-actions justify-end pt-4 border-t border-base-200">
            <a routerLink="/legal-compliance/cases" class="btn btn-ghost">
              Cancel
            </a>
            <button
              type="submit"
              class="btn btn-primary"
              [disabled]="form.invalid || (loading$ | async)"
            >
              @if (loading$ | async) {
                <span class="loading loading-spinner loading-sm"></span>
                {{ isEditMode ? 'Saving...' : 'Creating...' }}
              } @else {
                {{ isEditMode ? 'Save Changes' : 'Create Legal Case' }}
              }
            </button>
          </div>

        </div>
      </form>
    </div>
  `
})
export class LegalCaseCreateComponent implements OnInit, HasUnsavedChanges {
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

  /** Edit mode flag — true when editing an existing case. */
  isEditMode = false;

  /** The legal case ID when in edit mode. */
  private caseId: string | null = null;

  /** Loading state from the store. */
  readonly loading$ = this.store.select(selectLegalCasesLoading);

  /** Server error from the store. */
  readonly serverError$ = this.store.select(selectLegalCasesError);

  /** Available case type options with user-friendly labels. */
  readonly caseTypes: readonly { value: LegalCaseType; label: string }[] = [
    { value: LegalCaseType.Conveyancing, label: 'Conveyancing' },
    { value: LegalCaseType.Dispute, label: 'Dispute' },
    { value: LegalCaseType.ContractReview, label: 'Contract Review' },
    { value: LegalCaseType.Regulatory, label: 'Regulatory' },
    { value: LegalCaseType.Planning, label: 'Planning' },
    { value: LegalCaseType.General, label: 'General' }
  ];

  /** Available priority options with user-friendly labels. */
  readonly priorities: readonly { value: LegalCasePriority; label: string }[] = [
    { value: LegalCasePriority.Low, label: 'Low' },
    { value: LegalCasePriority.Medium, label: 'Medium' },
    { value: LegalCasePriority.High, label: 'High' },
    { value: LegalCasePriority.Critical, label: 'Critical' }
  ];

  /** Typed reactive form for legal case creation/edit. */
  readonly form: FormGroup<ILegalCaseForm> = this.fb.group<ILegalCaseForm>({
    title: this.fb.control('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.minLength(5),
        Validators.maxLength(200)
      ]
    }),
    description: this.fb.control('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.minLength(10),
        Validators.maxLength(2000)
      ]
    }),
    caseType: this.fb.control('' as unknown as LegalCaseType, {
      nonNullable: true,
      validators: [Validators.required]
    }),
    priority: this.fb.control('' as unknown as LegalCasePriority, {
      nonNullable: true,
      validators: [Validators.required]
    }),
    opportunityId: this.fb.control('', {
      nonNullable: true
    }),
    planningApplicationId: this.fb.control('', {
      nonNullable: true
    })
  });

  ngOnInit(): void {
    // Determine if we are in edit mode from route params
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.caseId = id;
      this.loadExistingCase(id);
    }

    // Listen for successful creation to navigate to the cases list
    this.actions$
      .pipe(
        ofType(LegalCasesActions.createLegalCaseSuccess),
        take(1),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        this.saved = true;
        this.router.navigate(['/legal-compliance/cases']);
      });

    // Listen for successful update to navigate back
    this.actions$
      .pipe(
        ofType(LegalCasesActions.updateLegalCaseSuccess),
        take(1),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        this.saved = true;
        this.router.navigate(['/legal-compliance/cases']);
      });

    // Listen for server errors and map to form fields
    this.actions$
      .pipe(
        ofType(LegalCasesActions.createLegalCaseFailure, LegalCasesActions.updateLegalCaseFailure),
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
   * Submit the form — dispatch CreateLegalCase or UpdateLegalCase action.
   */
  onSubmit(): void {
    this.submitted = true;
    this.form.markAllAsTouched();

    if (this.form.invalid) {
      return;
    }

    const formValue = this.form.getRawValue();

    if (this.isEditMode && this.caseId) {
      const changes: IUpdateLegalCase = {
        title: formValue.title.trim(),
        description: formValue.description.trim(),
        priority: formValue.priority
      };

      this.store.dispatch(LegalCasesActions.updateLegalCase({ id: this.caseId, changes }));
    } else {
      const payload: ICreateLegalCase = {
        title: formValue.title.trim(),
        description: formValue.description.trim(),
        caseType: formValue.caseType,
        priority: formValue.priority,
        opportunityId: formValue.opportunityId.trim() || null,
        planningApplicationId: formValue.planningApplicationId.trim() || null
      };

      this.store.dispatch(LegalCasesActions.createLegalCase({ legalCase: payload }));
    }
  }

  /**
   * Check if a specific form field should display its validation error.
   * Shows error when field is touched or the form has been submitted.
   */
  isFieldInvalid(fieldName: keyof ILegalCaseForm): boolean {
    const control = this.form.get(fieldName);
    return !!(control && control.invalid && (control.touched || this.submitted));
  }

  /**
   * Mark a field as touched (used on blur to trigger inline validation).
   */
  markTouched(fieldName: keyof ILegalCaseForm): void {
    const control = this.form.get(fieldName);
    control?.markAsTouched();
  }

  /**
   * Get the user-friendly error message for a field.
   */
  getFieldError(fieldName: keyof ILegalCaseForm): string {
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
   * Load existing legal case data for edit mode.
   */
  private loadExistingCase(id: string): void {
    this.store
      .select(selectLegalCaseById(id))
      .pipe(
        filter((legalCase: ILegalCaseListItem | undefined): legalCase is ILegalCaseListItem => legalCase !== undefined),
        take(1),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((legalCase: ILegalCaseListItem) => {
        this.form.patchValue({
          title: legalCase.title,
          caseType: legalCase.caseType,
          priority: legalCase.priority,
          opportunityId: legalCase.opportunityId ?? '',
          planningApplicationId: legalCase.planningApplicationId ?? ''
        });
        // Mark form as pristine after patching to avoid false unsaved changes
        this.form.markAsPristine();
      });
  }

  /**
   * Map server-side errors to form field errors for inline display.
   * Attempts to match error messages to specific fields.
   */
  private mapServerErrorsToForm(error: string): void {
    const lowerError = error.toLowerCase();

    if (lowerError.includes('title')) {
      this.form.get('title')?.setErrors({ serverError: error });
    } else if (lowerError.includes('description')) {
      this.form.get('description')?.setErrors({ serverError: error });
    } else if (lowerError.includes('opportunity') || lowerError.includes('opportunityid')) {
      this.form.get('opportunityId')?.setErrors({ serverError: 'The referenced opportunity does not exist.' });
    } else if (lowerError.includes('planning') || lowerError.includes('planningapplicationid')) {
      this.form.get('planningApplicationId')?.setErrors({ serverError: 'The referenced planning application does not exist.' });
    } else if (lowerError.includes('case type') || lowerError.includes('casetype')) {
      this.form.get('caseType')?.setErrors({ serverError: error });
    } else if (lowerError.includes('priority')) {
      this.form.get('priority')?.setErrors({ serverError: error });
    }
  }

  /**
   * Get a user-friendly required message by field name.
   */
  private getRequiredMessage(fieldName: keyof ILegalCaseForm): string {
    const messages: Record<keyof ILegalCaseForm, string> = {
      title: 'Please enter a case title.',
      description: 'Please enter a case description.',
      caseType: 'Please select a case type.',
      priority: 'Please select a priority level.',
      opportunityId: 'Please enter an opportunity ID.',
      planningApplicationId: 'Please enter a planning application ID.'
    };
    return messages[fieldName];
  }
}
