import {
  Component,
  ChangeDetectionStrategy,
  OnInit,
  inject,
  signal,
  computed,
  DestroyRef
} from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import { Actions, ofType } from '@ngrx/effects';
import { firstValueFrom, take } from 'rxjs';

import { OpportunityService } from '../../services/opportunity.service';
import {
  DueDiligenceService,
  OfferService,
  ContractService,
  DocumentService,
  FeasibilityService,
  LandOwnerService,
  AuditService
} from '../../services';
import { ConfirmDialogService } from '../../../../shared/design-system/services/confirm-dialog.service';
import { ToastService } from '@core/services/toast.service';
import { AuthService } from '@core/services/auth.service';
import { OpportunityStatusBadgeComponent } from '../../components/status-badge/status-badge.component';
import { ActivityTimelineComponent } from '../../components/activity-timeline/activity-timeline.component';
import { ApprovalPanelComponent, IApprovalDecision, IRejectionDecision } from '../../components/approval-panel/approval-panel.component';
import { CurrencyDisplayComponent } from '../../../../shared/design-system';
import { WithdrawalModalComponent } from '../../components/withdrawal-modal/withdrawal-modal.component';
import { ContractTransitionComponent } from '../../components/contract-transition/contract-transition.component';
import { AcquisitionTabComponent } from '../../components/acquisition-tab/acquisition-tab.component';
import { OfferFormModalComponent } from '../../components/offer-form-modal/offer-form-modal.component';
import { DueDiligenceFormModalComponent } from '../../components/dd-form-modal/dd-form-modal.component';
import { DocumentUploadModalComponent } from '../../components/document-upload-modal/document-upload-modal.component';
import { LandOwnerFormModalComponent } from '../../components/land-owner-form-modal/land-owner-form-modal.component';
import { FeasibilityFormModalComponent } from '../../components/feasibility-form-modal/feasibility-form-modal.component';
import { ApprovalRequestModalComponent } from '../../components/approval-request-modal/approval-request-modal.component';
import { ContractFormModalComponent } from '../../components/contract-form-modal/contract-form-modal.component';
import { OpportunityActions } from '../../store/opportunity/opportunity.actions';
import {
  IOpportunityDetail,
  OpportunityStatus,
  DueDiligenceStatus,
  DueDiligenceType,
  OfferStatus,
  DocumentType,
  FeasibilityScenario,
  OwnershipType,
  IAuditEntry
} from '../../models';
import { IRecentActivity } from '../../models/dashboard.model';

/**
 * Defines a contextual action button displayed in the header.
 */
interface IActionButton {
  readonly label: string;
  readonly icon: string;
  readonly cssClass: string;
  readonly action: () => void;
}

/**
 * Opportunity Detail container page.
 *
 * Displays full opportunity information organized into a header section
 * (Name, Location, LandSize, Status, Source) and tabbed content:
 * Overview, Due Diligence, Offers, Documents, Financials, Activity, Approvals.
 *
 * Includes a status progress indicator showing lifecycle position,
 * and contextual action buttons based on current status and user role.
 *
 * Loads opportunity detail from route param :id using OpportunityService.getById().
 *
 * Requirements: 15.1, 15.2, 15.3, 15.4, 15.5
 */
