import {
  Component, ChangeDetectionStrategy, inject, DestroyRef, OnInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule, FormBuilder, FormGroup, FormControl, Validators
} from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Actions, ofType } from '@ngrx/effects';
import { take } from 'rxjs/operators';
import { OpportunityActions } from '../../store/opportunity/opportunity.actions';
import {
  selectOpportunityLoading, selectOpportunityError
} from '../../store/opportunity/opportunity.selectors';
import { ICreateOpportunity, IUpdateOpportunity } from '../../models/opportunity.model';
import { OwnershipType } from '../../models/land-owner.model';
import { FeasibilityScenario } from '../../models/feasibility.model';
import { HasUnsavedChanges } from '../../guards/unsaved-changes.guard';
import { OpportunityService } from '../../services/opportunity.service';
import { LandOwnerService } from '../../services/land-owner.service';
import { FeasibilityService } from '../../services/feasibility.service';
import { DueDiligenceService } from '../../services/due-diligence.service';
import { ToastService } from '@core/services/toast.service';
import { AuthService } from '@core/services/auth.service';

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
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterLink],
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
            <h1 class="text-xl font-bold text-base-content leading-tight">{{ isEditMode ? 'Edit Opportunity' : 'Create New Opportunity' }}</h1>
            <p class="text-xs text-base-content/50">{{ isEditMode ? 'Update the opportunity details below.' : 'Capture a new land opportunity for evaluation and add it to the pipeline.' }}</p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <button class="btn btn-ghost btn-sm gap-1.5 text-xs" (click)="saveAsDraft()" *ngIf="!isEditMode">
            <span class="material-symbols-outlined text-sm">edit_note</span>Save as Draft
          </button>
          <button class="btn btn-primary btn-sm gap-1.5 text-xs" (click)="onSubmit()" [disabled]="form.invalid || (loading$ | async)">
            <span class="material-symbols-outlined text-sm">{{ isEditMode ? 'save' : 'add' }}</span>{{ isEditMode ? 'Update Opportunity' : 'Create Opportunity' }}
          </button>
        </div>
      </div>

      <!-- Stepper -->
      <div class="flex items-center mb-8">
        <ng-container *ngFor="let step of steps; let i = index; let last = last">
          <div class="flex items-center gap-2.5 cursor-pointer" (click)="goToStep(i)">
            <div class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                 [ngClass]="i === currentStep ? 'bg-primary text-white' : i < currentStep ? 'bg-success text-white' : 'bg-base-300/50 text-base-content/40'">
              {{ i < currentStep ? '✓' : i + 1 }}
            </div>
            <div class="hidden md:block whitespace-nowrap">
              <p class="text-[12px] font-semibold leading-tight" [ngClass]="i === currentStep ? 'text-base-content' : 'text-base-content/50'">{{ step.title }}</p>
              <p class="text-[10px] text-base-content/35 leading-tight mt-px">{{ step.subtitle }}</p>
            </div>
          </div>
          <div *ngIf="!last" class="flex-1 h-px mx-4" [ngClass]="i < currentStep ? 'bg-success' : 'bg-base-300/70'"></div>
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
          <!-- Step 1: Opportunity Details -->
          <form *ngIf="currentStep === 0" [formGroup]="form" (ngSubmit)="onSubmit()" novalidate>
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

          <!-- Step 2: Land Information -->
          <div *ngIf="currentStep === 1" class="space-y-6">
            <h2 class="text-[15px] font-bold text-base-content">Land Owner Information</h2>
            <p class="text-sm text-base-content/50 -mt-4">Provide details about the current land owner (optional — can be added later).</p>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label class="text-[13px] font-medium text-base-content mb-1.5 block">Owner Name</label>
                <input type="text" class="input input-bordered w-full h-10 text-sm" [(ngModel)]="landOwnerForm.ownerName" placeholder="e.g., Tower Hamlets Estates" />
              </div>
              <div>
                <label class="text-[13px] font-medium text-base-content mb-1.5 block">Ownership Type</label>
                <select class="select select-bordered w-full h-10 text-sm" [(ngModel)]="landOwnerForm.ownershipType">
                  <option value="">Select type</option>
                  <option value="Freehold">Freehold</option>
                  <option value="Leasehold">Leasehold</option>
                  <option value="Commonhold">Commonhold</option>
                  <option value="Trust">Trust</option>
                  <option value="Corporate">Corporate</option>
                </select>
              </div>
              <div>
                <label class="text-[13px] font-medium text-base-content mb-1.5 block">Contact Email</label>
                <input type="email" class="input input-bordered w-full h-10 text-sm" [(ngModel)]="landOwnerForm.contactEmail" placeholder="e.g., enquiries@owner.co.uk" />
              </div>
              <div>
                <label class="text-[13px] font-medium text-base-content mb-1.5 block">Contact Phone</label>
                <input type="text" class="input input-bordered w-full h-10 text-sm" [(ngModel)]="landOwnerForm.contactPhone" placeholder="e.g., 020 7046 1046" />
              </div>
              <div class="md:col-span-2">
                <label class="text-[13px] font-medium text-base-content mb-1.5 block">Address</label>
                <input type="text" class="input input-bordered w-full h-10 text-sm" [(ngModel)]="landOwnerForm.address" placeholder="e.g., 47 Victoria Road, Bournemouth, BH1 3PS" />
              </div>
            </div>
            <div class="flex items-center justify-between pt-6 border-t border-base-200">
              <button class="btn btn-ghost btn-sm" (click)="skipStep()">Skip this step</button>
              <button class="btn btn-primary gap-2 px-6" (click)="nextStep()">Save &amp; Continue <span class="material-symbols-outlined text-lg">arrow_forward</span></button>
            </div>
          </div>

          <!-- Step 3: Financial Overview -->
          <div *ngIf="currentStep === 2" class="space-y-6">
            <h2 class="text-[15px] font-bold text-base-content">Financial Overview</h2>
            <p class="text-sm text-base-content/50 -mt-4">Provide initial financial estimates for this opportunity (optional).</p>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label class="text-[13px] font-medium text-base-content mb-1.5 block">Estimated Purchase Price (£)</label>
                <input type="number" class="input input-bordered w-full h-10 text-sm" [(ngModel)]="feasibilityForm.estimatedPurchasePrice" placeholder="e.g., 4500000" />
              </div>
              <div>
                <label class="text-[13px] font-medium text-base-content mb-1.5 block">Estimated Development Cost (£)</label>
                <input type="number" class="input input-bordered w-full h-10 text-sm" [(ngModel)]="feasibilityForm.estimatedDevelopmentCost" placeholder="e.g., 12000000" />
              </div>
              <div>
                <label class="text-[13px] font-medium text-base-content mb-1.5 block">Expected Revenue (£)</label>
                <input type="number" class="input input-bordered w-full h-10 text-sm" [(ngModel)]="feasibilityForm.expectedRevenue" placeholder="e.g., 22000000" />
              </div>
              <div>
                <label class="text-[13px] font-medium text-base-content mb-1.5 block">Expected Profit (£)</label>
                <input type="number" class="input input-bordered w-full h-10 text-sm" [(ngModel)]="feasibilityForm.expectedProfit" placeholder="e.g., 5500000" />
              </div>
            </div>
            <div class="flex items-center justify-between pt-6 border-t border-base-200">
              <button class="btn btn-ghost btn-sm" (click)="skipStep()">Skip this step</button>
              <button class="btn btn-primary gap-2 px-6" (click)="nextStep()">Save &amp; Continue <span class="material-symbols-outlined text-lg">arrow_forward</span></button>
            </div>
          </div>

          <!-- Step 4: Due Diligence -->
          <div *ngIf="currentStep === 3" class="space-y-6">
            <h2 class="text-[15px] font-bold text-base-content">Due Diligence Checks</h2>
            <p class="text-sm text-base-content/50 -mt-4">Select which due diligence checks are required for this opportunity.</p>
            <div class="space-y-3">
              <label class="flex items-center gap-3 p-3 rounded-lg border border-base-200 hover:bg-base-200/30 cursor-pointer">
                <input type="checkbox" class="checkbox checkbox-primary checkbox-sm" [(ngModel)]="ddTypes.legal" />
                <div><span class="text-sm font-medium">Legal</span><p class="text-xs text-base-content/50">Title searches, ownership verification, encumbrances</p></div>
              </label>
              <label class="flex items-center gap-3 p-3 rounded-lg border border-base-200 hover:bg-base-200/30 cursor-pointer">
                <input type="checkbox" class="checkbox checkbox-primary checkbox-sm" [(ngModel)]="ddTypes.environmental" />
                <div><span class="text-sm font-medium">Environmental</span><p class="text-xs text-base-content/50">Contamination, flood risk, ecology assessments</p></div>
              </label>
              <label class="flex items-center gap-3 p-3 rounded-lg border border-base-200 hover:bg-base-200/30 cursor-pointer">
                <input type="checkbox" class="checkbox checkbox-primary checkbox-sm" [(ngModel)]="ddTypes.planning" />
                <div><span class="text-sm font-medium">Planning</span><p class="text-xs text-base-content/50">Planning history, local plan zoning, permitted uses</p></div>
              </label>
              <label class="flex items-center gap-3 p-3 rounded-lg border border-base-200 hover:bg-base-200/30 cursor-pointer">
                <input type="checkbox" class="checkbox checkbox-primary checkbox-sm" [(ngModel)]="ddTypes.utilities" />
                <div><span class="text-sm font-medium">Utilities</span><p class="text-xs text-base-content/50">Gas, electricity, water, drainage connections</p></div>
              </label>
              <label class="flex items-center gap-3 p-3 rounded-lg border border-base-200 hover:bg-base-200/30 cursor-pointer">
                <input type="checkbox" class="checkbox checkbox-primary checkbox-sm" [(ngModel)]="ddTypes.valuation" />
                <div><span class="text-sm font-medium">Valuation</span><p class="text-xs text-base-content/50">Independent valuation and market assessment</p></div>
              </label>
            </div>
            <div class="flex items-center justify-between pt-6 border-t border-base-200">
              <button class="btn btn-ghost btn-sm" (click)="skipStep()">Skip this step</button>
              <button class="btn btn-primary gap-2 px-6" (click)="nextStep()">Save &amp; Continue <span class="material-symbols-outlined text-lg">arrow_forward</span></button>
            </div>
          </div>

          <!-- Step 5: Review & Confirm -->
          <div *ngIf="currentStep === 4" class="space-y-6">
            <h2 class="text-[15px] font-bold text-base-content">Review & Confirm</h2>
            <p class="text-sm text-base-content/50 -mt-4">Your opportunity has been created. Here's a summary of what was captured.</p>

            <div class="card bg-success/5 border border-success/20 p-4">
              <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-success text-xl">check_circle</span>
                <span class="text-sm font-semibold text-success">Opportunity created successfully!</span>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="card bg-base-100 border border-base-200 p-4">
                <h4 class="text-xs font-bold text-primary uppercase mb-2">Opportunity</h4>
                <p class="text-sm font-medium">{{ form.controls.name.value }}</p>
                <p class="text-xs text-base-content/50">{{ form.controls.location.value }}</p>
              </div>
              <div class="card bg-base-100 border border-base-200 p-4">
                <h4 class="text-xs font-bold text-primary uppercase mb-2">Land Owner</h4>
                <p class="text-sm font-medium">{{ landOwnerForm.ownerName || 'Not provided' }}</p>
                <p class="text-xs text-base-content/50">{{ landOwnerForm.ownershipType || '—' }}</p>
              </div>
              <div class="card bg-base-100 border border-base-200 p-4">
                <h4 class="text-xs font-bold text-primary uppercase mb-2">Financials</h4>
                <p class="text-sm font-medium">{{ feasibilityForm.estimatedPurchasePrice > 0 ? ('£' + (feasibilityForm.estimatedPurchasePrice | number)) : 'Not provided' }}</p>
              </div>
              <div class="card bg-base-100 border border-base-200 p-4">
                <h4 class="text-xs font-bold text-primary uppercase mb-2">Due Diligence</h4>
                <p class="text-sm font-medium">{{ getDdCount() }} checks created</p>
              </div>
            </div>

            <div class="flex items-center justify-between pt-6 border-t border-base-200">
              <button class="btn btn-ghost btn-sm" routerLink="/land-acquisition/pipeline">Go to Pipeline</button>
              <button class="btn btn-primary gap-2 px-6" (click)="nextStep()">View Opportunity <span class="material-symbols-outlined text-lg">arrow_forward</span></button>
            </div>
          </div>
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
  private readonly route = inject(ActivatedRoute);
  private readonly actions$ = inject(Actions);
  private readonly destroyRef = inject(DestroyRef);
  private readonly opportunityService = inject(OpportunityService);
  private readonly landOwnerService = inject(LandOwnerService);
  private readonly feasibilityService = inject(FeasibilityService);
  private readonly dueDiligenceService = inject(DueDiligenceService);
  private readonly toast = inject(ToastService);
  private readonly authService = inject(AuthService);

  submitted = false;
  private saved = false;
  currentStep = 0;
  isEditMode = false;
  opportunityId: string | null = null;
  createdOpportunityId: string | null = null;
  private currentRowVersion = '';
  private existingLandOwnerId: string | null = null;

  // Step 2 - Land Owner form
  landOwnerForm = { ownerName: '', ownershipType: '', contactEmail: '', contactPhone: '', address: '' };
  // Step 3 - Feasibility form
  feasibilityForm = { estimatedPurchasePrice: 0, estimatedDevelopmentCost: 0, expectedRevenue: 0, expectedProfit: 0 };
  // Step 4 - Due Diligence selection
  ddTypes = { legal: true, environmental: true, planning: true, utilities: false, valuation: false };

  readonly loading$ = this.store.select(selectOpportunityLoading);
  readonly serverError$ = this.store.select(selectOpportunityError);

  readonly steps = [
    { title: 'Opportunity Details', subtitle: 'Basic information' },
    { title: 'Land Information', subtitle: 'Location and size' },
    { title: 'Financial Overview', subtitle: 'Value and costs' },
    { title: 'Due Diligence', subtitle: 'Key checks' },
    { title: 'Review & Confirm', subtitle: 'Validate and create' }
  ];

  counties: string[] = [
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

  siteTypes: string[] = [
    'Greenfield', 'Brownfield', 'Mixed Use', 'Residential', 'Commercial',
    'Industrial', 'Agricultural', 'Infill'
  ];

  currentUses: string[] = [
    'Vacant Land', 'Agricultural', 'Residential', 'Commercial', 'Industrial',
    'Mixed Use', 'Woodland', 'Derelict', 'Parking', 'Other'
  ];

  tenureTypes: string[] = [
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

    // Get current user name from AuthService
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      this.currentUserName = `${currentUser.firstName ?? ''} ${currentUser.lastName ?? ''}`.trim() || 'Current User';
    }

    // Check if edit mode (route has :id param)
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.opportunityId = id;
      this.loadOpportunity(id);
    }

    // Listen for create success — advance to step 2 (not navigate away)
    this.actions$.pipe(
      ofType(OpportunityActions.createOpportunitySuccess),
      take(1),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((action) => {
      this.saved = true;
      this.createdOpportunityId = (action.opportunity as { id: string }).id;
      this.currentStep = 1; // Advance to Step 2 (Land Information)
    });

    // Listen for update success — in edit mode, advance to next step or navigate to detail
    this.actions$.pipe(
      ofType(OpportunityActions.updateOpportunitySuccess),
      take(1),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => {
      this.saved = true;
      if (this.currentStep === 0) {
        this.currentStep = 1; // Advance to step 2
      } else {
        this.router.navigate(['/land-acquisition/opportunities', this.opportunityId]);
      }
    });

    // Listen for failures
    this.actions$.pipe(
      ofType(OpportunityActions.createOpportunityFailure, OpportunityActions.updateOpportunityFailure),
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

    if (this.isEditMode && this.opportunityId) {
      const payload: IUpdateOpportunity = {
        name: v.name.trim(),
        location: v.location.trim(),
        county: v.county || null,
        landSize: v.landSize!,
        siteType: v.siteType || null,
        currentUse: v.currentUse || null,
        tenure: v.tenure || null,
        description: v.description?.trim() || null,
        source: v.source?.trim() || null,
        expectedAcquisition: v.expectedAcquisition || null,
        rowVersion: this.currentRowVersion
      };
      this.store.dispatch(OpportunityActions.updateOpportunity({ id: this.opportunityId, changes: payload }));
    } else {
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
  }

  saveAsDraft(): void {
    const v = this.form.getRawValue();
    localStorage.setItem('opportunity_draft', JSON.stringify(v));
    this.saved = true;
    this.router.navigate(['/land-acquisition/pipeline']);
  }

  /** Navigate to next step (for steps 2-4 that save related data) */
  nextStep(): void {
    const oppId = this.createdOpportunityId;
    if (!oppId) return;

    if (this.currentStep === 1) {
      // Step 2: Save Land Owner via LandOwnerService (correct path: /owners)
      if (this.landOwnerForm.ownerName) {
        // Check if we're updating an existing owner or creating a new one
        if (this.isEditMode && this.existingLandOwnerId) {
          // UPDATE existing land owner
          this.landOwnerService.update(oppId, this.existingLandOwnerId, {
            name: this.landOwnerForm.ownerName,
            ownershipType: (this.landOwnerForm.ownershipType || 'Freehold') as OwnershipType,
            contactDetails: this.landOwnerForm.contactEmail || 'Not provided',
            address: this.landOwnerForm.address || null
          }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: () => this.toast.showSuccess('Land owner updated.'),
            error: () => this.toast.showError('Failed to update land owner.')
          });
        } else {
          // CREATE new land owner
          this.landOwnerService.create(oppId, {
            name: this.landOwnerForm.ownerName,
            ownershipType: (this.landOwnerForm.ownershipType || 'Freehold') as OwnershipType,
            contactDetails: this.landOwnerForm.contactEmail || 'Not provided',
            address: this.landOwnerForm.address || null
          }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: () => this.toast.showSuccess('Land owner saved.'),
            error: () => this.toast.showError('Failed to save land owner. You can add it later from the detail page.')
          });
        }
      }
      this.currentStep = 2;
    } else if (this.currentStep === 2) {
      // Step 3: Save Feasibility via FeasibilityService
      if (this.feasibilityForm.estimatedPurchasePrice > 0) {
        this.feasibilityService.createOrUpdate(oppId, {
          estimatedLandCost: this.feasibilityForm.estimatedPurchasePrice,
          estimatedBuildCost: this.feasibilityForm.estimatedDevelopmentCost,
          professionalFees: 0,
          financeCosts: 0,
          expectedSalesRevenue: this.feasibilityForm.expectedRevenue,
          scenario: FeasibilityScenario.Expected
        }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
          next: () => this.toast.showSuccess('Financial overview saved.'),
          error: () => this.toast.showError('Failed to save financial data. You can add it later from the detail page.')
        });
      }
      this.currentStep = 3;
    } else if (this.currentStep === 3) {
      // Step 4: Create Due Diligence records via DueDiligenceService
      // In EDIT mode, DD checks already exist — don't create duplicates.
      // Users manage DD checks from the detail page's Due Diligence tab.
      if (!this.isEditMode) {
        const ddTypes: string[] = [];
        if (this.ddTypes.legal) ddTypes.push('Legal');
        if (this.ddTypes.environmental) ddTypes.push('Environmental');
        if (this.ddTypes.planning) ddTypes.push('Planning');
        if (this.ddTypes.utilities) ddTypes.push('Utilities');
        if (this.ddTypes.valuation) ddTypes.push('Valuation');

        ddTypes.forEach(type => {
          this.dueDiligenceService.create(oppId, {
            type: type as never,
            findings: null
          }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: () => {},
            error: () => this.toast.showError(`Failed to create ${type} due diligence check.`)
          });
        });
        if (ddTypes.length > 0) {
          this.toast.showSuccess(`${ddTypes.length} due diligence checks created.`);
        }
      }
      this.currentStep = 4;
    } else if (this.currentStep === 4) {
      // Step 5: Done — navigate to detail
      this.router.navigate(['/land-acquisition/opportunities', oppId]);
    }
  }

  skipStep(): void {
    if (this.currentStep < 4) {
      this.currentStep++;
    } else {
      this.router.navigate(['/land-acquisition/opportunities', this.createdOpportunityId]);
    }
  }

  getDdCount(): number {
    let count = 0;
    if (this.ddTypes.legal) count++;
    if (this.ddTypes.environmental) count++;
    if (this.ddTypes.planning) count++;
    if (this.ddTypes.utilities) count++;
    if (this.ddTypes.valuation) count++;
    return count;
  }

  goToStep(step: number): void {
    // In edit mode, allow free navigation between all steps
    if (this.isEditMode) {
      this.currentStep = step;
      return;
    }
    // In create mode, only allow navigating to completed steps or current
    if (step <= this.currentStep) {
      this.currentStep = step;
    }
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

  private loadOpportunity(id: string): void {
    this.opportunityService.getById(id).subscribe({
      next: (response) => {
        const opp = response.data ?? response;
        const data = opp as unknown as Record<string, unknown>;

        // Capture rowVersion for optimistic concurrency
        this.currentRowVersion = (data['rowVersion'] as string) ?? '';

        // Step 1 - Opportunity Details
        this.form.patchValue({
          name: (data['name'] as string) ?? '',
          source: (data['source'] as string) ?? '',
          location: (data['location'] as string) ?? '',
          county: (data['county'] as string) ?? '',
          landSize: (data['landSize'] as number) ?? null,
          siteType: (data['siteType'] as string) ?? '',
          currentUse: (data['currentUse'] as string) ?? '',
          tenure: (data['tenure'] as string) ?? '',
          description: (data['description'] as string) ?? '',
          expectedAcquisition: this.formatDateForInput((data['expectedAcquisition'] as string) ?? '')
        });

        // Ensure dropdown values are included in options lists (in case saved value isn't in the default list)
        this.ensureDropdownOption('county', (data['county'] as string) ?? '');
        this.ensureDropdownOption('siteType', (data['siteType'] as string) ?? '');
        this.ensureDropdownOption('currentUse', (data['currentUse'] as string) ?? '');
        this.ensureDropdownOption('tenure', (data['tenure'] as string) ?? '');

        // Step 2 - Land Owner
        const landOwner = data['landOwner'] as Record<string, unknown> | null;
        if (landOwner) {
          this.existingLandOwnerId = (landOwner['id'] as string) ?? null;
          this.landOwnerForm = {
            ownerName: (landOwner['name'] as string) ?? '',
            ownershipType: (landOwner['ownershipType'] as string) ?? '',
            contactEmail: (landOwner['contactDetails'] as string) ?? '',
            contactPhone: '',
            address: (landOwner['address'] as string) ?? ''
          };
        }

        // Step 3 - Feasibility
        const feasibility = data['feasibilityAssessment'] as Record<string, unknown> | null;
        if (feasibility) {
          this.feasibilityForm = {
            estimatedPurchasePrice: (feasibility['estimatedPurchasePrice'] as number) ?? 0,
            estimatedDevelopmentCost: (feasibility['estimatedDevelopmentCost'] as number) ?? 0,
            expectedRevenue: (feasibility['expectedRevenue'] as number) ?? 0,
            expectedProfit: (feasibility['expectedProfit'] as number) ?? 0
          };
        }

        // Step 4 - Due Diligence (check which types exist)
        const dds = data['dueDiligences'] as { type: string }[] | null;
        if (dds && dds.length > 0) {
          this.ddTypes = {
            legal: dds.some(d => d.type === 'Legal'),
            environmental: dds.some(d => d.type === 'Environmental'),
            planning: dds.some(d => d.type === 'Planning'),
            utilities: dds.some(d => d.type === 'Utilities'),
            valuation: dds.some(d => d.type === 'Valuation')
          };
        }

        // Store rowVersion for optimistic concurrency on updates
        this.currentRowVersion = (data['rowVersion'] as string) ?? '';

        // Set the created ID so step navigation works in edit mode
        this.createdOpportunityId = id;
      },
      error: () => {
        this.router.navigate(['/land-acquisition/pipeline']);
      }
    });
  }

  private formatDateForInput(dateStr: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    return d.toISOString().split('T')[0];
  }

  /**
   * Ensures a value exists in the dropdown options list.
   * If the value is not empty and not already in the list, adds it.
   * This handles cases where the backend has a value that wasn't in the original options.
   */
  private ensureDropdownOption(field: 'county' | 'siteType' | 'currentUse' | 'tenure', value: string): void {
    if (!value) return;
    switch (field) {
      case 'county':
        if (!this.counties.includes(value)) this.counties.push(value);
        break;
      case 'siteType':
        if (!this.siteTypes.includes(value)) this.siteTypes.push(value);
        break;
      case 'currentUse':
        if (!this.currentUses.includes(value)) this.currentUses.push(value);
        break;
      case 'tenure':
        if (!this.tenureTypes.includes(value)) this.tenureTypes.push(value);
        break;
    }
  }
}
