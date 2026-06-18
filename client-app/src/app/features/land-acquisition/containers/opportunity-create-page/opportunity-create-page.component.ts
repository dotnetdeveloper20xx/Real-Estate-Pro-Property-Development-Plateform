import {
  Component, ChangeDetectionStrategy, inject, DestroyRef, OnInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule, FormBuilder, FormGroup, FormControl, Validators
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Actions, ofType } from '@ngrx/effects';
import { take } from 'rxjs/operators';

import { OpportunityActions } from '../../store/opportunity/opportunity.actions';
import {
  selectOpportunityLoading, selectOpportunityError
} from '../../store/opportunity/opportunity.selectors';
import { ICreateOpportunity } from '../../models/opportunity.model';
import { HasUnsavedChanges } from '../../guards/unsaved-changes.guard';

export interface IOpportunityForm {
  name: FormControl<string>;
  source: FormControl<string>;
  location: FormControl<string>;
  county: FormControl<string>;
  landSize: FormControl<number | null>;
  siteType: FormControl<string>;
  currentUse: FormControl<string>;
  tenure: FormControl<string>;
  description: FormControl<string>;
  expectedAcquisition: FormControl<string>;
}

@Component({
  selector: 'app-opportunity-create-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-6">
      <!-- Page Header -->
      <div class="flex items-center justify-between mb-6">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
            <span class="material-symbols-outlined text-white text-lg">add_location_alt</span>
          </div>
          <div>
            <h1 class="text-xl font-bold text-base-content leading-tight">Create New Opportunity</h1>
            <p class="text-xs text-base-content/50">Capture a new land opportunity for evaluation and add it to the pipeline.</p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <button class="btn btn-ghost btn-sm gap-1.5 text-xs" (click)="saveAsDraft()">
            <span class="material-symbols-outlined text-sm">edit_note</span>Save as Draft
          </button>
          <button class="btn btn-primary btn-sm gap-1.5 text-xs" (click)="onSubmit()" [disabled]="form.invalid || (loading$ | async)">
            <span class="material-symbols-outlined text-sm">add</span>Create Opportunity
          </button>
        </div>
      </div>

      <!-- Stepper -->
      <div class="flex items-center mb-8">
        <ng-container *ngFor="let step of steps; let i = index; let last = last">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                 [ngClass]="i === currentStep ? 'bg-primary text-white' : 'bg-base-300/50 text-base-content/40'">
              {{ i < currentStep ? '✓' : i + 1 }}
            </div>
            <div class="hidden md:block whitespace-nowrap">
              <p class="text-[12px] font-semibold leading-tight" [ngClass]="i === currentStep ? 'text-base-content' : 'text-base-content/50'">{{ step.title }}</p>
              <p class="text-[10px] text-base-content/35 leading-tight mt-px">{{ step.subtitle }}</p>
            </div>
          </div>
          <div *ngIf="!last" class="flex-1 h-px mx-4 bg-base-300/70"></div>
        </ng-container>
      </div>

      <!-- Server Error -->
      <div *ngIf="serverError$ | async as serverError" class="alert alert-error mb-4" role="alert">
        <span class="material-symbols-outlined text-sm">error</span>
        <span class="text-sm">{{ serverError }}</span>
      </div>

      <!-- Main Content -->
      <div class="flex gap-6">
        <!-- Form -->
        <div class="flex-1 min-w-0">
          <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate>
            <h2 class="text-[15px] font-bold text-base-content mb-5">Opportunity Details</h2>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-5 mb-5">
              <div>
                <label class="text-[13px] font-medium text-base-content mb-1.5 block">Opportunity Name <span class="text-error">*</span></label>
                <input type="text" formControlName="name" class="input input-bordered w-full h-10 text-sm"
                       [class.input-error]="isFieldInvalid('name')" placeholder="e.g., Greenfield Site, Oaklands Road" />
                <p class="text-[11px] text-base-content/40 mt-1">A descriptive name for this opportunity (3-200 characters)</p>
                <p *ngIf="isFieldInvalid('name')" class="text-[11px] text-error mt-0.5">{{ getFieldError('name') }}</p>
              </div>
              <div>
                <label class="text-[13px] font-medium text-base-content mb-1.5 block">Source</label>
                <input type="text" formControlName="source" class="input input-bordered w-full h-10 text-sm"
                       placeholder="e.g., Estate Agent, Direct Contact, Planning Portal" />
                <p class="text-[11px] text-base-content/40 mt-1">How this opportunity was discovered (optional)</p>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-[3fr_1fr] gap-x-5 gap-y-5 mb-5">
              <div>
                <label class="text-[13px] font-medium text-base-content mb-1.5 block">Location <span class="text-error">*</span></label>
                <div class="relative">
                  <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-base-content/30 text-[16px]">location_on</span>
                  <input type="text" formControlName="location" class="input input-bordered w-full h-10 text-sm pl-9"
                         [class.input-error]="isFieldInvalid('location')" placeholder="Start typing address or postcode..." />
                </div>
                <p class="text-[11px] text-base-content/40 mt-1">Full address or description of the land location (3-500 characters)</p>
                <p *ngIf="isFieldInvalid('location')" class="text-[11px] text-error mt-0.5">{{ getFieldError('location') }}</p>
              </div>
              <div>
                <label class="text-[13px] font-medium text-base-content mb-1.5 block">County</label>
                <select formControlName="county" class="select select-bordered w-full h-10 text-sm">
                  <option value="">Select county</option>
                  <option *ngFor="let c of counties" [value]="c">{{ c }}</option>
                </select>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-5 mb-5">
              <div>
                <label class="text-[13px] font-medium text-base-content mb-1.5 block">Land Size (acres) <span class="text-error">*</span></label>
                <div class="relative">
                  <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-base-content/30 text-[16px]">straighten</span>
                  <input type="number" formControlName="landSize" class="input input-bordered w-full h-10 text-sm pl-9"
                         [class.input-error]="isFieldInvalid('landSize')" placeholder="e.g., 2.5" min="0.01" step="0.01" />
                </div>
                <p class="text-[11px] text-base-content/40 mt-1">Total land area in acres. Must be greater than zero.</p>
                <p *ngIf="isFieldInvalid('landSize')" class="text-[11px] text-error mt-0.5">{{ getFieldError('landSize') }}</p>
              </div>
              <div>
                <label class="text-[13px] font-medium text-base-content mb-1.5 block">Site Type</label>
                <select formControlName="siteType" class="select select-bordered w-full h-10 text-sm">
                  <option value="">Select site type</option>
                  <option *ngFor="let t of siteTypes" [value]="t">{{ t }}</option>
                </select>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-5 mb-5">
              <div>
                <label class="text-[13px] font-medium text-base-content mb-1.5 block">Current Use</label>
                <select formControlName="currentUse" class="select select-bordered w-full h-10 text-sm">
                  <option value="">Select current use</option>
                  <option *ngFor="let u of currentUses" [value]="u">{{ u }}</option>
                </select>
              </div>
              <div>
                <label class="text-[13px] font-medium text-base-content mb-1.5 block">Tenure</label>
                <select formControlName="tenure" class="select select-bordered w-full h-10 text-sm">
                  <option value="">Select tenure type</option>
                  <option *ngFor="let t of tenureTypes" [value]="t">{{ t }}</option>
                </select>
              </div>
            </div>

            <div class="mb-8">
              <label class="text-[13px] font-medium text-base-content mb-1.5 block">Brief Description</label>
              <textarea formControlName="description" class="textarea textarea-bordered w-full h-32 text-sm"
                        placeholder="Provide a brief overview of the opportunity, key highlights, and potential..." maxlength="500"></textarea>
              <p class="text-[11px] text-base-content/40 mt-1 text-right">{{ form.controls.description.value?.length || 0 }} / 500</p>
            </div>

            <h2 class="text-[15px] font-bold text-base-content mb-4">Key Dates</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-5 mb-10">
              <div>
                <label class="text-[13px] font-medium text-base-content mb-1.5 block">Expected Acquisition Date</label>
                <div class="relative">
                  <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-base-content/30 text-[16px]">calendar_today</span>
                  <input type="date" formControlName="expectedAcquisition" class="input input-bordered w-full h-10 text-sm pl-9" />
                </div>
                <p class="text-[11px] text-base-content/40 mt-1">Target date for completing the acquisition (optional)</p>
              </div>
              <div>
                <label class="text-[13px] font-medium text-base-content mb-1.5 block">Added To Pipeline Date</label>
                <div class="relative">
                  <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-base-content/30 text-[16px]">calendar_today</span>
                  <input type="text" class="input input-bordered w-full h-10 text-sm pl-9 bg-base-200/30" [value]="todayFormatted" disabled />
                </div>
                <p class="text-[11px] text-base-content/40 mt-1">Automatically set to today</p>
              </div>
            </div>

            <div class="flex items-center justify-between pt-6 border-t border-base-200">
              <button type="button" routerLink="/land-acquisition/pipeline" class="btn btn-ghost btn-sm gap-1.5 text-base-content/60">
                <span class="material-symbols-outlined text-[16px]">close</span> Cancel
              </button>
              <button type="submit" class="btn btn-primary gap-2 px-6" [disabled]="form.invalid || (loading$ | async)">
                <ng-container *ngIf="!(loading$ | async)">Save &amp; Continue <span class="material-symbols-outlined text-lg">arrow_forward</span></ng-container>
                <ng-container *ngIf="loading$ | async"><span class="loading loading-spinner loading-sm"></span> Creating...</ng-container>
              </button>
            </div>
          </form>
        </div>

        <!-- Sidebar -->
        <div class="w-72 shrink-0 hidden lg:block space-y-5">
          <div class="rounded-xl border border-base-200 bg-base-100 p-5 space-y-4">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <span class="material-symbols-outlined text-white text-sm">summarize</span>
              </div>
              <span class="text-[13px] font-bold text-base-content">Opportunity Summary</span>
            </div>
            <div class="space-y-3 text-[12px]">
              <div class="flex justify-between items-start">
                <span class="text-base-content/50 flex items-center gap-1.5"><span class="material-symbols-outlined text-[14px] text-primary">article</span>New Opportunity</span>
                <span class="text-[10px] text-base-content/40 text-right">Will be added to the pipeline</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-base-content/50 flex items-center gap-1.5"><span class="material-symbols-outlined text-[14px]">flag</span>Status</span>
                <span class="text-[11px] font-semibold text-error bg-error/10 px-2 py-0.5 rounded">Identified</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-base-content/50 flex items-center gap-1.5"><span class="material-symbols-outlined text-[14px]">layers</span>Stage</span>
                <span class="font-medium text-base-content">Identified</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-base-content/50 flex items-center gap-1.5"><span class="material-symbols-outlined text-[14px]">person</span>Added By</span>
                <span class="font-medium text-base-content">{{ currentUserName }}</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-base-content/50 flex items-center gap-1.5"><span class="material-symbols-outlined text-[14px]">calendar_today</span>Date Added</span>
                <span class="text-[11px] text-base-content">{{ todayFormattedFull }}</span>
              </div>
            </div>
          </div>

          <div class="rounded-xl bg-base-200/25 border border-base-200 p-5 space-y-3">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-primary text-lg">tips_and_updates</span>
              <span class="text-[13px] font-bold text-base-content">Tips for Success</span>
            </div>
            <ul class="space-y-2 text-[12px] text-base-content/70">
              <li class="flex items-center gap-2"><span class="material-symbols-outlined text-success text-[16px]">check_circle</span>Provide a clear, descriptive name</li>
              <li class="flex items-center gap-2"><span class="material-symbols-outlined text-success text-[16px]">check_circle</span>Include accurate location details</li>
              <li class="flex items-center gap-2"><span class="material-symbols-outlined text-success text-[16px]">check_circle</span>Add realistic land size</li>
              <li class="flex items-center gap-2"><span class="material-symbols-outlined text-success text-[16px]">check_circle</span>Select the correct source</li>
              <li class="flex items-center gap-2"><span class="material-symbols-outlined text-primary text-[16px]">check_circle</span>Set a target acquisition date</li>
            </ul>
          </div>

          <div class="rounded-xl bg-amber-50 border border-amber-200/60 p-5">
            <div class="flex items-center gap-2 mb-1.5">
              <span class="material-symbols-outlined text-amber-600 text-lg">help</span>
              <span class="text-[13px] font-bold text-base-content">Need Help?</span>
            </div>
            <p class="text-[12px] text-base-content/60 leading-relaxed">Ensure all required fields (*) are completed before proceeding.</p>
          </div>
        </div>
      </div>
    </div>
  `
})
export class OpportunityCreatePageComponent implements OnInit, HasUnsavedChanges {
  private readonly fb = inject(FormBuilder);
  private readonly store = inject(Store);
  private readonly router = inject(Router);
  private readonly actions$ = inject(Actions);
  private readonly destroyRef = inject(DestroyRef);

  submitted = false;
  private saved = false;
  currentStep = 0;

  readonly loading$ = this.store.select(selectOpportunityLoading);
  readonly serverError$ = this.store.select(selectOpportunityError);

  readonly steps = [
    { title: 'Opportunity Details', subtitle: 'Basic information' },
    { title: 'Land Information', subtitle: 'Location and size' },
    { title: 'Financial Overview', subtitle: 'Value and costs' },
    { title: 'Due Diligence', subtitle: 'Key checks' },
    { title: 'Review & Confirm', subtitle: 'Validate and create' }
  ];

  readonly counties = [
    'Bedfordshire', 'Berkshire', 'Bristol', 'Buckinghamshire', 'Cambridgeshire',
    'Cheshire', 'Cornwall', 'Cumbria', 'Derbyshire', 'Devon', 'Dorset',
    'Durham', 'East Sussex', 'Essex', 'Gloucestershire', 'Hampshire',
    'Herefordshire', 'Hertfordshire', 'Kent', 'Lancashire', 'Leicestershire',
    'Lincolnshire', 'London', 'Manchester', 'Merseyside', 'Norfolk',
    'Northamptonshire', 'Northumberland', 'Nottinghamshire', 'Oxfordshire',
    'Shropshire', 'Somerset', 'Staffordshire', 'Suffolk', 'Surrey',
    'Tyne and Wear', 'Warwickshire', 'West Midlands', 'West Sussex',
    'Wiltshire', 'Worcestershire', 'Yorkshire'
  ];

  readonly siteTypes = [
    'Greenfield', 'Brownfield', 'Mixed Use', 'Residential', 'Commercial',
    'Industrial', 'Agricultural', 'Infill'
  ];

  readonly currentUses = [
    'Vacant Land', 'Agricultural', 'Residential', 'Commercial', 'Industrial',
    'Mixed Use', 'Woodland', 'Derelict', 'Parking', 'Other'
  ];

  readonly tenureTypes = [
    'Freehold', 'Leasehold', 'Commonhold', 'Share of Freehold', 'Unknown'
  ];

  currentUserName = 'Current User';
  todayFormatted = '';
  todayFormattedFull = '';

  readonly form: FormGroup<IOpportunityForm> = this.fb.group<IOpportunityForm>({
    name: this.fb.control('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(3), Validators.maxLength(200)]
    }),
    source: this.fb.control('', { nonNullable: true }),
    location: this.fb.control('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(3), Validators.maxLength(500)]
    }),
    county: this.fb.control('', { nonNullable: true }),
    landSize: this.fb.control<number | null>(null, {
      validators: [Validators.required, Validators.min(0.01)]
    }),
    siteType: this.fb.control('', { nonNullable: true }),
    currentUse: this.fb.control('', { nonNullable: true }),
    tenure: this.fb.control('', { nonNullable: true }),
    description: this.fb.control('', {
      nonNullable: true, validators: [Validators.maxLength(500)]
    }),
    expectedAcquisition: this.fb.control('', { nonNullable: true })
  });

  ngOnInit(): void {
    // Set today's date for display
    const now = new Date();
    this.todayFormatted = now.toLocaleDateString('en-GB', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
    this.todayFormattedFull = now.toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric'
    }) + ', ' + now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    // Get current user name from localStorage
    try {
      const stored = localStorage.getItem('be_current_user');
      if (stored) {
        const user = JSON.parse(stored);
        this.currentUserName = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || 'Current User';
      }
    } catch { /* ignore */ }

    // Listen for success
    this.actions$.pipe(
      ofType(OpportunityActions.createOpportunitySuccess),
      take(1),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => {
      this.saved = true;
      this.router.navigate(['/land-acquisition/pipeline']);
    });

    // Listen for failures
    this.actions$.pipe(
      ofType(OpportunityActions.createOpportunityFailure),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(({ error }: { error: string }) => {
      this.mapServerErrorsToForm(error);
    });
  }

  hasUnsavedChanges(): boolean {
    return !this.saved && this.form.dirty;
  }

  onSubmit(): void {
    this.submitted = true;
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    const v = this.form.getRawValue();
    const payload: ICreateOpportunity = {
      name: v.name.trim(),
      location: v.location.trim(),
      county: v.county || null,
      landSize: v.landSize!,
      siteType: v.siteType || null,
      currentUse: v.currentUse || null,
      tenure: v.tenure || null,
      description: v.description?.trim() || null,
      source: v.source?.trim() || null,
      expectedAcquisition: v.expectedAcquisition || null
    };

    this.store.dispatch(OpportunityActions.createOpportunity({ opportunity: payload }));
  }

  saveAsDraft(): void {
    // Save form data to localStorage for later recovery
    const v = this.form.getRawValue();
    localStorage.setItem('opportunity_draft', JSON.stringify(v));
    this.saved = true;
    this.router.navigate(['/land-acquisition/pipeline']);
  }

  isFieldInvalid(fieldName: keyof IOpportunityForm): boolean {
    const control = this.form.get(fieldName);
    return !!(control && control.invalid && (control.touched || this.submitted));
  }

  getFieldError(fieldName: keyof IOpportunityForm): string {
    const control = this.form.get(fieldName);
    if (!control?.errors) return '';
    const errors = control.errors;
    if (errors['required']) return this.getRequiredMessage(fieldName);
    if (errors['minlength']) return `Must be at least ${errors['minlength'].requiredLength} characters.`;
    if (errors['maxlength']) return `Must not exceed ${errors['maxlength'].requiredLength} characters.`;
    if (errors['min']) return 'Must be greater than zero.';
    if (errors['serverError']) return errors['serverError'] as string;
    return 'Invalid value.';
  }

  private getRequiredMessage(fieldName: keyof IOpportunityForm): string {
    const messages: Record<string, string> = {
      name: 'Please enter the opportunity name.',
      location: 'Please enter the land location.',
      landSize: 'Please enter the land size in acres.',
    };
    return messages[fieldName] ?? 'This field is required.';
  }

  private mapServerErrorsToForm(error: string): void {
    const lower = error.toLowerCase();
    if (lower.includes('name') && lower.includes('location')) {
      this.form.get('name')?.setErrors({ serverError: 'An opportunity with this name and location already exists.' });
    } else if (lower.includes('name')) {
      this.form.get('name')?.setErrors({ serverError: error });
    } else if (lower.includes('location')) {
      this.form.get('location')?.setErrors({ serverError: error });
    }
  }
}