@Component({
  selector: 'app-opportunity-detail-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    DatePipe,
    DecimalPipe,
    OpportunityStatusBadgeComponent,
    ActivityTimelineComponent,
    ApprovalPanelComponent,
    CurrencyDisplayComponent,
    WithdrawalModalComponent,
    ContractTransitionComponent,
    AcquisitionTabComponent,
    OfferFormModalComponent,
    DueDiligenceFormModalComponent,
    DocumentUploadModalComponent,
    LandOwnerFormModalComponent,
    FeasibilityFormModalComponent,
    ApprovalRequestModalComponent,
    ContractFormModalComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Loading Skeleton -->
    <div *ngIf="loading()" class="p-6 space-y-6 animate-pulse" aria-busy="true" aria-label="Loading opportunity details">
      <!-- Header Skeleton -->
      <div class="flex flex-col gap-4">
        <div class="flex items-center gap-2">
          <div class="h-4 w-20 bg-base-300 rounded"></div>
        </div>
        <div class="card bg-base-100 shadow-sm border border-base-200">
          <div class="card-body p-6">
            <div class="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
              <div class="flex flex-col gap-3">
                <div class="h-7 w-64 bg-base-300 rounded"></div>
                <div class="flex flex-wrap gap-4">
                  <div class="h-4 w-40 bg-base-300 rounded"></div>
                  <div class="h-4 w-24 bg-base-300 rounded"></div>
                  <div class="h-4 w-32 bg-base-300 rounded"></div>
                </div>
              </div>
              <div class="flex gap-2">
                <div class="h-10 w-32 bg-base-300 rounded-lg"></div>
                <div class="h-10 w-32 bg-base-300 rounded-lg"></div>
              </div>
            </div>
            <div class="mt-4 h-8 w-full bg-base-300 rounded"></div>
          </div>
        </div>
      </div>

      <!-- Tabs Skeleton -->
      <div class="card bg-base-100 shadow-sm border border-base-200">
        <div class="card-body p-6">
          <div class="flex gap-4 border-b border-base-200 pb-2 mb-4">
            <div *ngFor="let i of [1,2,3,4,5,6,7]" class="h-8 w-24 bg-base-300 rounded"></div>
          </div>
          <div class="space-y-4">
            <div class="h-5 w-48 bg-base-300 rounded"></div>
            <div class="h-4 w-full bg-base-300 rounded"></div>
            <div class="h-4 w-3/4 bg-base-300 rounded"></div>
            <div class="h-4 w-1/2 bg-base-300 rounded"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Error State -->
    <div *ngIf="error()" class="p-6">
      <div class="card bg-base-100 shadow-sm border border-error/30">
        <div class="card-body p-6 flex flex-col items-center text-center gap-4">
          <span class="material-symbols-outlined text-5xl text-error">error</span>
          <h2 class="text-lg font-semibold text-base-content">Unable to load opportunity</h2>
          <p class="text-sm text-base-content/60">{{ error() }}</p>
          <button class="btn btn-primary btn-sm" (click)="loadOpportunity()">
            <span class="material-symbols-outlined text-sm mr-1">refresh</span>
            Retry
          </button>
        </div>
      </div>
    </div>

    <!-- Opportunity Detail Content -->
    <div *ngIf="!loading() && !error() && opportunity()" class="p-6 space-y-6">
      <!-- Breadcrumb Navigation -->
      <nav aria-label="Breadcrumb">
        <ol class="flex items-center gap-2 text-sm text-base-content/60">
          <li>
            <a routerLink="/land-acquisition/pipeline" class="hover:text-primary transition-colors">Pipeline</a>
          </li>
          <li><span class="material-symbols-outlined text-xs">chevron_right</span></li>
          <li class="text-base-content font-medium">{{ opportunity()!.name }}</li>
        </ol>
      </nav>

      <!-- Header Card -->
      <section aria-label="Opportunity Summary" style="animation: slide-up 0.4s ease-out 0.1s backwards">
        <div class="card bg-base-100 shadow-sm border border-base-200/80 overflow-hidden">
          <!-- Subtle top accent gradient -->
          <div class="h-1 bg-gradient-to-r from-primary via-secondary to-accent"></div>
          <div class="card-body p-6">
            <!-- Top Row: Title + Stats + Actions -->
            <div class="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
              <!-- Left: Title and Meta Bar -->
              <div class="flex flex-col gap-2">
                <div class="flex items-center gap-3 flex-wrap">
                  <h1 class="text-2xl font-bold text-base-content">{{ opportunity()!.name }}</h1>
                  <app-opportunity-status-badge [status]="opportunity()!.status"></app-opportunity-status-badge>
                </div>
                <!-- Meta Bar -->
                <div class="flex flex-wrap items-center gap-3 text-sm text-base-content/60">
                  <span class="flex items-center gap-1">
                    <span class="material-symbols-outlined text-sm">location_on</span>
                    {{ opportunity()!.location }}
                  </span>
                  <span class="text-base-content/30">•</span>
                  <span class="flex items-center gap-1">
                    <span class="material-symbols-outlined text-sm">straighten</span>
                    {{ opportunity()!.landSize | number:'1.2-2' }} acres
                  </span>
                  <span *ngIf="opportunity()!.source" class="text-base-content/30">•</span>
                  <span *ngIf="opportunity()!.source" class="flex items-center gap-1">
                    <span class="material-symbols-outlined text-sm">source</span>
                    {{ opportunity()!.source }}
                  </span>
                  <span class="text-base-content/30">•</span>
                  <span class="flex items-center gap-1">
                    <span class="material-symbols-outlined text-sm">calendar_today</span>
                    Created: {{ opportunity()!.createdAt | date:'dd MMM yyyy' }}
                  </span>
                </div>
              </div>

              <!-- Right: Action Buttons -->
              <div class="flex flex-wrap gap-2" *ngIf="actionButtons().length > 0">
                <button
                  *ngFor="let btn of actionButtons()"
                  class="btn btn-sm"
                  [ngClass]="btn.cssClass"
                  (click)="btn.action()">
                  <span class="material-symbols-outlined text-sm">{{ btn.icon }}</span>
                  {{ btn.label }}
                </button>
              </div>
            </div>

            <!-- Stats Bar -->
            <div class="mt-4 pt-4 border-t border-base-200">
              <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div class="flex flex-col gap-0.5">
                  <span class="text-[11px] text-base-content/50 uppercase font-semibold tracking-wide">Current Phase</span>
                  <span class="text-sm font-semibold text-base-content">{{ opportunity()!.status === 'InitialReview' ? 'Initial Review' : opportunity()!.status === 'DueDiligence' ? 'Due Diligence' : opportunity()!.status === 'OfferMade' ? 'Offer Made' : opportunity()!.status === 'UnderContract' ? 'Under Contract' : opportunity()!.status }}</span>
                </div>
                <div class="flex flex-col gap-0.5">
                  <span class="text-[11px] text-base-content/50 uppercase font-semibold tracking-wide">Time in Phase</span>
                  <span class="text-sm font-semibold text-base-content">{{ daysInCurrentPhase() }} days</span>
                </div>
                <div class="flex flex-col gap-0.5">
                  <span class="text-[11px] text-base-content/50 uppercase font-semibold tracking-wide">Total Pipeline Time</span>
                  <span class="text-sm font-semibold text-base-content">{{ totalPipelineDays() }} days</span>
                </div>
                <div class="flex flex-col gap-0.5">
                  <span class="text-[11px] text-base-content/50 uppercase font-semibold tracking-wide">Last Updated</span>
                  <span class="text-sm font-semibold text-base-content">{{ lastUpdatedDisplay() | date:'dd MMM yyyy' }}</span>
                </div>
              </div>
            </div>

            <!-- Enhanced Status Stepper -->
            <div class="mt-4 pt-4 border-t border-base-200">
              <div class="flex items-center justify-between gap-0 overflow-x-auto pb-2">
                <ng-container *ngFor="let stage of pipelineStages; let i = index; let last = last">
                  <!-- Stage Node -->
                  <div class="flex flex-col items-center min-w-[80px]">
                    <!-- Circle -->
                    <div
                      class="flex items-center justify-center rounded-full border-2 transition-all duration-300"
                      [ngClass]="{
                        'w-9 h-9 bg-success border-success text-success-content': i < currentStageIndex() || (i === currentStageIndex() && opportunity()!.status === 'Acquired'),
                        'w-10 h-10 bg-primary border-primary text-primary-content shadow-lg shadow-primary/30': i === currentStageIndex() && opportunity()!.status !== 'Acquired' && opportunity()!.status !== 'Withdrawn',
                        'w-8 h-8 bg-base-200 border-base-300 text-base-content/40': i > currentStageIndex()
                      }">
                      <span *ngIf="i < currentStageIndex() || (i === currentStageIndex() && opportunity()!.status === 'Acquired')" class="material-symbols-outlined text-sm">check</span>
                      <span *ngIf="i === currentStageIndex() && opportunity()!.status !== 'Acquired' && opportunity()!.status !== 'Withdrawn'" class="material-symbols-outlined text-sm animate-pulse">radio_button_checked</span>
                      <span *ngIf="i > currentStageIndex()" class="text-xs font-bold">{{ i + 1 }}</span>
                      <span *ngIf="i === currentStageIndex() && opportunity()!.status === 'Withdrawn'" class="material-symbols-outlined text-sm text-error">close</span>
                    </div>
                    <!-- Label -->
                    <span class="text-[11px] font-semibold mt-1.5 text-center whitespace-nowrap"
                      [ngClass]="{
                        'text-success': i < currentStageIndex(),
                        'text-primary': i === currentStageIndex() && opportunity()!.status !== 'Withdrawn',
                        'text-error': i === currentStageIndex() && opportunity()!.status === 'Withdrawn',
                        'text-base-content/40': i > currentStageIndex()
                      }">
                      {{ stage.label }}
                    </span>
                    <!-- Subtitle -->
                    <span class="text-[10px] text-base-content/40 text-center whitespace-nowrap">
                      <ng-container *ngIf="i < currentStageIndex()">Completed</ng-container>
                      <ng-container *ngIf="i === currentStageIndex() && opportunity()!.status !== 'Acquired' && opportunity()!.status !== 'Withdrawn'">In Progress</ng-container>
                      <ng-container *ngIf="i === currentStageIndex() && opportunity()!.status === 'Acquired'">Completed</ng-container>
                      <ng-container *ngIf="i === currentStageIndex() && opportunity()!.status === 'Withdrawn'">Withdrawn</ng-container>
                      <ng-container *ngIf="i > currentStageIndex()">{{ stage.subtitle }}</ng-container>
                    </span>
                  </div>
                  <!-- Connector Line -->
                  <div *ngIf="!last" class="flex-1 h-0.5 mx-1 min-w-[20px]"
                    [ngClass]="{
                      'bg-success': i < currentStageIndex(),
                      'bg-gradient-to-r from-primary to-base-300': i === currentStageIndex(),
                      'border-t-2 border-dashed border-base-300 h-0': i > currentStageIndex()
                    }">
                  </div>
                </ng-container>
              </div>
              <!-- Progress bar summary -->
              <div class="mt-3 flex items-center gap-3">
                <div class="flex-1 bg-base-200 rounded-full h-2 overflow-hidden">
                  <div class="bg-primary h-full rounded-full transition-all duration-500" [style.width.%]="pipelineCompletionPercent()"></div>
                </div>
                <span class="text-xs font-medium text-base-content/60 whitespace-nowrap">
                  {{ completedStagesCount() }} of 6 stages completed • {{ pipelineCompletionPercent() }}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Tabbed Content -->
      <section aria-label="Opportunity Details" style="animation: slide-up 0.4s ease-out 0.2s backwards">
        <div class="card bg-base-100 shadow-sm border border-base-200/80">
          <div class="card-body p-6">
            <!-- DaisyUI Tabs — Enhanced -->
            <div role="tablist" class="flex gap-1 border-b border-base-200 mb-6 -mx-2 px-2 overflow-x-auto">
              <button
                *ngFor="let tab of tabs()"
                role="tab"
                class="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-all duration-200
                       border-b-2 -mb-[2px] whitespace-nowrap"
                [class.border-primary]="activeTab() === tab.id"
                [class.text-primary]="activeTab() === tab.id"
                [class.bg-primary/5]="activeTab() === tab.id"
                [class.border-transparent]="activeTab() !== tab.id"
                [class.text-base-content/60]="activeTab() !== tab.id"
                [class.hover:text-base-content]="activeTab() !== tab.id"
                [class.hover:bg-base-200/50]="activeTab() !== tab.id"
                [attr.aria-selected]="activeTab() === tab.id"
                [attr.aria-controls]="'panel-' + tab.id"
                (click)="setActiveTab(tab.id)">
                <span class="material-symbols-outlined text-base">{{ tab.icon }}</span>
                {{ tab.label }}
              </button>
            </div>

            <!-- Tab Panels -->
            <!-- Overview Tab -->
            <div
              *ngIf="activeTab() === 'overview'"
              id="panel-overview"
              role="tabpanel"
              aria-labelledby="tab-overview"
              style="animation: fade-in 0.3s ease-out">

              <!-- Top 4 Cards Grid -->
              <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <!-- Card 1: Opportunity Details -->
                <div class="rounded-xl border border-base-200/80 bg-base-100 overflow-hidden">
                  <div class="px-5 py-3 bg-base-200/30 border-b border-base-200/80">
                    <h3 class="text-sm font-semibold text-base-content flex items-center gap-2">
                      <span class="material-symbols-outlined text-primary text-base">info</span>
                      Opportunity Details
                    </h3>
                  </div>
                  <div class="p-5">
                    <div class="grid grid-cols-2 gap-3">
                      <div class="flex flex-col gap-1 p-3 rounded-lg bg-base-200/30">
                        <span class="text-[11px] text-base-content/50 uppercase font-semibold tracking-wide">Name</span>
                        <span class="text-sm font-medium text-base-content">{{ opportunity()!.name }}</span>
                      </div>
                      <div class="flex flex-col gap-1 p-3 rounded-lg bg-base-200/30">
                        <span class="text-[11px] text-base-content/50 uppercase font-semibold tracking-wide">Location</span>
                        <span class="text-sm font-medium text-base-content">{{ opportunity()!.location }}</span>
                      </div>
                      <div class="flex flex-col gap-1 p-3 rounded-lg bg-base-200/30">
                        <span class="text-[11px] text-base-content/50 uppercase font-semibold tracking-wide">Land Size</span>
                        <span class="text-sm font-medium text-base-content">{{ opportunity()!.landSize | number:'1.2-2' }} acres</span>
                      </div>
                      <div class="flex flex-col gap-1 p-3 rounded-lg bg-base-200/30">
                        <span class="text-[11px] text-base-content/50 uppercase font-semibold tracking-wide">Status</span>
                        <app-opportunity-status-badge [status]="opportunity()!.status"></app-opportunity-status-badge>
                      </div>
                      <div class="flex flex-col gap-1 p-3 rounded-lg bg-base-200/30">
                        <span class="text-[11px] text-base-content/50 uppercase font-semibold tracking-wide">Source</span>
                        <span class="text-sm font-medium text-base-content">{{ opportunity()!.source ?? 'Not specified' }}</span>
                      </div>
                      <div class="flex flex-col gap-1 p-3 rounded-lg bg-base-200/30">
                        <span class="text-[11px] text-base-content/50 uppercase font-semibold tracking-wide">Target Acquisition</span>
                        <span class="text-sm font-medium text-base-content">
                          {{ opportunity()!.expectedAcquisition ? (opportunity()!.expectedAcquisition | date:'dd MMM yyyy') : 'Not set' }}
                        </span>
                      </div>
                      <div class="flex flex-col gap-1 p-3 rounded-lg bg-base-200/30">
                        <span class="text-[11px] text-base-content/50 uppercase font-semibold tracking-wide">Created</span>
                        <span class="text-sm font-medium text-base-content">{{ opportunity()!.createdAt | date:'dd MMM yyyy' }}</span>
                      </div>
                      <div *ngIf="opportunity()!.description" class="flex flex-col gap-1 p-3 rounded-lg bg-base-200/30 col-span-2">
                        <span class="text-[11px] text-base-content/50 uppercase font-semibold tracking-wide">Description</span>
                        <span class="text-sm font-medium text-base-content">{{ opportunity()!.description }}</span>
                      </div>
                      <div class="flex flex-col gap-1 p-3 rounded-lg bg-error/5 border border-error/10" *ngIf="opportunity()!.withdrawalReason">
                        <span class="text-[11px] text-error/70 uppercase font-semibold tracking-wide">Withdrawal Reason</span>
                        <span class="text-sm font-medium text-error">{{ opportunity()!.withdrawalReason }}</span>
                      </div>
                    </div>
                    <div class="mt-4 pt-3 border-t border-base-200/60">
                      <a routerLink="." fragment="details" class="text-xs font-medium text-primary hover:text-primary/80 flex items-center gap-1 cursor-pointer">
                        View Full Details
                        <span class="material-symbols-outlined text-xs">arrow_forward</span>
                      </a>
                    </div>
                  </div>
                </div>

                <!-- Card 2: Land Owner -->
                <div class="rounded-xl border border-base-200/80 bg-base-100 overflow-hidden">
                  <div class="px-5 py-3 bg-base-200/30 border-b border-base-200/80">
                    <h3 class="text-sm font-semibold text-base-content flex items-center gap-2">
                      <span class="material-symbols-outlined text-primary text-base">person</span>
                      Land Owner
                    </h3>
                  </div>
                  <div class="p-5">
                    <!-- Read-only display when NOT editing -->
                    <div *ngIf="opportunity()!.landOwner as owner; else noOwner">
                      <div *ngIf="!showOwnerForm()">
                        <div class="grid grid-cols-2 gap-3">
                          <div class="flex flex-col gap-1 p-3 rounded-lg bg-base-200/30">
                            <span class="text-[11px] text-base-content/50 uppercase font-semibold tracking-wide">Owner Name</span>
                            <span class="text-sm font-medium text-base-content">{{ owner.name }}</span>
                          </div>
                          <div class="flex flex-col gap-1 p-3 rounded-lg bg-base-200/30">
                            <span class="text-[11px] text-base-content/50 uppercase font-semibold tracking-wide">Ownership Type</span>
                            <span class="text-sm font-medium text-base-content">{{ owner.ownershipType }}</span>
                          </div>
                          <div class="flex flex-col gap-1 p-3 rounded-lg bg-base-200/30 col-span-2">
                            <span class="text-[11px] text-base-content/50 uppercase font-semibold tracking-wide">Contact Details</span>
                            <span class="text-sm font-medium text-base-content">{{ owner.contactDetails }}</span>
                          </div>
                          <div *ngIf="owner.address" class="flex flex-col gap-1 p-3 rounded-lg bg-base-200/30 col-span-2">
                            <span class="text-[11px] text-base-content/50 uppercase font-semibold tracking-wide">Address</span>
                            <span class="text-sm font-medium text-base-content">{{ owner.address }}</span>
                          </div>
                        </div>
                        <div class="mt-4 pt-3 border-t border-base-200/60 flex items-center justify-between">
                          <span class="text-xs font-medium text-base-content/50">Owner Profile</span>
                          <div class="flex gap-2">
                            <button class="btn btn-ghost btn-xs gap-1" (click)="openOwnerModal(true)">
                              <span class="material-symbols-outlined text-sm">edit</span>
                              Edit Owner
                            </button>
                            <button class="btn btn-ghost btn-xs text-error gap-1" (click)="deleteOwner()">
                              <span class="material-symbols-outlined text-sm">delete</span>
                              Delete Owner
                            </button>
                          </div>
                        </div>
                      </div>

                      <!-- Inline Edit Form (shown when editing existing owner) -->
                      <div *ngIf="showOwnerForm() && editingOwner()" style="animation: scale-in 0.2s ease-out">
                        <h4 class="text-sm font-semibold text-base-content mb-3">Edit Land Owner</h4>
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div class="form-control w-full">
                            <label class="label"><span class="label-text text-xs font-medium">Name *</span></label>
                            <input type="text" class="input input-bordered input-sm w-full"
                                   [(ngModel)]="ownerForm.name"
                                   placeholder="2-200 characters"
                                   minlength="2" maxlength="200" />
                            <label class="label" *ngIf="ownerForm.name.length > 0 && ownerForm.name.trim().length < 2">
                              <span class="label-text-alt text-error">Name must be at least 2 characters</span>
                            </label>
                          </div>
                          <div class="form-control w-full">
                            <label class="label"><span class="label-text text-xs font-medium">Ownership Type *</span></label>
                            <select class="select select-bordered select-sm w-full" [(ngModel)]="ownerForm.ownershipType">
                              <option value="Freehold">Freehold</option>
                              <option value="Leasehold">Leasehold</option>
                            </select>
                          </div>
                          <div class="form-control w-full sm:col-span-2">
                            <label class="label"><span class="label-text text-xs font-medium">Contact Details *</span></label>
                            <textarea class="textarea textarea-bordered textarea-sm w-full" rows="2"
                                      [(ngModel)]="ownerForm.contactDetails"
                                      placeholder="5-500 characters"
                                      minlength="5" maxlength="500"></textarea>
                            <label class="label" *ngIf="ownerForm.contactDetails.length > 0 && ownerForm.contactDetails.trim().length < 5">
                              <span class="label-text-alt text-error">Contact details must be at least 5 characters</span>
                            </label>
                          </div>
                          <div class="form-control w-full sm:col-span-2">
                            <label class="label"><span class="label-text text-xs font-medium">Address (optional)</span></label>
                            <input type="text" class="input input-bordered input-sm w-full"
                                   [(ngModel)]="ownerForm.address"
                                   placeholder="Enter address" />
                          </div>
                        </div>
                        <div class="flex justify-end gap-2 pt-3">
                          <button class="btn btn-ghost btn-sm" (click)="cancelOwnerForm()" [disabled]="ownerFormSaving()">Cancel</button>
                          <button class="btn btn-primary btn-sm" (click)="saveOwner()" [disabled]="!isOwnerFormValid() || ownerFormSaving()">
                            <span *ngIf="ownerFormSaving()" class="loading loading-spinner loading-xs"></span>
                            <span class="material-symbols-outlined text-sm" *ngIf="!ownerFormSaving()">save</span>
                            Update Owner
                          </button>
                        </div>
                      </div>
                    </div>

                    <!-- No Owner state + Add Owner form -->
                    <ng-template #noOwner>
                      <div *ngIf="!showOwnerForm()">
                        <div class="flex flex-col items-center justify-center py-8 text-base-content/40">
                          <span class="material-symbols-outlined text-4xl mb-2">person_off</span>
                          <p class="text-sm font-medium">No owner linked yet</p>
                          <p class="text-xs mt-1 mb-3">Owner details will appear here once captured.</p>
                          <button class="btn btn-primary btn-sm gap-1" (click)="openOwnerModal(false)">
                            <span class="material-symbols-outlined text-sm">person_add</span>
                            Add Owner
                          </button>
                        </div>
                      </div>

                      <!-- Create Form (shown when adding new owner) -->
                      <div *ngIf="showOwnerForm() && !editingOwner()" style="animation: scale-in 0.2s ease-out">
                        <h4 class="text-sm font-semibold text-base-content mb-3">Add Land Owner</h4>
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div class="form-control w-full">
                            <label class="label"><span class="label-text text-xs font-medium">Name *</span></label>
                            <input type="text" class="input input-bordered input-sm w-full"
                                   [(ngModel)]="ownerForm.name"
                                   placeholder="2-200 characters"
                                   minlength="2" maxlength="200" />
                            <label class="label" *ngIf="ownerForm.name.length > 0 && ownerForm.name.trim().length < 2">
                              <span class="label-text-alt text-error">Name must be at least 2 characters</span>
                            </label>
                          </div>
                          <div class="form-control w-full">
                            <label class="label"><span class="label-text text-xs font-medium">Ownership Type *</span></label>
                            <select class="select select-bordered select-sm w-full" [(ngModel)]="ownerForm.ownershipType">
                              <option value="Freehold">Freehold</option>
                              <option value="Leasehold">Leasehold</option>
                            </select>
                          </div>
                          <div class="form-control w-full sm:col-span-2">
                            <label class="label"><span class="label-text text-xs font-medium">Contact Details *</span></label>
                            <textarea class="textarea textarea-bordered textarea-sm w-full" rows="2"
                                      [(ngModel)]="ownerForm.contactDetails"
                                      placeholder="5-500 characters"
                                      minlength="5" maxlength="500"></textarea>
                            <label class="label" *ngIf="ownerForm.contactDetails.length > 0 && ownerForm.contactDetails.trim().length < 5">
                              <span class="label-text-alt text-error">Contact details must be at least 5 characters</span>
                            </label>
                          </div>
                          <div class="form-control w-full sm:col-span-2">
                            <label class="label"><span class="label-text text-xs font-medium">Address (optional)</span></label>
                            <input type="text" class="input input-bordered input-sm w-full"
                                   [(ngModel)]="ownerForm.address"
                                   placeholder="Enter address" />
                          </div>
                        </div>
                        <div class="flex justify-end gap-2 pt-3">
                          <button class="btn btn-ghost btn-sm" (click)="cancelOwnerForm()" [disabled]="ownerFormSaving()">Cancel</button>
                          <button class="btn btn-primary btn-sm" (click)="saveOwner()" [disabled]="!isOwnerFormValid() || ownerFormSaving()">
                            <span *ngIf="ownerFormSaving()" class="loading loading-spinner loading-xs"></span>
                            <span class="material-symbols-outlined text-sm" *ngIf="!ownerFormSaving()">person_add</span>
                            Add Owner
                          </button>
                        </div>
                      </div>
                    </ng-template>
                  </div>
                </div>

                <!-- Card 3: Pipeline Health -->
                <div class="rounded-xl border border-base-200/80 bg-base-100 overflow-hidden">
                  <div class="px-5 py-3 bg-base-200/30 border-b border-base-200/80">
                    <h3 class="text-sm font-semibold text-base-content flex items-center gap-2">
                      <span class="material-symbols-outlined text-primary text-base">health_and_safety</span>
                      Pipeline Health
                    </h3>
                  </div>
                  <div class="p-5">
                    <div class="flex items-center gap-4 mb-4">
                      <div class="flex flex-col items-center">
                        <span class="text-3xl font-bold" [ngClass]="pipelineHealthScore().cssClass">{{ pipelineHealthScore().overall }}</span>
                        <span class="text-[11px] text-base-content/50 uppercase font-semibold">Score</span>
                      </div>
                      <div class="flex-1">
                        <span class="text-sm font-semibold" [ngClass]="pipelineHealthScore().cssClass">{{ pipelineHealthScore().label }}</span>
                        <p class="text-xs text-base-content/50 mt-0.5">Based on legal, commercial, financial &amp; risk factors</p>
                      </div>
                    </div>
                    <div class="space-y-2">
                      <div class="flex items-center justify-between text-xs">
                        <span class="text-base-content/60">Legal &amp; Compliance</span>
                        <span class="font-medium">{{ pipelineHealthScore().legal }}%</span>
                      </div>
                      <div class="w-full bg-base-200 rounded-full h-1.5">
                        <div class="bg-info h-1.5 rounded-full transition-all" [style.width.%]="pipelineHealthScore().legal"></div>
                      </div>
                      <div class="flex items-center justify-between text-xs">
                        <span class="text-base-content/60">Commercial Viability</span>
                        <span class="font-medium">{{ pipelineHealthScore().commercial }}%</span>
                      </div>
                      <div class="w-full bg-base-200 rounded-full h-1.5">
                        <div class="bg-secondary h-1.5 rounded-full transition-all" [style.width.%]="pipelineHealthScore().commercial"></div>
                      </div>
                      <div class="flex items-center justify-between text-xs">
                        <span class="text-base-content/60">Financial Feasibility</span>
                        <span class="font-medium">{{ pipelineHealthScore().financial }}%</span>
                      </div>
                      <div class="w-full bg-base-200 rounded-full h-1.5">
                        <div class="bg-accent h-1.5 rounded-full transition-all" [style.width.%]="pipelineHealthScore().financial"></div>
                      </div>
                      <div class="flex items-center justify-between text-xs">
                        <span class="text-base-content/60">Risk &amp; Issues</span>
                        <span class="font-medium">{{ pipelineHealthScore().risk }}%</span>
                      </div>
                      <div class="w-full bg-base-200 rounded-full h-1.5">
                        <div class="bg-warning h-1.5 rounded-full transition-all" [style.width.%]="pipelineHealthScore().risk"></div>
                      </div>
                    </div>
                    <div class="mt-4 pt-3 border-t border-base-200/60">
                      <a class="text-xs font-medium text-primary hover:text-primary/80 flex items-center gap-1 cursor-pointer">
                        View Analytics Dashboard
                        <span class="material-symbols-outlined text-xs">arrow_forward</span>
                      </a>
                    </div>
                  </div>
                </div>

                <!-- Card 4: Key Information -->
                <div class="rounded-xl border border-base-200/80 bg-base-100 overflow-hidden">
                  <div class="px-5 py-3 bg-base-200/30 border-b border-base-200/80">
                    <h3 class="text-sm font-semibold text-base-content flex items-center gap-2">
                      <span class="material-symbols-outlined text-primary text-base">assignment</span>
                      Key Information
                    </h3>
                  </div>
                  <div class="p-5">
                    <div class="space-y-3">
                      <div class="flex items-center justify-between p-3 rounded-lg bg-base-200/30">
                        <div class="flex flex-col gap-0.5">
                          <span class="text-[11px] text-base-content/50 uppercase font-semibold tracking-wide">Next Milestone</span>
                          <span class="text-sm font-medium text-base-content">{{ nextMilestone() }}</span>
                        </div>
                        <span class="material-symbols-outlined text-primary text-lg">flag</span>
                      </div>
                      <div class="flex items-center justify-between p-3 rounded-lg bg-base-200/30">
                        <div class="flex flex-col gap-0.5">
                          <span class="text-[11px] text-base-content/50 uppercase font-semibold tracking-wide">Key Contact</span>
                          <span class="text-sm font-medium text-base-content">{{ opportunity()!.createdBy || 'System' }}</span>
                        </div>
                        <span class="material-symbols-outlined text-primary text-lg">contact_phone</span>
                      </div>
                      <div class="flex items-center justify-between p-3 rounded-lg bg-base-200/30">
                        <div class="flex flex-col gap-0.5">
                          <span class="text-[11px] text-base-content/50 uppercase font-semibold tracking-wide">Related Tasks</span>
                          <span class="text-sm font-medium text-base-content">{{ relatedTasksCount() }} items</span>
                        </div>
                        <span class="material-symbols-outlined text-primary text-lg">task</span>
                      </div>
                      <div class="flex items-center justify-between p-3 rounded-lg" [ngClass]="openIssuesCount() > 0 ? 'bg-warning/10 border border-warning/20' : 'bg-base-200/30'">
                        <div class="flex flex-col gap-0.5">
                          <span class="text-[11px] text-base-content/50 uppercase font-semibold tracking-wide">Open Issues</span>
                          <span class="text-sm font-medium" [ngClass]="openIssuesCount() > 0 ? 'text-warning' : 'text-base-content'">{{ openIssuesCount() }} pending</span>
                        </div>
                        <span class="material-symbols-outlined text-lg" [ngClass]="openIssuesCount() > 0 ? 'text-warning' : 'text-primary'">report</span>
                      </div>
                    </div>
                    <div class="mt-4 pt-3 border-t border-base-200/60">
                      <a (click)="setActiveTab('due-diligence')" class="text-xs font-medium text-primary hover:text-primary/80 flex items-center gap-1 cursor-pointer">
                        View All Tasks &amp; Issues
                        <span class="material-symbols-outlined text-xs">arrow_forward</span>
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Bottom Row: Recent Items -->
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <!-- Recent Activity -->
                <div class="rounded-xl border border-base-200/80 bg-base-100 overflow-hidden">
                  <div class="px-4 py-2.5 bg-base-200/30 border-b border-base-200/80">
                    <h4 class="text-xs font-semibold text-base-content flex items-center gap-1.5">
                      <span class="material-symbols-outlined text-sm text-primary">history</span>
                      Recent Activity
                    </h4>
                  </div>
                  <div class="p-4">
                    <div *ngIf="activityData().length > 0; else noRecentActivity">
                      <div class="flex items-start gap-2">
                        <span class="material-symbols-outlined text-sm text-base-content/40 mt-0.5">circle</span>
                        <div class="flex-1 min-w-0">
                          <p class="text-xs font-medium text-base-content truncate">{{ activityData()[0].newStatus }}</p>
                          <p class="text-[11px] text-base-content/50 mt-0.5">{{ activityData()[0].changedBy }} • {{ activityData()[0].changedAt | date:'dd MMM yyyy' }}</p>
                        </div>
                      </div>
                    </div>
                    <ng-template #noRecentActivity>
                      <p class="text-xs text-base-content/40 text-center py-3">No recent activity</p>
                    </ng-template>
                  </div>
                </div>

                <!-- Recent Document -->
                <div class="rounded-xl border border-base-200/80 bg-base-100 overflow-hidden">
                  <div class="px-4 py-2.5 bg-base-200/30 border-b border-base-200/80">
                    <h4 class="text-xs font-semibold text-base-content flex items-center gap-1.5">
                      <span class="material-symbols-outlined text-sm text-primary">description</span>
                      Recent Document
                    </h4>
                  </div>
                  <div class="p-4">
                    <div *ngIf="opportunity()!.documents.length > 0; else noRecentDoc">
                      <div class="flex items-start gap-2">
                        <span class="material-symbols-outlined text-sm text-base-content/40 mt-0.5">attach_file</span>
                        <div class="flex-1 min-w-0">
                          <p class="text-xs font-medium text-base-content truncate">{{ opportunity()!.documents[opportunity()!.documents.length - 1].fileName }}</p>
                          <p class="text-[11px] text-base-content/50 mt-0.5">{{ opportunity()!.documents[opportunity()!.documents.length - 1].uploadedAt | date:'dd MMM yyyy' }}</p>
                        </div>
                      </div>
                    </div>
                    <ng-template #noRecentDoc>
                      <p class="text-xs text-base-content/40 text-center py-3">No documents uploaded</p>
                    </ng-template>
                  </div>
                </div>

                <!-- Recent Approval -->
                <div class="rounded-xl border border-base-200/80 bg-base-100 overflow-hidden">
                  <div class="px-4 py-2.5 bg-base-200/30 border-b border-base-200/80">
                    <h4 class="text-xs font-semibold text-base-content flex items-center gap-1.5">
                      <span class="material-symbols-outlined text-sm text-primary">approval</span>
                      Recent Approval
                    </h4>
                  </div>
                  <div class="p-4">
                    <div *ngIf="opportunity()!.approvalRequests && opportunity()!.approvalRequests.length > 0; else noRecentApproval">
                      <div class="flex items-start gap-2">
                        <span class="material-symbols-outlined text-sm text-base-content/40 mt-0.5">verified</span>
                        <div class="flex-1 min-w-0">
                          <p class="text-xs font-medium text-base-content truncate">£{{ opportunity()!.approvalRequests[opportunity()!.approvalRequests.length - 1].requestedAmount | number:'1.0-0' }} — {{ opportunity()!.approvalRequests[opportunity()!.approvalRequests.length - 1].status }}</p>
                          <p class="text-[11px] text-base-content/50 mt-0.5">{{ opportunity()!.approvalRequests[opportunity()!.approvalRequests.length - 1].approvalTimestamp | date:'dd MMM yyyy' }}</p>
                        </div>
                      </div>
                    </div>
                    <ng-template #noRecentApproval>
                      <p class="text-xs text-base-content/40 text-center py-3">No approval requests</p>
                    </ng-template>
                  </div>
                </div>
              </div>
            </div>

            <!-- Due Diligence Tab -->
            <div
              *ngIf="activeTab() === 'due-diligence'"
              id="panel-due-diligence"
              role="tabpanel"
              aria-labelledby="tab-due-diligence">
              <!-- Add Check Button -->
              <div class="flex justify-end mb-4">
                <button class="btn btn-primary btn-sm gap-1" (click)="showDdModal.set(true)" *ngIf="!showDdForm()">
                  <span class="material-symbols-outlined text-sm">add</span>
                  Add Check
                  <span class="badge badge-ghost badge-xs ml-2">Legal Officer</span>
                </button>
              </div>

              <!-- Inline Due Diligence Form -->
              <div *ngIf="showDdForm()" class="card bg-base-200/30 border border-base-200 mb-4" style="animation: scale-in 0.2s ease-out">
                <div class="card-body p-4 space-y-3">
                  <h4 class="text-sm font-semibold text-base-content">
                    {{ editingDdId() ? 'Update Due Diligence Check' : 'New Due Diligence Check' }}
                    <span class="badge badge-ghost badge-xs ml-2">Legal Officer</span>
                  </h4>
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div class="form-control w-full">
                      <label class="label"><span class="label-text text-xs font-medium">Type</span></label>
                      <select class="select select-bordered select-sm w-full" [(ngModel)]="ddForm.type" [disabled]="!!editingDdId()">
                        <option value="Legal">Legal</option>
                        <option value="Environmental">Environmental</option>
                        <option value="Planning">Planning</option>
                        <option value="Utilities">Utilities</option>
                        <option value="Valuation">Valuation</option>
                      </select>
                    </div>
                    <div class="form-control w-full">
                      <label class="label"><span class="label-text text-xs font-medium">Status</span></label>
                      <select class="select select-bordered select-sm w-full" [(ngModel)]="ddForm.status">
                        <option value="Pending">Pending</option>
                        <option value="InProgress">In Progress</option>
                        <option value="Completed">Completed</option>
                        <option value="Failed">Failed</option>
                      </select>
                    </div>
                    <div class="form-control w-full sm:col-span-2">
                      <label class="label"><span class="label-text text-xs font-medium">Findings</span></label>
                      <textarea class="textarea textarea-bordered textarea-sm w-full" rows="2" [(ngModel)]="ddForm.findings" placeholder="Enter findings (required if Completed or Failed)"></textarea>
                    </div>
                    <div class="form-control w-full">
                      <label class="label"><span class="label-text text-xs font-medium">Report Date (optional)</span></label>
                      <input type="date" class="input input-bordered input-sm w-full" [(ngModel)]="ddForm.reportDate" />
                    </div>
                  </div>
                  <div class="flex justify-end gap-2 pt-2">
                    <button class="btn btn-ghost btn-sm" (click)="cancelDdForm()">Cancel</button>
                    <button class="btn btn-primary btn-sm" (click)="saveDueDiligence()">
                      <span class="material-symbols-outlined text-sm">save</span>
                      {{ editingDdId() ? 'Update Check' : 'Save Check' }}
                    </button>
                  </div>
                </div>
              </div>

              <div *ngIf="opportunity()!.dueDiligences.length > 0; else noDueDiligence">
                <div class="overflow-x-auto">
                  <table class="table table-sm w-full">
                    <thead>
                      <tr>
                        <th>Type</th>
                        <th>Status</th>
                        <th>Findings</th>
                        <th>Report Date</th>
                        <th>Created</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr *ngFor="let dd of opportunity()!.dueDiligences">
                        <td>
                          <span class="badge badge-sm badge-outline">{{ formatDdType(dd.type) }}</span>
                        </td>
                        <td>
                          <span class="badge badge-sm" [ngClass]="getDdStatusClass(dd.status)">
                            {{ formatDdStatus(dd.status) }}
                          </span>
                        </td>
                        <td class="max-w-xs truncate">{{ dd.findings ?? '—' }}</td>
                        <td>{{ dd.reportDate ? (dd.reportDate | date:'dd MMM yyyy') : '—' }}</td>
                        <td>{{ dd.createdAt | date:'dd MMM yyyy' }}</td>
                        <td>
                          <button class="btn btn-ghost btn-xs" (click)="editDdCheck(dd)" title="Update Status">
                            <span class="material-symbols-outlined text-sm">edit</span>
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              <ng-template #noDueDiligence>
                <div class="flex flex-col items-center justify-center py-8 text-base-content/50">
                  <span class="material-symbols-outlined text-4xl mb-2">fact_check</span>
                  <p class="text-sm font-medium">No due diligence checks recorded</p>
                  <p class="text-xs mt-1">Due diligence checks will appear here once initiated by the legal team.</p>
                </div>
              </ng-template>
            </div>

            <!-- Offers Tab -->
            <div
              *ngIf="activeTab() === 'offers'"
              id="panel-offers"
              role="tabpanel"
              aria-labelledby="tab-offers">
              <!-- Submit Offer Button -->
              <div class="flex justify-end mb-4">
                <button class="btn btn-primary btn-sm gap-1" (click)="showOfferModal.set(true)" *ngIf="!showOfferForm()">
                  <span class="material-symbols-outlined text-sm">add</span>
                  Submit Offer
                  <span class="badge badge-ghost badge-xs ml-2">Acquisition Manager</span>
                </button>
              </div>

              <!-- Inline Offer Form -->
              <div *ngIf="showOfferForm()" class="card bg-base-200/30 border border-base-200 mb-4" style="animation: scale-in 0.2s ease-out">
                <div class="card-body p-4 space-y-3">
                  <h4 class="text-sm font-semibold text-base-content">
                    Submit New Offer
                    <span class="badge badge-ghost badge-xs ml-2">Acquisition Manager</span>
                  </h4>
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div class="form-control w-full">
                      <label class="label"><span class="label-text text-xs font-medium">Amount (£)</span></label>
                      <app-currency mode="edit" [(ngModel)]="offerForm.amount"></app-currency>
                    </div>
                    <div class="form-control w-full">
                      <label class="label"><span class="label-text text-xs font-medium">Currency</span></label>
                      <input type="text" class="input input-bordered input-sm w-full" value="GBP" readonly disabled />
                    </div>
                    <div class="form-control w-full">
                      <label class="label"><span class="label-text text-xs font-medium">Valid Until</span></label>
                      <input type="date" class="input input-bordered input-sm w-full" [(ngModel)]="offerForm.validUntil" />
                    </div>
                  </div>
                  <div class="flex justify-end gap-2 pt-2">
                    <button class="btn btn-ghost btn-sm" (click)="cancelOfferForm()">Cancel</button>
                    <button class="btn btn-primary btn-sm" (click)="saveOffer()">
                      <span class="material-symbols-outlined text-sm">send</span>
                      Submit Offer
                    </button>
                  </div>
                </div>
              </div>

              <div *ngIf="opportunity()!.offers.length > 0; else noOffers">
                <div class="overflow-x-auto">
                  <table class="table table-sm w-full">
                    <thead>
                      <tr>
                        <th>Amount</th>
                        <th>Currency</th>
                        <th>Status</th>
                        <th>Offer Date</th>
                        <th>Valid Until</th>
                        <th>Counter Amount</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr *ngFor="let offer of opportunity()!.offers">
                        <td class="font-medium">{{ offer.amount | number:'1.2-2' }}</td>
                        <td>{{ offer.currency }}</td>
                        <td>
                          <span class="badge badge-sm" [ngClass]="getOfferStatusClass(offer.status)">
                            {{ formatOfferStatus(offer.status) }}
                          </span>
                        </td>
                        <td>{{ offer.offerDate | date:'dd MMM yyyy' }}</td>
                        <td>{{ offer.validUntil | date:'dd MMM yyyy' }}</td>
                        <td>{{ offer.counterOfferAmount != null ? (offer.counterOfferAmount | number:'1.2-2') : '—' }}</td>
                        <td>
                          <div *ngIf="offer.status === 'UnderReview'" class="flex flex-col gap-1">
                            <div class="flex gap-1">
                              <button class="btn btn-success btn-xs gap-0.5" (click)="acceptOffer(offer.id)" title="Accept this offer">
                                <span class="material-symbols-outlined text-xs">check</span>
                                Accept
                              </button>
                              <button class="btn btn-error btn-xs btn-outline gap-0.5" (click)="rejectOffer(offer.id)" title="Reject this offer">
                                <span class="material-symbols-outlined text-xs">close</span>
                                Reject
                              </button>
                              <button class="btn btn-warning btn-xs gap-0.5" (click)="counteringOfferId.set(offer.id)" title="Counter Offer">
                                <span class="material-symbols-outlined text-xs">swap_horiz</span>
                                Counter
                              </button>
                            </div>
                            <!-- Inline Counter Offer Form (Gap 4) -->
                            <div *ngIf="counteringOfferId() === offer.id" class="flex items-center gap-1 mt-1">
                              <input type="number" class="input input-bordered input-xs w-28" [(ngModel)]="counterAmount" placeholder="Amount (£)" />
                              <button class="btn btn-warning btn-xs" (click)="submitCounterOffer(offer.id)">Send</button>
                              <button class="btn btn-ghost btn-xs" (click)="counteringOfferId.set(null)">✕</button>
                            </div>
                          </div>
                          <span *ngIf="offer.status !== 'UnderReview'" class="text-xs text-base-content/40">—</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              <ng-template #noOffers>
                <div class="flex flex-col items-center justify-center py-8 text-base-content/50">
                  <span class="material-symbols-outlined text-4xl mb-2">request_quote</span>
                  <p class="text-sm font-medium">No offers submitted</p>
                  <p class="text-xs mt-1">Offers will appear here once submitted against this opportunity.</p>
                </div>
              </ng-template>
            </div>

            <!-- Contracts Tab -->
            <div
              *ngIf="activeTab() === 'contracts'"
              id="panel-contracts"
              role="tabpanel"
              aria-labelledby="tab-contracts">
              <!-- Create Contract Button -->
              <div class="flex justify-between items-center mb-4">
                <p class="text-sm text-base-content/60">Manage legal contracts for this acquisition.</p>
                <button class="btn btn-primary btn-sm gap-1.5" (click)="showContractModal.set(true)"
                        *ngIf="!showCreateContractForm && !opportunity()!.contract">
                  <span class="material-symbols-outlined text-sm">add</span> Create Contract
                </button>
              </div>

              <!-- Existing Contract — use ContractTransitionComponent -->
              <app-contract-transition
                *ngIf="opportunity()!.contract as contract"
                [contract]="contract"
                [opportunityId]="opportunity()!.id"
                (statusChanged)="loadOpportunity()">
              </app-contract-transition>

              <!-- Create Contract Form -->
              <div *ngIf="showCreateContractForm && !opportunity()!.contract" class="card bg-base-100 border border-base-200 shadow-sm">
                <div class="card-body p-5 space-y-4">
                  <h3 class="text-base font-bold text-base-content">Create Contract</h3>
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label class="text-xs font-medium text-base-content mb-1 block">Solicitor Name</label>
                      <input type="text" class="input input-bordered input-sm w-full" [(ngModel)]="contractForm.solicitorName" placeholder="e.g., John Smith" />
                    </div>
                    <div>
                      <label class="text-xs font-medium text-base-content mb-1 block">Solicitor Firm</label>
                      <input type="text" class="input input-bordered input-sm w-full" [(ngModel)]="contractForm.solicitorFirm" placeholder="e.g., Smith & Associates" />
                    </div>
                    <div>
                      <label class="text-xs font-medium text-base-content mb-1 block">Contact Details</label>
                      <input type="text" class="input input-bordered input-sm w-full" [(ngModel)]="contractForm.solicitorContact" placeholder="e.g., 020 1234 5678" />
                    </div>
                    <div>
                      <label class="text-xs font-medium text-base-content mb-1 block">Deposit Amount (£)</label>
                      <input type="number" class="input input-bordered input-sm w-full" [(ngModel)]="contractForm.depositAmount" placeholder="e.g., 50000" />
                    </div>
                  </div>
                  <div class="flex gap-2 justify-end pt-2">
                    <button class="btn btn-ghost btn-sm" (click)="showCreateContractForm = false">Cancel</button>
                    <button class="btn btn-primary btn-sm" (click)="createContract()">Create Contract</button>
                  </div>
                </div>
              </div>

              <!-- No Contract -->
              <div *ngIf="!opportunity()!.contract && !showCreateContractForm" class="flex flex-col items-center justify-center py-8 text-base-content/50">
                <span class="material-symbols-outlined text-4xl mb-2">description</span>
                <p class="text-sm font-medium">No contract created yet</p>
                <p class="text-xs mt-1">Create a contract when an offer has been accepted and you're ready to proceed.</p>
              </div>
            </div>

            <!-- Documents Tab -->
            <div
              *ngIf="activeTab() === 'documents'"
              id="panel-documents"
              role="tabpanel"
              aria-labelledby="tab-documents">
              <!-- Upload Document Button -->
              <div class="flex justify-end mb-4">
                <button class="btn btn-primary btn-sm gap-1" (click)="showDocUploadModal.set(true)" *ngIf="!showDocForm()">
                  <span class="material-symbols-outlined text-sm">upload_file</span>
                  Upload Document
                </button>
              </div>

              <!-- Inline Document Form -->
              <div *ngIf="showDocForm()" class="card bg-base-200/30 border border-base-200 mb-4" style="animation: scale-in 0.2s ease-out">
                <div class="card-body p-4 space-y-3">
                  <h4 class="text-sm font-semibold text-base-content">Upload Document</h4>
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div class="form-control w-full">
                      <label class="label"><span class="label-text text-xs font-medium">Document Type</span></label>
                      <select class="select select-bordered select-sm w-full" [(ngModel)]="docForm.docType">
                        <option value="TitleDeed">Title Deed</option>
                        <option value="SearchReport">Search Report</option>
                        <option value="LegalDocument">Legal Document</option>
                        <option value="EnvironmentalReport">Environmental Report</option>
                        <option value="PlanningDocument">Planning Document</option>
                        <option value="Contract">Contract</option>
                        <option value="Valuation">Valuation</option>
                        <option value="Correspondence">Correspondence</option>
                      </select>
                    </div>
                    <div class="form-control w-full">
                      <label class="label"><span class="label-text text-xs font-medium">Choose File</span></label>
                      <input type="file" class="file-input file-input-bordered file-input-sm w-full" (change)="onFileSelected($event)" accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.png" />
                    </div>
                  </div>
                  <div class="flex justify-end gap-2 pt-2">
                    <button class="btn btn-ghost btn-sm" (click)="cancelDocForm()">Cancel</button>
                    <button class="btn btn-primary btn-sm" (click)="saveDocument()">
                      <span class="material-symbols-outlined text-sm">upload_file</span>
                      Upload Document
                    </button>
                  </div>
                </div>
              </div>

              <div *ngIf="opportunity()!.documents.length > 0; else noDocuments">
                <div class="overflow-x-auto">
                  <table class="table table-sm w-full">
                    <thead>
                      <tr>
                        <th>File Name</th>
                        <th>Type</th>
                        <th>Size</th>
                        <th>Uploaded</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr *ngFor="let doc of opportunity()!.documents">
                        <td>
                          <div class="flex items-center gap-2">
                            <span class="material-symbols-outlined text-base text-base-content/60">description</span>
                            <span class="text-sm">{{ doc.fileName }}</span>
                          </div>
                        </td>
                        <td>
                          <span class="badge badge-sm badge-outline">{{ formatDocType(doc.docType) }}</span>
                        </td>
                        <td class="text-xs text-base-content/60">{{ formatFileSize(doc.fileSizeBytes) }}</td>
                        <td>{{ doc.uploadedAt | date:'dd MMM yyyy' }}</td>
                        <td>
                          <div class="flex gap-1">
                            <a class="btn btn-ghost btn-xs btn-square"
                               [href]="'/api/v1/opportunities/' + opportunity()!.id + '/documents/' + doc.id + '/download'"
                               target="_blank"
                               title="Download">
                              <span class="material-symbols-outlined text-sm">download</span>
                            </a>
                            <button class="btn btn-ghost btn-xs btn-square text-error" (click)="deleteDocument(doc.id)" title="Delete">
                              <span class="material-symbols-outlined text-sm">delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              <ng-template #noDocuments>
                <div class="flex flex-col items-center justify-center py-8 text-base-content/50">
                  <span class="material-symbols-outlined text-4xl mb-2">folder_open</span>
                  <p class="text-sm font-medium">No documents uploaded</p>
                  <p class="text-xs mt-1">Documents such as title deeds, reports, and legal files will appear here.</p>
                </div>
              </ng-template>
            </div>

            <!-- Financials Tab -->
            <div
              *ngIf="activeTab() === 'financials'"
              id="panel-financials"
              role="tabpanel"
              aria-labelledby="tab-financials">

              <!-- Permission Notice for non-finance users -->
              <div *ngIf="!canEditFinancials()" class="alert alert-info mb-4 shadow-sm">
                <span class="material-symbols-outlined">info</span>
                <div>
                  <p class="font-medium text-sm">View Only — Financial editing requires Valuation Analyst or Finance Director role</p>
                  <p class="text-xs opacity-70">You can view the financial assessment but changes must be made by a Valuation Analyst or Finance Director. Contact your administrator if you need access.</p>
                </div>
              </div>

              <!-- Show existing assessment when it exists AND form is NOT open -->
              <div *ngIf="opportunity()!.feasibilityAssessment as assessment">
                <div *ngIf="!showFeasibilityForm()" class="space-y-6">
                  <!-- Scenario Badge + Actions -->
                  <div class="flex items-center gap-2 flex-wrap">
                    <span class="text-sm font-medium text-base-content/70">Scenario:</span>
                    <span class="badge badge-sm badge-primary">{{ assessment.scenario }}</span>
                    <span *ngIf="assessment.isReadyForReview" class="badge badge-sm badge-success">Ready for Review</span>
                    <!-- Gap 5: Edit Assessment Button -->
                    <button class="btn btn-ghost btn-xs gap-1" (click)="editFeasibility()" [disabled]="!canEditFinancials()" [class.btn-disabled]="!canEditFinancials()">
                      <span class="material-symbols-outlined text-sm">edit</span>
                      Edit
                    </button>
                    <!-- Gap 6: Mark Ready for Review -->
                    <button *ngIf="!assessment.isReadyForReview" class="btn btn-success btn-xs gap-1" (click)="markReadyForReview()" [disabled]="!canEditFinancials()">
                      <span class="material-symbols-outlined text-sm">check_circle</span>
                      Mark Ready for Review
                    </button>
                  </div>

                  <!-- Financial Summary Grid -->
                  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div class="p-4 rounded-lg bg-base-200/50 border border-base-200">
                      <p class="text-xs text-base-content/50 uppercase font-medium">Estimated Land Cost</p>
                      <p class="text-lg font-bold text-base-content mt-1">£{{ assessment.estimatedLandCost | number:'1.2-2' }}</p>
                    </div>
                    <div class="p-4 rounded-lg bg-base-200/50 border border-base-200">
                      <p class="text-xs text-base-content/50 uppercase font-medium">Build Cost</p>
                      <p class="text-lg font-bold text-base-content mt-1">£{{ assessment.estimatedBuildCost | number:'1.2-2' }}</p>
                    </div>
                    <div class="p-4 rounded-lg bg-base-200/50 border border-base-200">
                      <p class="text-xs text-base-content/50 uppercase font-medium">Professional Fees</p>
                      <p class="text-lg font-bold text-base-content mt-1">£{{ assessment.professionalFees | number:'1.2-2' }}</p>
                    </div>
                    <div class="p-4 rounded-lg bg-base-200/50 border border-base-200">
                      <p class="text-xs text-base-content/50 uppercase font-medium">Finance Costs</p>
                      <p class="text-lg font-bold text-base-content mt-1">£{{ assessment.financeCosts | number:'1.2-2' }}</p>
                    </div>
                  </div>

                  <!-- Totals Row -->
                  <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div class="p-4 rounded-lg bg-base-200/50 border border-base-200">
                      <p class="text-xs text-base-content/50 uppercase font-medium">Total Costs</p>
                      <p class="text-lg font-bold text-base-content mt-1">£{{ assessment.totalCosts | number:'1.2-2' }}</p>
                    </div>
                    <div class="p-4 rounded-lg bg-base-200/50 border border-base-200">
                      <p class="text-xs text-base-content/50 uppercase font-medium">Expected Revenue</p>
                      <p class="text-lg font-bold text-success mt-1">£{{ assessment.expectedSalesRevenue | number:'1.2-2' }}</p>
                    </div>
                    <div class="p-4 rounded-lg border" [ngClass]="assessment.estimatedProfit >= 0 ? 'bg-success/10 border-success/20' : 'bg-error/10 border-error/20'">
                      <p class="text-xs text-base-content/50 uppercase font-medium">Estimated Profit</p>
                      <p class="text-lg font-bold mt-1" [ngClass]="assessment.estimatedProfit >= 0 ? 'text-success' : 'text-error'">
                        £{{ assessment.estimatedProfit | number:'1.2-2' }}
                      </p>
                      <p class="text-xs font-medium mt-0.5" [ngClass]="assessment.roiPercentage >= 0 ? 'text-success' : 'text-error'">
                        ROI: {{ assessment.roiPercentage | number:'1.1-1' }}%
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- No-assessment empty state (show only when NO assessment and form NOT open) -->
              <div *ngIf="!opportunity()!.feasibilityAssessment && !showFeasibilityForm()" class="flex flex-col items-center justify-center py-8 text-base-content/50">
                <span class="material-symbols-outlined text-4xl mb-2">analytics</span>
                <p class="text-sm font-medium">No feasibility assessment available</p>
                <p class="text-xs mt-1 mb-4">Create a feasibility assessment to evaluate this opportunity's financial viability.</p>
                <button *ngIf="canEditFinancials()" class="btn btn-primary btn-sm gap-1" (click)="showFeasibilityModal.set(true)">
                  <span class="material-symbols-outlined text-sm">add</span>
                  Create Feasibility Assessment
                </button>
                <p *ngIf="!canEditFinancials()" class="text-xs text-warning mt-2">
                  <span class="material-symbols-outlined text-sm align-middle">lock</span>
                  Only Valuation Analyst or Finance Director can create assessments
                </p>
              </div>

              <!-- Inline Feasibility Form (shown for both create and edit) -->
              <div *ngIf="showFeasibilityForm()" class="card bg-base-200/30 border border-base-200" style="animation: scale-in 0.2s ease-out">
                <div class="card-body p-4 space-y-4">
                  <h4 class="text-sm font-semibold text-base-content">
                    {{ editingFeasibility() ? 'Edit Feasibility Assessment' : 'New Feasibility Assessment' }}
                    <span class="badge badge-ghost badge-xs ml-2">Finance Director</span>
                  </h4>
                  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <div class="form-control w-full">
                      <label class="label"><span class="label-text text-xs font-medium">Estimated Land Cost (£)</span></label>
                      <app-currency mode="edit" [(ngModel)]="feasibilityForm.landCost"></app-currency>
                    </div>
                    <div class="form-control w-full">
                      <label class="label"><span class="label-text text-xs font-medium">Estimated Build Cost (£)</span></label>
                      <app-currency mode="edit" [(ngModel)]="feasibilityForm.buildCost"></app-currency>
                    </div>
                    <div class="form-control w-full">
                      <label class="label"><span class="label-text text-xs font-medium">Professional Fees (£)</span></label>
                      <app-currency mode="edit" [(ngModel)]="feasibilityForm.fees"></app-currency>
                    </div>
                    <div class="form-control w-full">
                      <label class="label"><span class="label-text text-xs font-medium">Finance Costs (£)</span></label>
                      <app-currency mode="edit" [(ngModel)]="feasibilityForm.financeCosts"></app-currency>
                    </div>
                    <div class="form-control w-full">
                      <label class="label"><span class="label-text text-xs font-medium">Expected Sales Revenue (£)</span></label>
                      <app-currency mode="edit" [(ngModel)]="feasibilityForm.revenue"></app-currency>
                    </div>
                    <div class="form-control w-full">
                      <label class="label"><span class="label-text text-xs font-medium">Scenario</span></label>
                      <select class="select select-bordered select-sm w-full" [(ngModel)]="feasibilityForm.scenario">
                        <option value="BestCase">Best Case</option>
                        <option value="Expected">Expected</option>
                        <option value="WorstCase">Worst Case</option>
                      </select>
                    </div>
                  </div>

                  <!-- Auto-calculated Summary -->
                  <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-base-200">
                    <div class="p-3 rounded-lg bg-base-200/50">
                      <p class="text-[11px] text-base-content/50 uppercase font-medium">Total Costs</p>
                      <p class="text-sm font-bold text-base-content">£{{ feasibilityTotalCosts() | number:'1.0-0' }}</p>
                    </div>
                    <div class="p-3 rounded-lg bg-base-200/50">
                      <p class="text-[11px] text-base-content/50 uppercase font-medium">Estimated Profit</p>
                      <p class="text-sm font-bold" [ngClass]="feasibilityProfit() >= 0 ? 'text-success' : 'text-error'">£{{ feasibilityProfit() | number:'1.0-0' }}</p>
                    </div>
                    <div class="p-3 rounded-lg bg-base-200/50">
                      <p class="text-[11px] text-base-content/50 uppercase font-medium">ROI</p>
                      <p class="text-sm font-bold" [ngClass]="feasibilityRoi() >= 0 ? 'text-success' : 'text-error'">{{ feasibilityRoi() | number:'1.1-1' }}%</p>
                    </div>
                  </div>

                  <div class="flex justify-end gap-2 pt-2">
                    <button class="btn btn-ghost btn-sm" (click)="cancelFeasibilityForm()">Cancel</button>
                    <button class="btn btn-primary btn-sm" (click)="saveFeasibility()" [disabled]="!canEditFinancials()">
                      <span class="material-symbols-outlined text-sm">save</span>
                      {{ editingFeasibility() ? 'Update Assessment' : 'Save Assessment' }}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Activity Tab (Gap 8: Real Audit Trail from API) -->
            <div
              *ngIf="activeTab() === 'activity'"
              id="panel-activity"
              role="tabpanel"
              aria-labelledby="tab-activity">
              <!-- Loading state -->
              <div *ngIf="auditLoading()" class="flex items-center justify-center py-8">
                <span class="loading loading-spinner loading-md text-primary"></span>
                <span class="ml-2 text-sm text-base-content/60">Loading activity history...</span>
              </div>
              <!-- Error/Fallback state -->
              <div *ngIf="!auditLoading() && auditError()" class="flex flex-col items-center justify-center py-8 text-base-content/50">
                <span class="material-symbols-outlined text-4xl mb-2">cloud_off</span>
                <p class="text-sm font-medium">{{ auditError() }}</p>
              </div>
              <!-- Activity timeline -->
              <app-activity-timeline *ngIf="!auditLoading() && !auditError()" [activities]="activityData()"></app-activity-timeline>
            </div>

            <!-- Approvals Tab (Gap 7) -->
            <div
              *ngIf="activeTab() === 'approvals'"
              id="panel-approvals"
              role="tabpanel"
              aria-labelledby="tab-approvals"
              style="animation: fade-in 0.3s ease-out">
              <!-- Request Approval button -->
              <div class="flex justify-end mb-4" *ngIf="showApprovalButton()">
                <button class="btn btn-secondary btn-sm gap-1" (click)="showApprovalModal.set(true)">
                  <span class="material-symbols-outlined text-sm">add</span>
                  Request Approval
                </button>
              </div>

              <!-- Approval form -->
              <div *ngIf="showApprovalForm()" class="card bg-base-200/30 border border-secondary/30 mb-4" style="animation: scale-in 0.2s ease-out">
                <div class="card-body p-5 space-y-4">
                  <h3 class="text-base font-semibold text-base-content flex items-center gap-2">
                    <span class="material-symbols-outlined text-secondary">approval</span>
                    Request Approval
                  </h3>
                  <p class="text-sm text-base-content/60">Submit this opportunity for management approval. Enter the requested investment amount.</p>
                  <div class="form-control w-full max-w-sm">
                    <label class="label"><span class="label-text font-medium">Requested Amount (£)</span></label>
                    <app-currency mode="edit" [(ngModel)]="approvalForm.requestedAmount"></app-currency>
                  </div>
                  <div class="flex justify-end gap-2 pt-2">
                    <button class="btn btn-ghost btn-sm" (click)="showApprovalForm.set(false)">Cancel</button>
                    <button class="btn btn-secondary btn-sm" (click)="submitApprovalRequest()" [disabled]="approvalForm.requestedAmount <= 0">
                      <span class="material-symbols-outlined text-sm">send</span>
                      Submit Request
                    </button>
                  </div>
                </div>
              </div>

              <!-- Approval Requests List -->
              <div *ngIf="opportunity()!.approvalRequests && opportunity()!.approvalRequests.length > 0; else noApprovals">
                <app-approval-panel
                  *ngFor="let req of opportunity()!.approvalRequests"
                  [approval]="req"
                  (approved)="handleApprovalDecision($event)"
                  (rejected)="handleRejectionDecision($event)">
                </app-approval-panel>
              </div>
              <ng-template #noApprovals>
                <div class="flex flex-col items-center justify-center py-8 text-base-content/50">
                  <span class="material-symbols-outlined text-4xl mb-2">approval</span>
                  <p class="text-sm font-medium">No approval requests</p>
                  <p class="text-xs mt-1">Request approval when the opportunity is ready for investment committee review.</p>
                </div>
              </ng-template>
            </div>

            <!-- Acquisition Tab -->
            <div
              *ngIf="activeTab() === 'acquisition'"
              id="panel-acquisition"
              role="tabpanel"
              aria-labelledby="tab-acquisition"
              style="animation: fade-in 0.3s ease-out">
              <app-acquisition-tab
                [opportunityId]="opportunity()!.id"
                [opportunityStatus]="opportunity()!.status">
              </app-acquisition-tab>
            </div>
          </div>
        </div>
      </section>
    </div>

    <!-- Withdrawal Modal -->
    <app-withdrawal-modal
      [visible]="showWithdrawalModal()"
      (confirmed)="onWithdrawalConfirmed($event)"
      (cancelled)="onWithdrawalCancelled()">
    </app-withdrawal-modal>

    <!-- Offer Form Modal -->
    <app-offer-form-modal
      [visible]="showOfferModal()"
      [opportunityId]="opportunity()?.id || ''"
      (closed)="showOfferModal.set(false)"
      (saved)="loadOpportunity()">
    </app-offer-form-modal>

    <!-- Due Diligence Form Modal -->
    <app-dd-form-modal
      [visible]="showDdModal()"
      [opportunityId]="opportunity()?.id || ''"
      (closed)="showDdModal.set(false)"
      (saved)="loadOpportunity()">
    </app-dd-form-modal>

    <!-- Document Upload Modal -->
    <app-document-upload-modal
      [visible]="showDocUploadModal()"
      [opportunityId]="opportunity()?.id || ''"
      (closed)="showDocUploadModal.set(false)"
      (uploaded)="loadOpportunity()">
    </app-document-upload-modal>

    <!-- Land Owner Form Modal -->
    <app-land-owner-form-modal
      [visible]="showOwnerModal()"
      [opportunityId]="opportunity()?.id || ''"
      [editMode]="ownerModalEditMode()"
      [existingOwner]="opportunity()?.landOwner || null"
      (closed)="showOwnerModal.set(false)"
      (saved)="loadOpportunity()">
    </app-land-owner-form-modal>

    <!-- Feasibility Form Modal -->
    <app-feasibility-form-modal
      [visible]="showFeasibilityModal()"
      [opportunityId]="opportunity()?.id || ''"
      [editMode]="feasibilityModalEditMode()"
      [existingAssessment]="opportunity()?.feasibilityAssessment || null"
      (closed)="showFeasibilityModal.set(false); feasibilityModalEditMode.set(false)"
      (saved)="loadOpportunity()">
    </app-feasibility-form-modal>

    <!-- Approval Request Modal -->
    <app-approval-request-modal
      [visible]="showApprovalModal()"
      [opportunityId]="opportunity()?.id || ''"
      (closed)="showApprovalModal.set(false)"
      (saved)="loadOpportunity()">
    </app-approval-request-modal>

    <!-- Contract Form Modal -->
    <app-contract-form-modal
      [visible]="showContractModal()"
      [opportunityId]="opportunity()?.id || ''"
      (closed)="showContractModal.set(false)"
      (saved)="loadOpportunity()">
    </app-contract-form-modal>
  `
})
export class OpportunityDetailPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly store = inject(Store);
  private readonly actions$ = inject(Actions);
  private readonly opportunityService = inject(OpportunityService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly http = inject(HttpClient);
  private readonly toast = inject(ToastService);
  private readonly authService = inject(AuthService);
  private readonly dueDiligenceService = inject(DueDiligenceService);
  private readonly offerService = inject(OfferService);
  private readonly contractService = inject(ContractService);
  private readonly documentService = inject(DocumentService);
  private readonly feasibilityService = inject(FeasibilityService);
  private readonly landOwnerService = inject(LandOwnerService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly auditService = inject(AuditService);

  /** Reactive state signals */
  readonly opportunity = signal<IOpportunityDetail | null>(null);
  readonly loading = signal<boolean>(true);
  readonly error = signal<string | null>(null);
  readonly activeTab = signal<string>('overview');

  /** Audit trail entries loaded from the API */
  readonly auditEntries = signal<readonly IAuditEntry[]>([]);
  readonly auditLoading = signal(false);
  readonly auditError = signal<string | null>(null);

  /** Form visibility toggles */
  readonly showDdForm = signal(false);
  readonly showOfferForm = signal(false);
  readonly showDocForm = signal(false);
  readonly showFeasibilityForm = signal(false);
  readonly showApprovalForm = signal(false);
  showCreateContractForm = false;

  /** Modal visibility signals */
  readonly showOfferModal = signal(false);
  readonly showDdModal = signal(false);
  readonly showDocUploadModal = signal(false);
  readonly showOwnerModal = signal(false);
  readonly showFeasibilityModal = signal(false);
  readonly showApprovalModal = signal(false);
  readonly showContractModal = signal(false);

  /** Modal edit mode signals */
  readonly ownerModalEditMode = signal(false);
  readonly feasibilityModalEditMode = signal(false);
  contractForm = { solicitorName: '', solicitorFirm: '', solicitorContact: '', depositAmount: 0 };

  /** Gap 3: Track which DD check is being edited */
  readonly editingDdId = signal<string | null>(null);

  /** Gap 4: Track which offer is being counter-offered */
  readonly counteringOfferId = signal<string | null>(null);
  counterAmount = 0;

  /** Gap 5: Track feasibility edit mode */
  readonly editingFeasibility = signal(false);

  /** Land Owner CRUD signals */
  readonly showOwnerForm = signal(false);
  readonly editingOwner = signal(false);
  readonly ownerFormSaving = signal(false);

  /** Land owner form model */
  ownerForm = { name: '', contactDetails: '', ownershipType: 'Freehold' as string, address: '' };

  /** Form models (simple objects for template-driven forms) */
  ddForm = { type: 'Legal', status: 'Pending', findings: '', reportDate: '' };
  offerForm = { amount: 0, validUntil: '' };
  docForm = { docType: 'TitleDeed', fileName: '' };
  feasibilityForm = { landCost: 0, buildCost: 0, fees: 0, financeCosts: 0, revenue: 0, scenario: 'Expected' };
  approvalForm = { requestedAmount: 0 };

  /** Selected file for document upload */
  selectedFile: File | null = null;

  /** Computed: show approval button when status is DueDiligence, OfferMade, or UnderContract */
  readonly showApprovalButton = computed(() => {
    const opp = this.opportunity();
    if (!opp) return false;
    // Show for all non-terminal statuses
    return opp.status !== OpportunityStatus.Acquired && opp.status !== OpportunityStatus.Withdrawn && !this.showApprovalForm();
  });

  /** Computed: feasibility total costs */
  readonly feasibilityTotalCosts = computed(() => {
    return this.feasibilityForm.landCost + this.feasibilityForm.buildCost + this.feasibilityForm.fees + this.feasibilityForm.financeCosts;
  });

  /** Computed: feasibility profit */
  readonly feasibilityProfit = computed(() => {
    return this.feasibilityForm.revenue - this.feasibilityTotalCosts();
  });

  /** Computed: feasibility ROI */
  readonly feasibilityRoi = computed(() => {
    const costs = this.feasibilityTotalCosts();
    if (costs === 0) return 0;
    return (this.feasibilityProfit() / costs) * 100;
  });

  /** Tab configuration — Gap 7: Added Approvals tab, Acquisition tab (visible for UnderContract/Acquired) */
  readonly tabs = computed(() => {
    const baseTabs: { id: string; label: string; icon: string }[] = [
      { id: 'overview', label: 'Overview', icon: 'info' },
      { id: 'due-diligence', label: 'Due Diligence', icon: 'fact_check' },
      { id: 'offers', label: 'Offers', icon: 'request_quote' },
      { id: 'contracts', label: 'Contracts', icon: 'description' },
      { id: 'documents', label: 'Documents', icon: 'folder' },
      { id: 'financials', label: 'Financials', icon: 'analytics' },
      { id: 'activity', label: 'Activity', icon: 'history' },
      { id: 'approvals', label: 'Approvals', icon: 'approval' }
    ];

    const opp = this.opportunity();
    if (opp && (opp.status === OpportunityStatus.UnderContract || opp.status === OpportunityStatus.Acquired)) {
      baseTabs.push({ id: 'acquisition', label: 'Acquisition', icon: 'real_estate_agent' });
    }

    return baseTabs;
  });

  /**
   * Computed contextual action buttons based on current opportunity status.
   * Buttons change depending on what transitions are allowed from the current status.
   */
  readonly actionButtons = computed<IActionButton[]>(() => {
    const opp = this.opportunity();
    if (!opp) return [];

    const buttons: IActionButton[] = [];

    // Edit button — always available unless terminal statuses
    if (opp.status !== OpportunityStatus.Acquired && opp.status !== OpportunityStatus.Withdrawn) {
      buttons.push({
        label: 'Edit',
        icon: 'edit',
        cssClass: 'btn-ghost',
        action: () => this.router.navigate(['/land-acquisition/opportunities', opp.id, 'edit'])
      });
    }

    // Status-specific forward transitions
    switch (opp.status) {
      case OpportunityStatus.Identified:
        buttons.push({
          label: 'Start Review',
          icon: 'play_arrow',
          cssClass: 'btn-primary',
          action: () => this.transitionStatus(OpportunityStatus.InitialReview)
        });
        break;
      case OpportunityStatus.InitialReview:
        buttons.push({
          label: 'Start Due Diligence',
          icon: 'checklist',
          cssClass: 'btn-primary',
          action: () => this.transitionStatus(OpportunityStatus.DueDiligence)
        });
        break;
      case OpportunityStatus.DueDiligence:
        buttons.push({
          label: 'Make Offer',
          icon: 'request_quote',
          cssClass: 'btn-primary',
          action: () => this.transitionStatus(OpportunityStatus.OfferMade)
        });
        break;
      case OpportunityStatus.OfferMade:
        buttons.push({
          label: 'Under Contract',
          icon: 'handshake',
          cssClass: 'btn-primary',
          action: () => this.transitionStatus(OpportunityStatus.UnderContract)
        });
        break;
      case OpportunityStatus.UnderContract:
        buttons.push({
          label: 'Mark Acquired',
          icon: 'check_circle',
          cssClass: 'btn-success',
          action: () => this.transitionStatus(OpportunityStatus.Acquired)
        });
        break;
    }

    // Withdraw action — available on all non-terminal statuses
    if (
      opp.status !== OpportunityStatus.Acquired &&
      opp.status !== OpportunityStatus.Withdrawn
    ) {
      buttons.push({
        label: 'Withdraw',
        icon: 'cancel',
        cssClass: 'btn-error btn-outline',
        action: () => this.transitionStatus(OpportunityStatus.Withdrawn)
      });
    }

    return buttons;
  });

  /**
   * Gap 8: Real activity data from the audit API.
   * Maps audit trail entries to the timeline display format.
   * Falls back to a placeholder message when no entries are available.
   */
  readonly activityData = computed<readonly IRecentActivity[]>(() => {
    const entries = this.auditEntries();
    const opp = this.opportunity();

    if (!entries.length || !opp) return [];

    return entries.map(entry => ({
      id: entry.id,
      opportunityId: opp.id,
      opportunityName: opp.name,
      previousStatus: '',
      newStatus: `${entry.action}: ${entry.entityName}${entry.changedFields.length ? ' (' + entry.changedFields.join(', ') + ')' : ''}`,
      changedBy: entry.userName,
      changedAt: entry.timestamp
    }));
  });

  /** Pipeline stages for the enhanced stepper */
  readonly pipelineStages: readonly { status: OpportunityStatus; label: string; subtitle: string }[] = [
    { status: OpportunityStatus.Identified, label: 'Identified', subtitle: 'Opportunity found' },
    { status: OpportunityStatus.InitialReview, label: 'Initial Review', subtitle: 'Preliminary assessment' },
    { status: OpportunityStatus.DueDiligence, label: 'Due Diligence', subtitle: 'Legal & technical checks' },
    { status: OpportunityStatus.OfferMade, label: 'Offer Made', subtitle: 'Negotiation phase' },
    { status: OpportunityStatus.UnderContract, label: 'Under Contract', subtitle: 'Legal exchange' },
    { status: OpportunityStatus.Acquired, label: 'Acquired', subtitle: 'Completion' }
  ];

  /** Computed: current stage index (0-based) */
  readonly currentStageIndex = computed(() => {
    const opp = this.opportunity();
    if (!opp) return 0;
    const idx = this.pipelineStages.findIndex(s => s.status === opp.status);
    return idx >= 0 ? idx : 0;
  });

  /** Computed: completed stages count */
  readonly completedStagesCount = computed(() => {
    const opp = this.opportunity();
    if (!opp) return 0;
    if (opp.status === OpportunityStatus.Acquired) return 6;
    if (opp.status === OpportunityStatus.Withdrawn) return this.currentStageIndex();
    return this.currentStageIndex();
  });

  /** Computed: pipeline completion percentage */
  readonly pipelineCompletionPercent = computed(() => {
    return Math.round((this.completedStagesCount() / 6) * 100);
  });

  /** Computed: days since creation (total pipeline time) */
  readonly totalPipelineDays = computed(() => {
    const opp = this.opportunity();
    if (!opp) return 0;
    const created = new Date(opp.createdAt).getTime();
    const now = Date.now();
    return Math.max(0, Math.floor((now - created) / (1000 * 60 * 60 * 24)));
  });

  /** Computed: days in current phase (since last update or creation) */
  readonly daysInCurrentPhase = computed(() => {
    const opp = this.opportunity();
    if (!opp) return 0;
    const ref = opp.updatedAt ? new Date(opp.updatedAt).getTime() : new Date(opp.createdAt).getTime();
    const now = Date.now();
    return Math.max(0, Math.floor((now - ref) / (1000 * 60 * 60 * 24)));
  });

  /** Computed: last updated display */
  readonly lastUpdatedDisplay = computed(() => {
    const opp = this.opportunity();
    if (!opp) return 'N/A';
    return opp.updatedAt ?? opp.createdAt;
  });

  /** Computed: Pipeline Health Score */
  readonly pipelineHealthScore = computed(() => {
    const opp = this.opportunity();
    if (!opp) return { overall: 0, legal: 0, commercial: 0, financial: 0, risk: 0, label: 'At Risk' as string, cssClass: 'text-error' };

    // Legal & Compliance: based on DD checks completed
    const ddTotal = opp.dueDiligences.length;
    const ddCompleted = opp.dueDiligences.filter(d => d.status === DueDiligenceStatus.Completed).length;
    const legal = ddTotal > 0 ? Math.round((ddCompleted / ddTotal) * 100) : 0;

    // Commercial Viability: based on offers existing
    const commercial = opp.offers.length > 0 ? 100 : 0;

    // Financial Feasibility: based on feasibility assessment existing
    const financial = opp.feasibilityAssessment ? 100 : 0;

    // Risk & Issues: based on no withdrawal + no pending approvals unresolved
    const pendingApprovals = opp.approvalRequests.filter(a => a.status === 'Pending').length;
    const risk = (!opp.withdrawalReason && pendingApprovals === 0) ? 100 : (opp.withdrawalReason ? 0 : 50);

    const overall = Math.round((legal + commercial + financial + risk) / 4);
    let label = 'At Risk';
    let cssClass = 'text-error';
    if (overall >= 70) { label = 'On Track'; cssClass = 'text-success'; }
    else if (overall >= 40) { label = 'Needs Attention'; cssClass = 'text-warning'; }

    return { overall, legal, commercial, financial, risk, label, cssClass };
  });

  /** Computed: next milestone based on current status */
  readonly nextMilestone = computed(() => {
    const opp = this.opportunity();
    if (!opp) return 'N/A';
    switch (opp.status) {
      case OpportunityStatus.Identified: return 'Complete Initial Review';
      case OpportunityStatus.InitialReview: return 'Begin Due Diligence';
      case OpportunityStatus.DueDiligence: return 'Submit Offer';
      case OpportunityStatus.OfferMade: return 'Exchange Contracts';
      case OpportunityStatus.UnderContract: return 'Complete Acquisition';
      case OpportunityStatus.Acquired: return 'Acquisition Complete';
      case OpportunityStatus.Withdrawn: return 'Withdrawn';
      default: return 'N/A';
    }
  });

  /** Computed: related tasks count */
  readonly relatedTasksCount = computed(() => {
    const opp = this.opportunity();
    if (!opp) return 0;
    return opp.dueDiligences.length + opp.offers.length + opp.documents.length;
  });

  /** Computed: open issues (pending approvals) */
  readonly openIssuesCount = computed(() => {
    const opp = this.opportunity();
    if (!opp) return 0;
    return opp.approvalRequests.filter(a => a.status === 'Pending').length;
  });

  ngOnInit(): void {
    this.loadOpportunity();
  }

  /**
   * Loads the opportunity detail from the API using the route param :id.
   */
  loadOpportunity(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error.set('No opportunity ID provided in the URL.');
      this.loading.set(false);
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.opportunityService
      .getById(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.opportunity.set(response.data);
            this.store.dispatch(OpportunityActions.selectOpportunity({ id }));
            this.loadAuditEntries(id);
          } else {
            this.error.set(response.errors?.[0] ?? 'Failed to load opportunity details.');
          }
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(err?.message ?? 'An unexpected error occurred while loading opportunity details.');
          this.loading.set(false);
        }
      });
  }

  /**
   * Loads audit trail entries for the current opportunity from the API.
   * On failure, sets a fallback error message without blocking the rest of the page.
   */
  private loadAuditEntries(opportunityId: string): void {
    this.auditLoading.set(true);
    this.auditError.set(null);

    this.auditService.getByOpportunity(opportunityId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.auditEntries.set(response.data);
          } else {
            this.auditEntries.set([]);
            this.auditError.set('Activity history is currently unavailable.');
          }
          this.auditLoading.set(false);
        },
        error: () => {
          this.auditEntries.set([]);
          this.auditError.set('Activity history is currently unavailable. Please try again later.');
          this.auditLoading.set(false);
        }
      });
  }

  /** Switch the active tab */
  setActiveTab(tabId: string): void {
    this.activeTab.set(tabId);
  }

  /** Signal to control the withdrawal modal visibility */
  readonly showWithdrawalModal = signal(false);

  /**
   * Transitions the opportunity to a new status.
   * For Withdrawn status, opens the withdrawal modal to collect a reason.
   * For other transitions, shows a confirmation dialog before dispatching.
   */
  async transitionStatus(targetStatus: OpportunityStatus): Promise<void> {
    const opp = this.opportunity();
    if (!opp) return;

    // For withdrawal, open the modal to collect reason
    if (targetStatus === OpportunityStatus.Withdrawn) {
      this.showWithdrawalModal.set(true);
      return;
    }

    // For all other transitions, show a confirmation dialog
    const currentLabel = this.formatStatusLabel(opp.status);
    const targetLabel = this.formatStatusLabel(targetStatus);

    const confirmed = await firstValueFrom(this.confirmDialog.confirm({
      title: 'Confirm Status Transition',
      message: `Are you sure you want to move this opportunity from "${currentLabel}" to "${targetLabel}"?`,
      confirmText: 'Confirm Transition',
      cancelText: 'Cancel',
      severity: 'info',
    }));

    if (!confirmed) return;

    this.store.dispatch(
      OpportunityActions.transitionStatus({ id: opp.id, targetStatus, reason: undefined })
    );

    // Reload the detail after the transition succeeds via NgRx effect subscription
    this.actions$.pipe(
      ofType(OpportunityActions.transitionStatusSuccess),
      take(1),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => {
      this.loadOpportunity();
    });
  }

  /** Formats a status enum value into a human-readable label. */
  private formatStatusLabel(status: string): string {
    return status.replace(/([a-z])([A-Z])/g, '$1 $2');
  }

  /** Handles withdrawal confirmation from the modal */
  onWithdrawalConfirmed(reason: string): void {
    const opp = this.opportunity();
    if (!opp) return;

    this.showWithdrawalModal.set(false);

    this.store.dispatch(
      OpportunityActions.transitionStatus({ id: opp.id, targetStatus: OpportunityStatus.Withdrawn, reason })
    );

    // Reload the detail after the transition succeeds via NgRx effect subscription
    this.actions$.pipe(
      ofType(OpportunityActions.transitionStatusSuccess),
      take(1),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => {
      this.loadOpportunity();
    });
  }

  /** Handles withdrawal cancellation from the modal */
  onWithdrawalCancelled(): void {
    this.showWithdrawalModal.set(false);
  }

  // ─── Formatting Helpers ─────────────────────────────────────────────

  formatDdType(type: DueDiligenceType): string {
    return type.replace(/([a-z])([A-Z])/g, '$1 $2');
  }

  formatDdStatus(status: DueDiligenceStatus): string {
    return status.replace(/([a-z])([A-Z])/g, '$1 $2');
  }

  getDdStatusClass(status: DueDiligenceStatus): string {
    switch (status) {
      case DueDiligenceStatus.Completed:
        return 'badge-success';
      case DueDiligenceStatus.Failed:
        return 'badge-error';
      case DueDiligenceStatus.InProgress:
        return 'badge-warning';
      case DueDiligenceStatus.Pending:
      default:
        return 'badge-ghost';
    }
  }

  formatOfferStatus(status: OfferStatus): string {
    return status.replace(/([a-z])([A-Z])/g, '$1 $2');
  }

  getOfferStatusClass(status: OfferStatus): string {
    switch (status) {
      case OfferStatus.Accepted:
        return 'badge-success';
      case OfferStatus.Rejected:
        return 'badge-error';
      case OfferStatus.Expired:
        return 'badge-error';
      case OfferStatus.CounterOffered:
        return 'badge-warning';
      case OfferStatus.UnderReview:
      default:
        return 'badge-info';
    }
  }

  formatDocType(type: DocumentType): string {
    return type
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2');
  }

  /**
   * Formats file size in bytes to a human-readable string.
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
  }

  // ─── CRUD Form Methods ───────────────────────────────────────────────

  // ─── Gap 3: Edit Due Diligence Check ──────────────────────────────────

  /** Populate the DD form with existing check values for editing */
  editDdCheck(dd: any): void {
    this.editingDdId.set(dd.id);
    this.ddForm = {
      type: dd.type,
      status: dd.status,
      findings: dd.findings ?? '',
      reportDate: dd.reportDate?.split('T')[0] ?? ''
    };
    this.showDdForm.set(true);
  }

  /** Save a new or update an existing due diligence check */
  saveDueDiligence(): void {
    const opp = this.opportunity();
    if (!opp) return;

    // Validate: findings required if Completed or Failed
    if ((this.ddForm.status === 'Completed' || this.ddForm.status === 'Failed') && !this.ddForm.findings.trim()) {
      this.toast.showWarning('Findings are required when status is Completed or Failed.');
      return;
    }

    const ddId = this.editingDdId();

    if (ddId) {
      // Gap 3: PATCH existing DD check (status transition)
      this.dueDiligenceService.transitionStatus(opp.id, ddId, {
        targetStatus: this.ddForm.status as DueDiligenceStatus,
        findings: this.ddForm.findings.trim() || null
      })
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.toast.showSuccess('Due diligence check updated successfully.');
            this.cancelDdForm();
            this.loadOpportunity();
          },
          error: () => {
            this.toast.showError('Failed to update due diligence check. Please try again.');
          }
        });
    } else {
      // POST new DD check — send string enum names (JsonStringEnumConverter is active)
      this.dueDiligenceService.create(opp.id, {
        type: this.ddForm.type as DueDiligenceType,
        findings: this.ddForm.findings.trim() || null
      })
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.toast.showSuccess('Due diligence check added successfully.');
            this.cancelDdForm();
            this.loadOpportunity();
          },
          error: () => {
            this.toast.showError('Failed to add due diligence check. Please try again.');
          }
        });
    }
  }

  cancelDdForm(): void {
    this.showDdForm.set(false);
    this.editingDdId.set(null);
    this.ddForm = { type: 'Legal', status: 'Pending', findings: '', reportDate: '' };
  }

  // ─── Gap 4: Counter Offer ─────────────────────────────────────────────

  /** Submit a counter-offer for a given offer */
  submitCounterOffer(offerId: string): void {
    if (!this.counterAmount || isNaN(this.counterAmount) || this.counterAmount <= 0) {
      this.toast.showWarning('Please enter a valid counter-offer amount.');
      return;
    }
    const opp = this.opportunity();
    if (!opp) return;

    this.offerService.transitionStatus(opp.id, offerId, {
      targetStatus: OfferStatus.CounterOffered,
      counterOfferAmount: this.counterAmount
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toast.showSuccess('Counter-offer submitted successfully.');
          this.counteringOfferId.set(null);
          this.counterAmount = 0;
          this.loadOpportunity();
        },
        error: () => {
          this.toast.showError('Failed to submit counter-offer. Please try again.');
        }
      });
  }

  // ─── Gap 5: Edit Feasibility Assessment ───────────────────────────────

  /** Pre-populate feasibility form with existing assessment values */
  editFeasibility(): void {
    const a = this.opportunity()?.feasibilityAssessment;
    if (!a) return;
    this.feasibilityForm = {
      landCost: a.estimatedLandCost,
      buildCost: a.estimatedBuildCost,
      fees: a.professionalFees,
      financeCosts: a.financeCosts,
      revenue: a.expectedSalesRevenue,
      scenario: a.scenario
    };
    this.editingFeasibility.set(true);
    this.feasibilityModalEditMode.set(true);
    this.showFeasibilityModal.set(true);
  }

  // ─── Gap 6: Mark Ready for Review ─────────────────────────────────────

  /** Mark the feasibility assessment as ready for investment committee review */
  markReadyForReview(): void {
    const opp = this.opportunity();
    if (!opp || !opp.feasibilityAssessment) return;
    const a = opp.feasibilityAssessment;

    this.feasibilityService.createOrUpdate(opp.id, {
      estimatedLandCost: a.estimatedLandCost,
      estimatedBuildCost: a.estimatedBuildCost,
      professionalFees: a.professionalFees,
      financeCosts: a.financeCosts,
      expectedSalesRevenue: a.expectedSalesRevenue,
      scenario: a.scenario
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toast.showSuccess('Marked as ready for review.');
          this.loadOpportunity();
        },
        error: () => {
          this.toast.showError('Failed to update assessment. Please try again.');
        }
      });
  }

  // ─── Gap 2: Delete Document ───────────────────────────────────────────

  /** Delete a document from this opportunity */
  async deleteDocument(docId: string): Promise<void> {
    const opp = this.opportunity();
    if (!opp) return;

    const doc = opp.documents.find(d => d.id === docId);
    const docName = doc?.fileName ?? 'this document';

    const confirmed = await firstValueFrom(this.confirmDialog.confirm({
      title: 'Delete Document',
      message: `Are you sure you want to delete "${docName}"? This action cannot be undone.`,
      confirmText: 'Delete Document',
      cancelText: 'Cancel',
      severity: 'danger',
    }));

    if (!confirmed) return;

    this.documentService.delete(opp.id, docId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toast.showSuccess('Document deleted.');
          this.loadOpportunity();
        },
        error: () => {
          this.toast.showError('Failed to delete document.');
        }
      });
  }

  /** Save a new offer */
  saveOffer(): void {
    const opp = this.opportunity();
    if (!opp) return;

    if (!this.offerForm.amount || this.offerForm.amount <= 0) {
      this.toast.showWarning('Please enter a valid offer amount.');
      return;
    }
    if (!this.offerForm.validUntil) {
      this.toast.showWarning('Please select a valid until date.');
      return;
    }
    if (new Date(this.offerForm.validUntil) <= new Date()) {
      this.toast.showWarning('Valid until date must be in the future.');
      return;
    }

    this.offerService.create(opp.id, {
      amount: this.offerForm.amount,
      currency: 'GBP',
      validUntil: this.offerForm.validUntil
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toast.showSuccess('Offer submitted successfully.');
          this.cancelOfferForm();
          this.loadOpportunity();
        },
        error: () => {
          this.toast.showError('Failed to submit offer. Please try again.');
        }
      });
  }

  cancelOfferForm(): void {
    this.showOfferForm.set(false);
    this.offerForm = { amount: 0, validUntil: '' };
  }

  /** Save a new document using multipart form data */
  saveDocument(): void {
    const opp = this.opportunity();
    if (!opp) return;

    if (!this.selectedFile) {
      this.toast.showWarning('Please select a file to upload.');
      return;
    }

    this.documentService.upload(opp.id, this.selectedFile, this.docForm.docType as DocumentType)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toast.showSuccess('Document uploaded successfully.');
          this.cancelDocForm();
          this.loadOpportunity();
        },
        error: () => {
          this.toast.showError('Failed to upload document. Please try again.');
        }
      });
  }

  cancelDocForm(): void {
    this.showDocForm.set(false);
    this.docForm = { docType: 'TitleDeed', fileName: '' };
    this.selectedFile = null;
  }

  /** Handle file selection from input */
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedFile = input.files?.[0] ?? null;
    if (this.selectedFile) {
      this.docForm.fileName = this.selectedFile.name;
    }
  }

  /** Save a new feasibility assessment (or update existing in edit mode) */
  saveFeasibility(): void {
    if (!this.canEditFinancials()) {
      this.toast.showError('Permission denied. Financial assessments can only be created or edited by a Valuation Analyst or Finance Director.');
      return;
    }

    const opp = this.opportunity();
    if (!opp) return;

    if (this.feasibilityForm.revenue <= 0) {
      this.toast.showWarning('Please enter expected sales revenue.');
      return;
    }

    this.feasibilityService.createOrUpdate(opp.id, {
      estimatedLandCost: this.feasibilityForm.landCost,
      estimatedBuildCost: this.feasibilityForm.buildCost,
      professionalFees: this.feasibilityForm.fees,
      financeCosts: this.feasibilityForm.financeCosts,
      expectedSalesRevenue: this.feasibilityForm.revenue,
      scenario: this.feasibilityForm.scenario as FeasibilityScenario
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toast.showSuccess(this.editingFeasibility() ? 'Feasibility assessment updated successfully.' : 'Feasibility assessment created successfully.');
          this.cancelFeasibilityForm();
          this.loadOpportunity();
        },
        error: () => {
          this.toast.showError('Failed to save feasibility assessment. Please try again.');
        }
      });
  }

  cancelFeasibilityForm(): void {
    this.showFeasibilityForm.set(false);
    this.editingFeasibility.set(false);
    this.feasibilityForm = { landCost: 0, buildCost: 0, fees: 0, financeCosts: 0, revenue: 0, scenario: 'Expected' };
  }

  /** Check if the current user has permission to edit financial assessments. */
  canEditFinancials(): boolean {
    return this.authService.hasAnyRole(['ValuationAnalyst', 'FinanceDirector', 'SuperAdmin']);
  }

  /** Submit approval request */
  submitApprovalRequest(): void {
    const opp = this.opportunity();
    if (!opp) return;

    if (!this.approvalForm.requestedAmount || this.approvalForm.requestedAmount <= 0) {
      this.toast.showWarning('Please enter a valid requested amount.');
      return;
    }

    const body = {
      opportunityId: opp.id,
      requestedAmount: this.approvalForm.requestedAmount
    };

    this.http.post('/api/v1/approvals', body)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toast.showSuccess('Approval requested successfully.');
          this.showApprovalForm.set(false);
          this.approvalForm = { requestedAmount: 0 };
          this.loadOpportunity();
        },
        error: () => {
          this.toast.showError('Failed to submit approval request. Please try again.');
        }
      });
  }

  // ─── Offer Status Actions ─────────────────────────────────────────────

  /** Accept an offer that is currently UnderReview */
  async acceptOffer(offerId: string): Promise<void> {
    const opp = this.opportunity();
    if (!opp) return;

    const confirmed = await firstValueFrom(this.confirmDialog.confirm({
      title: 'Accept Offer',
      message: 'Are you sure you want to accept this offer? This will mark the offer as accepted and may progress the opportunity.',
      confirmText: 'Accept Offer',
      cancelText: 'Cancel',
      severity: 'info',
    }));

    if (!confirmed) return;

    this.offerService.transitionStatus(opp.id, offerId, { targetStatus: OfferStatus.Accepted })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toast.showSuccess('Offer accepted successfully.');
          this.loadOpportunity();
        },
        error: () => {
          this.toast.showError('Failed to accept offer. Please try again.');
        }
      });
  }

  /** Reject an offer that is currently UnderReview */
  async rejectOffer(offerId: string): Promise<void> {
    const opp = this.opportunity();
    if (!opp) return;

    const confirmed = await firstValueFrom(this.confirmDialog.confirm({
      title: 'Reject Offer',
      message: 'Are you sure you want to reject this offer? This action cannot be undone.',
      confirmText: 'Reject Offer',
      cancelText: 'Cancel',
      severity: 'danger',
    }));

    if (!confirmed) return;

    this.offerService.transitionStatus(opp.id, offerId, { targetStatus: OfferStatus.Rejected })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toast.showSuccess('Offer rejected.');
          this.loadOpportunity();
        },
        error: () => {
          this.toast.showError('Failed to reject offer. Please try again.');
        }
      });
  }

  // ─── Approval Workflow Actions ────────────────────────────────────────

  /** Handle approval decision from the ApprovalPanelComponent */
  handleApprovalDecision(decision: IApprovalDecision): void {
    this.http.patch(`/api/v1/approvals/${decision.approvalId}`, {
      approvalRequestId: decision.approvalId,
      isApproved: true,
      notes: decision.notes
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toast.showSuccess('Approval granted successfully.');
          this.loadOpportunity();
        },
        error: () => {
          this.toast.showError('Failed to approve request. Please try again.');
        }
      });
  }

  /** Handle rejection decision from the ApprovalPanelComponent */
  handleRejectionDecision(decision: IRejectionDecision): void {
    this.http.patch(`/api/v1/approvals/${decision.approvalId}`, {
      approvalRequestId: decision.approvalId,
      isApproved: false,
      rejectionReason: decision.reason
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toast.showSuccess('Approval request rejected.');
          this.loadOpportunity();
        },
        error: () => {
          this.toast.showError('Failed to reject request. Please try again.');
        }
      });
  }

  // ─── Land Owner CRUD Actions ────────────────────────────────────────

  /** Open create form for adding a new land owner */
  addOwner(): void {
    this.ownerForm = { name: '', contactDetails: '', ownershipType: 'Freehold', address: '' };
    this.editingOwner.set(false);
    this.showOwnerForm.set(true);
  }

  /** Open edit form pre-populated with existing owner data */
  editOwner(): void {
    const owner = this.opportunity()?.landOwner;
    if (!owner) return;
    this.ownerForm = {
      name: owner.name,
      contactDetails: owner.contactDetails,
      ownershipType: owner.ownershipType,
      address: owner.address ?? ''
    };
    this.editingOwner.set(true);
    this.showOwnerForm.set(true);
  }

  /** Open the Land Owner modal in create or edit mode */
  openOwnerModal(editMode: boolean): void {
    this.ownerModalEditMode.set(editMode);
    this.showOwnerModal.set(true);
  }

  /** Delete the land owner after confirmation */
  async deleteOwner(): Promise<void> {
    const opp = this.opportunity();
    if (!opp || !opp.landOwner) return;

    const confirmed = await firstValueFrom(this.confirmDialog.confirm({
      title: 'Delete Land Owner',
      message: `Are you sure you want to delete "${opp.landOwner.name}"? This action cannot be undone.`,
      confirmText: 'Delete Owner',
      cancelText: 'Cancel',
      severity: 'danger',
    }));

    if (!confirmed) return;

    this.landOwnerService.delete(opp.id, opp.landOwner.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toast.showSuccess('Land owner deleted successfully.');
          this.loadOpportunity();
        },
        error: () => {
          this.toast.showError('Failed to delete land owner. Please try again.');
        }
      });
  }

  /** Validate the owner form */
  isOwnerFormValid(): boolean {
    const name = this.ownerForm.name.trim();
    const contact = this.ownerForm.contactDetails.trim();
    const type = this.ownerForm.ownershipType;
    return (
      name.length >= 2 && name.length <= 200 &&
      contact.length >= 5 && contact.length <= 500 &&
      (type === 'Freehold' || type === 'Leasehold')
    );
  }

  /** Save owner — create or update depending on mode */
  saveOwner(): void {
    const opp = this.opportunity();
    if (!opp) return;

    if (!this.isOwnerFormValid()) {
      this.toast.showWarning('Please fill in all required fields with valid values.');
      return;
    }

    this.ownerFormSaving.set(true);

    const dto = {
      name: this.ownerForm.name.trim(),
      contactDetails: this.ownerForm.contactDetails.trim(),
      ownershipType: this.ownerForm.ownershipType as OwnershipType,
      address: this.ownerForm.address.trim() || null
    };

    if (this.editingOwner() && opp.landOwner) {
      // Update existing owner
      this.landOwnerService.update(opp.id, opp.landOwner.id, dto)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.toast.showSuccess('Land owner updated successfully.');
            this.cancelOwnerForm();
            this.loadOpportunity();
          },
          error: () => {
            this.toast.showError('Failed to update land owner. Please try again.');
            this.ownerFormSaving.set(false);
          }
        });
    } else {
      // Create new owner
      this.landOwnerService.create(opp.id, dto)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.toast.showSuccess('Land owner added successfully.');
            this.cancelOwnerForm();
            this.loadOpportunity();
          },
          error: () => {
            this.toast.showError('Failed to add land owner. Please try again.');
            this.ownerFormSaving.set(false);
          }
        });
    }
  }

  /** Cancel and reset the owner form */
  cancelOwnerForm(): void {
    this.showOwnerForm.set(false);
    this.editingOwner.set(false);
    this.ownerFormSaving.set(false);
    this.ownerForm = { name: '', contactDetails: '', ownershipType: 'Freehold', address: '' };
  }

  // ─── Contract Actions ─────────────────────────────────────────────────

  createContract(): void {
    const opp = this.opportunity();
    if (!opp) return;

    this.contractService.create(opp.id, {
      solicitorName: this.contractForm.solicitorName || null,
      solicitorFirm: this.contractForm.solicitorFirm || null,
      solicitorContact: this.contractForm.solicitorContact || null
    }).pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toast.showSuccess('Contract created successfully.');
          this.showCreateContractForm = false;
          this.contractForm = { solicitorName: '', solicitorFirm: '', solicitorContact: '', depositAmount: 0 };
          this.loadOpportunity();
        },
        error: (err: { error?: { errors?: string[] } }) => {
          this.toast.showError(err.error?.errors?.[0] ?? 'Failed to create contract.');
        }
      });
  }

  getContractStatusClass(status: string): string {
    switch (status) {
      case 'Draft': return 'badge-ghost';
      case 'UnderLegalReview': return 'badge-info';
      case 'Approved': return 'badge-success';
      case 'Signed': return 'badge-primary';
      case 'Exchanged': return 'badge-secondary';
      case 'Completed': return 'badge-success';
      case 'Rejected': return 'badge-error';
      default: return 'badge-ghost';
    }
  }
}
