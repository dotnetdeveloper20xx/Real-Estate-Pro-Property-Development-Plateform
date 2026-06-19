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
  Validators
} from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Actions, ofType } from '@ngrx/effects';
import { take, switchMap, filter } from 'rxjs/operators';

import { OpportunityActions } from '../../store/opportunity/opportunity.actions';
import {
  selectOpportunityLoading,
  selectOpportunityError,
  selectOpportunityById
} from '../../store/opportunity/opportunity.selectors';
import { IUpdateOpportunity, IOpportunityListItem } from '../../models/opportunity.model';
import { HasUnsavedChanges } from '../../guards/unsaved-changes.guard';
import { IOpportunityForm } from '../opportunity-create-page/opportunity-create-page.component';

/**
 * Opportunity Edit page — reactive form for updating an existing land opportunity.
 *
 * Features:
 * - Typed FormGroup with Name, Location, LandSize, Source, ExpectedAcquisition
 * - Pre-populates form with existing opportunity data
 * - Inline validation error messages on blur/submit
 * - Disabled submit until form is valid and dirty
 * - Server-side error mapping to form fields
 * - Unsaved changes guard with confirmation dialog
 * - Helper text on complex fields
 */
@Component({
  selector: 'app-opportunity-edit-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-6 max-w-3xl mx-auto">
      <!-- Page Header -->
      <div class="mb-6">
        <div class="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <a routerLink="/land-acquisition/pipeline" class="hover:text-primary">Pipeline</a>
          <span>/</span>
          @if (opportunityId) {
            <a [routerLink]="['/land-acquisition/opportunities', opportunityId]" class="hover:text-primary">Opportunity</a>
            <span>/</span>
          }
          <span>Edit</span>
        </div>
        <h1 class="text-2xl font-semibold text-gray-900">Edit Opportunity</h1>
        <p class="mt-1 text-sm text-gray-600">
          Update the land opportunity details below. Changes will be saved to the system.
        </p>
      </div>

      <!-- Loading State -->
      @if (!opportunityLoaded) {
        <div class="flex justify-center items-center py-12">
          <span class="loading loading-spinner loading-lg text-primary"></span>
        </div>
      }

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
      @if (opportunityLoaded) {
        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="card bg-base-100 shadow-sm" novalidate>
          <div class="card-body space-y-5">

            <!-- Name Field -->
            <div class="form-control w-full">
              <label class="label" for="name">
                <span class="label-text font-medium">Opportunity Name <span class="text-error">*</span></span>
              </label>
              <input
                id="name"
                type="text"
                formControlName="name"
                class="input input-bordered w-full"
                [class.input-error]="isFieldInvalid('name')"
                placeholder="e.g., Greenfield Site, Oaklands Road"
                (blur)="markTouched('name')"
                aria-describedby="name-help name-error"
              />
              <label class="label" id="name-help">
                <span class="label-text-alt text-gray-500">A descriptive name for this opportunity (3–200 characters)</span>
              </label>
              @if (isFieldInvalid('name')) {
                <label class="label" id="name-error" role="alert">
                  <span class="label-text-alt text-error">{{ getFieldError('name') }}</span>
                </label>
              }
            </div>

            <!-- Location Field -->
            <div class="form-control w-full">
              <label class="label" for="location">
                <span class="label-text font-medium">Location <span class="text-error">*</span></span>
              </label>
              <textarea
                id="location"
                formControlName="location"
                class="textarea textarea-bordered w-full"
                [class.textarea-error]="isFieldInvalid('location')"
                placeholder="e.g., Plot 12, Oaklands Road, Chelmsford, Essex CM2 9PQ"
                rows="3"
                (blur)="markTouched('location')"
                aria-describedby="location-help location-error"
              ></textarea>
              <label class="label" id="location-help">
                <span class="label-text-alt text-gray-500">Full address or description of the land location (3–500 characters)</span>
              </label>
              @if (isFieldInvalid('location')) {
                <label class="label" id="location-error" role="alert">
                  <span class="label-text-alt text-error">{{ getFieldError('location') }}</span>
                </label>
              }
            </div>

            <!-- Land Size Field -->
            <div class="form-control w-full">
              <label class="label" for="landSize">
                <span class="label-text font-medium">Land Size (acres) <span class="text-error">*</span></span>
              </label>
              <input
                id="landSize"
                type="number"
                formControlName="landSize"
                class="input input-bordered w-full"
                [class.input-error]="isFieldInvalid('landSize')"
                placeholder="e.g., 2.5"
                min="0.01"
                step="0.01"
                (blur)="markTouched('landSize')"
                aria-describedby="landSize-help landSize-error"
              />
              <label class="label" id="landSize-help">
                <span class="label-text-alt text-gray-500">Total land area in acres. Must be greater than zero.</span>
              </label>
              @if (isFieldInvalid('landSize')) {
                <label class="label" id="landSize-error" role="alert">
                  <span class="label-text-alt text-error">{{ getFieldError('landSize') }}</span>
                </label>
              }
            </div>

            <!-- Source Field (optional) -->
            <div class="form-control w-full">
              <label class="label" for="source">
                <span class="label-text font-medium">Source</span>
              </label>
              <input
                id="source"
                type="text"
                formControlName="source"
                class="input input-bordered w-full"
                placeholder="e.g., Estate Agent, Direct Contact, Planning Portal"
                aria-describedby="source-help"
              />
              <label class="label" id="source-help">
                <span class="label-text-alt text-gray-500">How this opportunity was discovered (optional)</span>
              </label>
            </div>

            <!-- Expected Acquisition Date Field (optional) -->
            <div class="form-control w-full">
              <label class="label" for="expectedAcquisition">
                <span class="label-text font-medium">Expected Acquisition Date</span>
              </label>
              <input
                id="expectedAcquisition"
                type="date"
                formControlName="expectedAcquisition"
                class="input input-bordered w-full"
                aria-describedby="expectedAcquisition-help"
              />
              <label class="label" id="expectedAcquisition-help">
                <span class="label-text-alt text-gray-500">Target date for completing the acquisition (optional)</span>
              </label>
            </div>

            <!-- Action Buttons -->
            <div class="card-actions justify-end pt-4 border-t border-base-200">
              <a
                [routerLink]="['/land-acquisition/opportunities', opportunityId]"
                class="btn btn-ghost"
              >
                Cancel
              </a>
              <button
                type="submit"
                class="btn btn-primary"
                [disabled]="form.invalid || form.pristine || (loading$ | async)"
              >
                @if (loading$ | async) {
                  <span class="loading loading-spinner loading-sm"></span>
                  Saving...
                } @else {
                  Save Changes
                }
              </button>
            </div>

          </div>
        </form>
      }
    </div>
  `
})
export class OpportunityEditPageComponent implements OnInit, HasUnsavedChanges {
  private readonly fb = inject(FormBuilder);
  private readonly store = inject(Store);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly actions$ = inject(Actions);
  private readonly destroyRef = inject(DestroyRef);

  /** The opportunity ID from the route parameter. */
  opportunityId: string | null = null;

  /** Whether form has been submitted (to trigger showing all validation errors). */
  submitted = false;

  /** Whether the form was saved successfully (to disable unsaved changes guard). */
  private saved = false;

  /** Whether the opportunity data has loaded into the form. */
  opportunityLoaded = false;

  /** The current rowVersion for optimistic concurrency. */
  private currentRowVersion = '';

  /** Loading state from the store. */
  readonly loading$ = this.store.select(selectOpportunityLoading);

  /** Server error from the store. */
  readonly serverError$ = this.store.select(selectOpportunityError);

  /** Typed reactive form for opportunity editing. */
  readonly form: FormGroup<IOpportunityForm> = this.fb.group<IOpportunityForm>({
    name: this.fb.control('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(200)
      ]
    }),
    source: this.fb.control('', { nonNullable: true }),
    location: this.fb.control('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(500)
      ]
    }),
    county: this.fb.control('', { nonNullable: true }),
    landSize: this.fb.control<number | null>(null, {
      validators: [
        Validators.required,
        Validators.min(0.01)
      ]
    }),
    siteType: this.fb.control('', { nonNullable: true }),
    currentUse: this.fb.control('', { nonNullable: true }),
    tenure: this.fb.control('', { nonNullable: true }),
    description: this.fb.control('', { nonNullable: true, validators: [Validators.maxLength(500)] }),
    expectedAcquisition: this.fb.control('', { nonNullable: true })
  });

  ngOnInit(): void {
    this.opportunityId = this.route.snapshot.paramMap.get('id');

    if (!this.opportunityId) {
      this.router.navigate(['/land-acquisition/pipeline']);
      return;
    }

    // Load the opportunity data into the form
    this.store
      .select(selectOpportunityById(this.opportunityId))
      .pipe(
        filter((opp: IOpportunityListItem | undefined): opp is IOpportunityListItem => opp != null),
        take(1),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((opportunity: IOpportunityListItem) => {
        this.populateForm(opportunity);
        this.opportunityLoaded = true;
      });

    // If opportunity not in store, dispatch load and wait
    this.store
      .select(selectOpportunityById(this.opportunityId))
      .pipe(
        take(1),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((opp: IOpportunityListItem | undefined) => {
        if (!opp) {
          this.store.dispatch(OpportunityActions.loadOpportunities());
          // Re-subscribe after load
          this.actions$
            .pipe(
              ofType(OpportunityActions.loadOpportunitiesSuccess),
              take(1),
              switchMap(() => this.store.select(selectOpportunityById(this.opportunityId!))),
              filter((o: IOpportunityListItem | undefined): o is IOpportunityListItem => o != null),
              take(1),
              takeUntilDestroyed(this.destroyRef)
            )
            .subscribe((opportunity: IOpportunityListItem) => {
              this.populateForm(opportunity);
              this.opportunityLoaded = true;
            });
        }
      });

    // Listen for successful update to navigate back
    this.actions$
      .pipe(
        ofType(OpportunityActions.updateOpportunitySuccess),
        take(1),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        this.saved = true;
        this.router.navigate(['/land-acquisition/opportunities', this.opportunityId]);
      });

    // Listen for server errors and map to form fields
    this.actions$
      .pipe(
        ofType(OpportunityActions.updateOpportunityFailure),
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
   * Submit the form — dispatch the updateOpportunity action.
   */
  onSubmit(): void {
    this.submitted = true;
    this.form.markAllAsTouched();

    if (this.form.invalid || !this.opportunityId) {
      return;
    }

    const formValue = this.form.getRawValue();

    const payload: IUpdateOpportunity = {
      name: formValue.name.trim(),
      location: formValue.location.trim(),
      landSize: formValue.landSize!,
      source: formValue.source?.trim() || null,
      expectedAcquisition: formValue.expectedAcquisition || null,
      rowVersion: this.currentRowVersion
    };

    this.store.dispatch(
      OpportunityActions.updateOpportunity({ id: this.opportunityId, changes: payload })
    );
  }

  /**
   * Check if a specific form field should display its validation error.
   * Shows error when field is touched or the form has been submitted.
   */
  isFieldInvalid(fieldName: keyof IOpportunityForm): boolean {
    const control = this.form.get(fieldName);
    return !!(control && control.invalid && (control.touched || this.submitted));
  }

  /**
   * Mark a field as touched (used on blur to trigger inline validation).
   */
  markTouched(fieldName: keyof IOpportunityForm): void {
    const control = this.form.get(fieldName);
    control?.markAsTouched();
  }

  /**
   * Get the user-friendly error message for a field.
   */
  getFieldError(fieldName: keyof IOpportunityForm): string {
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
    if (errors['min']) {
      return 'Must be greater than zero.';
    }
    if (errors['serverError']) {
      return errors['serverError'] as string;
    }

    return 'Invalid value.';
  }

  /**
   * Populate the form with existing opportunity data.
   */
  private populateForm(opportunity: IOpportunityListItem): void {
    this.currentRowVersion = opportunity.rowVersion;
    this.form.patchValue({
      name: opportunity.name,
      location: opportunity.location,
      landSize: opportunity.landSize,
      source: opportunity.source ?? '',
      expectedAcquisition: opportunity.expectedAcquisition
        ? this.formatDateForInput(opportunity.expectedAcquisition)
        : ''
    });
    // Reset dirty state after patching
    this.form.markAsPristine();
  }

  /**
   * Map server-side errors to form field errors for inline display.
   */
  private mapServerErrorsToForm(error: string): void {
    const lowerError = error.toLowerCase();

    if (lowerError.includes('name') && lowerError.includes('location')) {
      this.form.get('name')?.setErrors({ serverError: 'An opportunity with this name and location already exists.' });
      this.form.get('location')?.setErrors({ serverError: 'An opportunity with this name and location already exists.' });
    } else if (lowerError.includes('name')) {
      this.form.get('name')?.setErrors({ serverError: error });
    } else if (lowerError.includes('location')) {
      this.form.get('location')?.setErrors({ serverError: error });
    }
  }

  /**
   * Get a user-friendly required message by field name.
   */
  private getRequiredMessage(fieldName: keyof IOpportunityForm): string {
    const messages: Record<keyof IOpportunityForm, string> = {
      name: 'Please enter the opportunity name.',
      source: 'Please enter the source.',
      location: 'Please enter the land location.',
      county: 'Please select a county.',
      landSize: 'Please enter the land size in acres.',
      siteType: 'Please select a site type.',
      currentUse: 'Please select current use.',
      tenure: 'Please select tenure type.',
      description: 'Please enter a description.',
      expectedAcquisition: 'Please enter an expected acquisition date.'
    };
    return messages[fieldName];
  }

  /**
   * Format an ISO date string for the HTML date input (YYYY-MM-DD).
   */
  private formatDateForInput(dateStr: string): string {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return '';
    }
    return date.toISOString().split('T')[0];
  }
}
