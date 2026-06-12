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
import { Router, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Actions, ofType } from '@ngrx/effects';
import { take } from 'rxjs/operators';

import { ApplicationActions } from '../../store/application';
import {
  selectApplicationLoading,
  selectApplicationError
} from '../../store/application';
import {
  ICreateApplication,
  PlanningApplicationType
} from '../../models/planning-application.model';
import { HasUnsavedChanges } from '../../guards/unsaved-changes.guard';

/**
 * Typed form interface for the Planning Application create form.
 */
export interface IApplicationCreateForm {
  opportunityId: FormControl<string>;
  applicationType: FormControl<string>;
  description: FormControl<string>;
  councilName: FormControl<string>;
}

/**
 * ApplicationCreateContainer — smart container component for creating a new planning application.
 *
 * Features:
 * - Typed FormGroup with OpportunityId, ApplicationType, Description, CouncilName
 * - Inline validation error messages on blur/submit
 * - Disabled submit until form is valid
 * - Server-side error mapping to form fields
 * - Unsaved changes guard with confirmation dialog
 * - OnPush change detection for performance
 * - Helper text on complex fields to guide planning-specific terminology
 */
@Component({
  selector: 'app-application-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-6 max-w-3xl mx-auto">
      <!-- Page Header -->
      <div class="mb-6">
        <div class="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <a routerLink="/planning-approvals/pipeline" class="hover:text-primary">Pipeline</a>
          <span>/</span>
          <span>Create Application</span>
        </div>
        <h1 class="text-2xl font-semibold text-gray-900">Create Planning Application</h1>
        <p class="mt-1 text-sm text-gray-600">
          Initiate a new planning application linked to an acquired land opportunity.
          Complete the required fields below to add the application to the planning pipeline.
        </p>
      </div>

      <!-- Server Error Banner -->
      @if (serverError$ | async; as serverError) {
        <div class="alert alert-error mb-4" role="alert">
          <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-5 w-5" fill="none" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{{ serverError }}</span>
        </div>
      }

      <!-- Form -->
      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="card bg-base-100 shadow-sm" novalidate>
        <div class="card-body space-y-5">

          <!-- Opportunity ID Field -->
          <div class="form-control w-full">
            <label class="label" for="opportunityId">
              <span class="label-text font-medium">Land Opportunity ID <span class="text-error">*</span></span>
            </label>
            <input
              id="opportunityId"
              type="text"
              formControlName="opportunityId"
              class="input input-bordered w-full"
              [class.input-error]="isFieldInvalid('opportunityId')"
              placeholder="e.g., 3fa85f64-5717-4562-b3fc-2c963f66afa6"
              (blur)="markTouched('opportunityId')"
              aria-describedby="opportunityId-help opportunityId-error"
            />
            <label class="label" id="opportunityId-help">
              <span class="label-text-alt text-gray-500">
                The unique identifier of the acquired land opportunity. Only opportunities with Acquired status can have planning applications.
              </span>
            </label>
            @if (isFieldInvalid('opportunityId')) {
              <label class="label" id="opportunityId-error" role="alert">
                <span class="label-text-alt text-error">{{ getFieldError('opportunityId') }}</span>
              </label>
            }
          </div>

          <!-- Application Type Field -->
          <div class="form-control w-full">
            <label class="label" for="applicationType">
              <span class="label-text font-medium">Application Type <span class="text-error">*</span></span>
            </label>
            <select
              id="applicationType"
              formControlName="applicationType"
              class="select select-bordered w-full"
              [class.select-error]="isFieldInvalid('applicationType')"
              (blur)="markTouched('applicationType')"
              aria-describedby="applicationType-help applicationType-error"
            >
              <option value="" disabled>Select application type</option>
              @for (type of applicationTypes; track type.value) {
                <option [value]="type.value">{{ type.label }}</option>
              }
            </select>
            <label class="label" id="applicationType-help">
              <span class="label-text-alt text-gray-500">
                The type of planning permission being sought. Full applications include all details; Outline establishes principle of development.
              </span>
            </label>
            @if (isFieldInvalid('applicationType')) {
              <label class="label" id="applicationType-error" role="alert">
                <span class="label-text-alt text-error">{{ getFieldError('applicationType') }}</span>
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
              placeholder="e.g., Full planning application for construction of 24 residential dwellings with associated access, landscaping and infrastructure."
              rows="4"
              (blur)="markTouched('description')"
              aria-describedby="description-help description-error"
            ></textarea>
            <label class="label" id="description-help">
              <span class="label-text-alt text-gray-500">
                A clear description of the proposed development (10–2000 characters). Include the nature and scale of the development.
              </span>
            </label>
            @if (isFieldInvalid('description')) {
              <label class="label" id="description-error" role="alert">
                <span class="label-text-alt text-error">{{ getFieldError('description') }}</span>
              </label>
            }
          </div>

          <!-- Council Name Field -->
          <div class="form-control w-full">
            <label class="label" for="councilName">
              <span class="label-text font-medium">Council Name <span class="text-error">*</span></span>
            </label>
            <input
              id="councilName"
              type="text"
              formControlName="councilName"
              class="input input-bordered w-full"
              [class.input-error]="isFieldInvalid('councilName')"
              placeholder="e.g., Chelmsford City Council"
              (blur)="markTouched('councilName')"
              aria-describedby="councilName-help councilName-error"
            />
            <label class="label" id="councilName-help">
              <span class="label-text-alt text-gray-500">
                The local planning authority responsible for this application (3–200 characters).
              </span>
            </label>
            @if (isFieldInvalid('councilName')) {
              <label class="label" id="councilName-error" role="alert">
                <span class="label-text-alt text-error">{{ getFieldError('councilName') }}</span>
              </label>
            }
          </div>

          <!-- Action Buttons -->
          <div class="card-actions justify-end pt-4 border-t border-base-200">
            <a routerLink="/planning-approvals/pipeline" class="btn btn-ghost">
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
                Create Application
              }
            </button>
          </div>

        </div>
      </form>
    </div>
  `
})
export class ApplicationCreateContainer implements OnInit, HasUnsavedChanges {
  private readonly fb = inject(FormBuilder);
  private readonly store = inject(Store);
  private readonly router = inject(Router);
  private readonly actions$ = inject(Actions);
  private readonly destroyRef = inject(DestroyRef);

  /** Whether form has been submitted (to trigger showing all validation errors). */
  submitted = false;

  /** Whether the form was saved successfully (to disable unsaved changes guard). */
  private saved = false;

  /** Loading state from the store. */
  readonly loading$ = this.store.select(selectApplicationLoading);

  /** Server error from the store. */
  readonly serverError$ = this.store.select(selectApplicationError);

  /** Application type options for the dropdown. */
  readonly applicationTypes: readonly { value: string; label: string }[] = [
    { value: PlanningApplicationType.Full, label: 'Full Application' },
    { value: PlanningApplicationType.Outline, label: 'Outline Application' },
    { value: PlanningApplicationType.ReservedMatters, label: 'Reserved Matters' },
    { value: PlanningApplicationType.Householder, label: 'Householder' },
    { value: PlanningApplicationType.ListedBuilding, label: 'Listed Building' },
    { value: PlanningApplicationType.ChangeOfUse, label: 'Change of Use' }
  ];

  /** Typed reactive form for planning application creation. */
  readonly form: FormGroup<IApplicationCreateForm> = this.fb.group<IApplicationCreateForm>({
    opportunityId: this.fb.control('', {
      nonNullable: true,
      validators: [Validators.required]
    }),
    applicationType: this.fb.control('', {
      nonNullable: true,
      validators: [Validators.required]
    }),
    description: this.fb.control('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.minLength(10),
        Validators.maxLength(2000)
      ]
    }),
    councilName: this.fb.control('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(200)
      ]
    })
  });

  ngOnInit(): void {
    // Listen for successful creation to navigate to pipeline
    this.actions$
      .pipe(
        ofType(ApplicationActions.createApplicationSuccess),
        take(1),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        this.saved = true;
        this.router.navigate(['/planning-approvals/pipeline']);
      });

    // Listen for server errors and map to form fields if applicable
    this.actions$
      .pipe(
        ofType(ApplicationActions.createApplicationFailure),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(({ error }: { error: string }) => {
        this.mapServerErrorsToForm(error);
      });
  }

  /**
   * Whether the component has unsaved form changes.
   * Used by the unsaved changes guard.
   */
  hasUnsavedChanges(): boolean {
    if (this.saved) {
      return false;
    }
    return this.form.dirty;
  }

  /**
   * Submit the form — dispatch the createApplication action.
   */
  onSubmit(): void {
    this.submitted = true;
    this.form.markAllAsTouched();

    if (this.form.invalid) {
      return;
    }

    const formValue = this.form.getRawValue();

    const payload: ICreateApplication = {
      opportunityId: formValue.opportunityId.trim(),
      applicationType: formValue.applicationType,
      description: formValue.description.trim(),
      councilName: formValue.councilName.trim()
    };

    this.store.dispatch(ApplicationActions.createApplication({ application: payload }));
  }

  /**
   * Check if a specific form field should display its validation error.
   * Shows error when field is touched or the form has been submitted.
   */
  isFieldInvalid(fieldName: keyof IApplicationCreateForm): boolean {
    const control = this.form.get(fieldName);
    return !!(control && control.invalid && (control.touched || this.submitted));
  }

  /**
   * Mark a field as touched (used on blur to trigger inline validation).
   */
  markTouched(fieldName: keyof IApplicationCreateForm): void {
    const control = this.form.get(fieldName);
    control?.markAsTouched();
  }

  /**
   * Get the user-friendly error message for a field.
   */
  getFieldError(fieldName: keyof IApplicationCreateForm): string {
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
   * Map server-side validation errors to form field errors for inline display.
   * Handles known error patterns from the backend API.
   */
  private mapServerErrorsToForm(error: string): void {
    const lowerError = error.toLowerCase();

    if (lowerError.includes('opportunity') && lowerError.includes('acquired')) {
      this.form.get('opportunityId')?.setErrors({
        serverError: 'The referenced land opportunity must have Acquired status.'
      });
    } else if (lowerError.includes('opportunity') && lowerError.includes('not found')) {
      this.form.get('opportunityId')?.setErrors({
        serverError: 'No land opportunity found with this ID.'
      });
    } else if (lowerError.includes('active application') || lowerError.includes('conflict')) {
      this.form.get('opportunityId')?.setErrors({
        serverError: 'An active planning application already exists for this opportunity.'
      });
    } else if (lowerError.includes('description')) {
      this.form.get('description')?.setErrors({ serverError: error });
    } else if (lowerError.includes('council')) {
      this.form.get('councilName')?.setErrors({ serverError: error });
    } else if (lowerError.includes('application type') || lowerError.includes('applicationtype')) {
      this.form.get('applicationType')?.setErrors({ serverError: error });
    }
  }

  /**
   * Get a user-friendly required message by field name.
   */
  private getRequiredMessage(fieldName: keyof IApplicationCreateForm): string {
    const messages: Record<keyof IApplicationCreateForm, string> = {
      opportunityId: 'Please enter the land opportunity ID.',
      applicationType: 'Please select an application type.',
      description: 'Please enter a description of the proposed development.',
      councilName: 'Please enter the council name.'
    };
    return messages[fieldName];
  }
}
