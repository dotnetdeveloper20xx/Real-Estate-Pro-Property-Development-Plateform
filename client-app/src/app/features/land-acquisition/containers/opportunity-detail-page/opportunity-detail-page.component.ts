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

import { OpportunityService } from '../../services/opportunity.service';
import { ToastService } from '@core/services/toast.service';
import { StatusProgressComponent } from '../../components/status-progress/status-progress.component';
import { StatusBadgeComponent } from '../../components/status-badge/status-badge.component';
import { ActivityTimelineComponent } from '../../components/activity-timeline/activity-timeline.component';
import { ApprovalPanelComponent, IApprovalDecision, IRejectionDecision } from '../../components/approval-panel/approval-panel.component';
import { OpportunityActions } from '../../store/opportunity/opportunity.actions';
import {
  IOpportunityDetail,
  OpportunityStatus,
  DueDiligenceStatus,
  DueDiligenceType,
  OfferStatus,
  DocumentType
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
 * Overview, Due Diligence, Offers, Documents, Financials, Activity.
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
    StatusProgressComponent,
    StatusBadgeComponent,
    ActivityTimelineComponent,
    ApprovalPanelComponent
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
            <div *ngFor="let i of [1,2,3,4,5,6]" class="h-8 w-24 bg-base-300 rounded"></div>
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
            <!-- Top Row: Title + Actions -->
            <div class="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
              <!-- Left: Title and Metadata -->
              <div class="flex flex-col gap-2">
                <div class="flex items-center gap-3">
                  <h1 class="text-2xl font-bold text-base-content">{{ opportunity()!.name }}</h1>
                  <app-status-badge [status]="opportunity()!.status"></app-status-badge>
                </div>
                <div class="flex flex-wrap items-center gap-4 text-sm text-base-content/70">
                  <span class="flex items-center gap-1">
                    <span class="material-symbols-outlined text-base">location_on</span>
                    {{ opportunity()!.location }}
                  </span>
                  <span class="flex items-center gap-1">
                    <span class="material-symbols-outlined text-base">straighten</span>
                    {{ opportunity()!.landSize | number:'1.2-2' }} acres
                  </span>
                  <span *ngIf="opportunity()!.source" class="flex items-center gap-1">
                    <span class="material-symbols-outlined text-base">source</span>
                    {{ opportunity()!.source }}
                  </span>
                  <span *ngIf="opportunity()!.expectedAcquisition" class="flex items-center gap-1">
                    <span class="material-symbols-outlined text-base">event</span>
                    Target: {{ opportunity()!.expectedAcquisition | date:'dd MMM yyyy' }}
                  </span>
                  <span class="flex items-center gap-1">
                    <span class="material-symbols-outlined text-base">calendar_today</span>
                    Created: {{ opportunity()!.createdAt | date:'dd MMM yyyy' }}
                  </span>
                </div>
              </div>

              <!-- Right: Action Buttons -->
              <div class="flex flex-wrap gap-2" *ngIf="actionButtons().length > 0 || showApprovalButton()">
                <button
                  *ngFor="let btn of actionButtons()"
                  class="btn btn-sm"
                  [ngClass]="btn.cssClass"
                  (click)="btn.action()">
                  <span class="material-symbols-outlined text-sm">{{ btn.icon }}</span>
                  {{ btn.label }}
                </button>
                <!-- Request Approval Button -->
                <button
                  *ngIf="showApprovalButton()"
                  class="btn btn-sm btn-secondary"
                  (click)="showApprovalForm.set(true)">
                  <span class="material-symbols-outlined text-sm">approval</span>
                  Request Approval
                </button>
              </div>
            </div>

            <!-- Status Progress Indicator -->
            <div class="mt-4 pt-4 border-t border-base-200">
              <app-status-progress [currentStatus]="opportunity()!.status"></app-status-progress>
            </div>
          </div>
        </div>
      </section>

      <!-- Approval Request Inline Form -->
      <div *ngIf="showApprovalForm()" class="card bg-base-100 shadow-sm border border-secondary/30" style="animation: scale-in 0.2s ease-out">
        <div class="card-body p-5 space-y-4">
          <h3 class="text-base font-semibold text-base-content flex items-center gap-2">
            <span class="material-symbols-outlined text-secondary">approval</span>
            Request Approval
          </h3>
          <p class="text-sm text-base-content/60">Submit this opportunity for management approval. Enter the requested investment amount.</p>
          <div class="form-control w-full max-w-sm">
            <label class="label"><span class="label-text font-medium">Requested Amount (£)</span></label>
            <input type="number" class="input input-bordered input-sm w-full" [(ngModel)]="approvalForm.requestedAmount" min="1" placeholder="e.g. 1500000" />
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

      <!-- Tabbed Content -->
      <section aria-label="Opportunity Details" style="animation: slide-up 0.4s ease-out 0.2s backwards">
        <div class="card bg-base-100 shadow-sm border border-base-200/80">
          <div class="card-body p-6">
            <!-- DaisyUI Tabs — Enhanced -->
            <div role="tablist" class="flex gap-1 border-b border-base-200 mb-6 -mx-2 px-2 overflow-x-auto">
              <button
                *ngFor="let tab of tabs"
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
              <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <!-- Opportunity Details Card -->
                <div class="rounded-xl border border-base-200/80 bg-base-100 overflow-hidden">
                  <div class="px-5 py-3 bg-base-200/30 border-b border-base-200/80">
                    <h3 class="text-sm font-semibold text-base-content flex items-center gap-2">
                      <span class="material-symbols-outlined text-primary text-base">info</span>
                      Opportunity Details
                    </h3>
                  </div>
                  <div class="p-5">
                    <div class="grid grid-cols-2 gap-4">
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
                        <app-status-badge [status]="opportunity()!.status"></app-status-badge>
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
                        <span class="text-sm font-medium text-base-content">{{ opportunity()!.createdAt | date:'dd MMM yyyy, HH:mm' }}</span>
                      </div>
                      <div class="flex flex-col gap-1 p-3 rounded-lg bg-error/5 border border-error/10" *ngIf="opportunity()!.withdrawalReason">
                        <span class="text-[11px] text-error/70 uppercase font-semibold tracking-wide">Withdrawal Reason</span>
                        <span class="text-sm font-medium text-error">{{ opportunity()!.withdrawalReason }}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Land Owner Card -->
                <div class="rounded-xl border border-base-200/80 bg-base-100 overflow-hidden">
                  <div class="px-5 py-3 bg-base-200/30 border-b border-base-200/80">
                    <h3 class="text-sm font-semibold text-base-content flex items-center gap-2">
                      <span class="material-symbols-outlined text-primary text-base">person</span>
                      Land Owner
                    </h3>
                  </div>
                  <div class="p-5">
                    <div *ngIf="opportunity()!.landOwner as owner; else noOwner">
                      <div class="grid grid-cols-2 gap-4">
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
                    </div>
                    <ng-template #noOwner>
                      <div class="flex flex-col items-center justify-center py-8 text-base-content/40">
                        <span class="material-symbols-outlined text-4xl mb-2">person_off</span>
                        <p class="text-sm font-medium">No land owner recorded</p>
                        <p class="text-xs mt-1">Owner details will appear here once captured.</p>
                      </div>
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
                <button class="btn btn-primary btn-sm gap-1" (click)="showDdForm.set(true)" *ngIf="!showDdForm()">
                  <span class="material-symbols-outlined text-sm">add</span>
                  Add Check
                </button>
              </div>

              <!-- Inline Due Diligence Form -->
              <div *ngIf="showDdForm()" class="card bg-base-200/30 border border-base-200 mb-4" style="animation: scale-in 0.2s ease-out">
                <div class="card-body p-4 space-y-3">
                  <h4 class="text-sm font-semibold text-base-content">New Due Diligence Check</h4>
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div class="form-control w-full">
                      <label class="label"><span class="label-text text-xs font-medium">Type</span></label>
                      <select class="select select-bordered select-sm w-full" [(ngModel)]="ddForm.type">
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
                      Save Check
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
                <button class="btn btn-primary btn-sm gap-1" (click)="showOfferForm.set(true)" *ngIf="!showOfferForm()">
                  <span class="material-symbols-outlined text-sm">add</span>
                  Submit Offer
                </button>
              </div>

              <!-- Inline Offer Form -->
              <div *ngIf="showOfferForm()" class="card bg-base-200/30 border border-base-200 mb-4" style="animation: scale-in 0.2s ease-out">
                <div class="card-body p-4 space-y-3">
                  <h4 class="text-sm font-semibold text-base-content">Submit New Offer</h4>
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div class="form-control w-full">
                      <label class="label"><span class="label-text text-xs font-medium">Amount (£)</span></label>
                      <input type="number" class="input input-bordered input-sm w-full" [(ngModel)]="offerForm.amount" min="1" placeholder="e.g. 1200000" />
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
                          <div *ngIf="offer.status === 'UnderReview'" class="flex gap-1">
                            <button class="btn btn-success btn-xs gap-0.5" (click)="acceptOffer(offer.id)" title="Accept this offer">
                              <span class="material-symbols-outlined text-xs">check</span>
                              Accept
                            </button>
                            <button class="btn btn-error btn-xs btn-outline gap-0.5" (click)="rejectOffer(offer.id)" title="Reject this offer">
                              <span class="material-symbols-outlined text-xs">close</span>
                              Reject
                            </button>
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

            <!-- Documents Tab -->
            <div
              *ngIf="activeTab() === 'documents'"
              id="panel-documents"
              role="tabpanel"
              aria-labelledby="tab-documents">
              <!-- Upload Document Button -->
              <div class="flex justify-end mb-4">
                <button class="btn btn-primary btn-sm gap-1" (click)="showDocForm.set(true)" *ngIf="!showDocForm()">
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
                      <label class="label"><span class="label-text text-xs font-medium">File Name</span></label>
                      <input type="text" class="input input-bordered input-sm w-full" [(ngModel)]="docForm.fileName" placeholder="e.g. title-deed-plot-42.pdf" />
                    </div>
                  </div>
                  <div class="flex justify-end gap-2 pt-2">
                    <button class="btn btn-ghost btn-sm" (click)="cancelDocForm()">Cancel</button>
                    <button class="btn btn-primary btn-sm" (click)="saveDocument()">
                      <span class="material-symbols-outlined text-sm">save</span>
                      Save Document
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
              <div *ngIf="opportunity()!.feasibilityAssessment as assessment; else noFinancials">
                <div class="space-y-6">
                  <!-- Scenario Badge -->
                  <div class="flex items-center gap-2">
                    <span class="text-sm font-medium text-base-content/70">Scenario:</span>
                    <span class="badge badge-sm badge-primary">{{ assessment.scenario }}</span>
                    <span *ngIf="assessment.isReadyForReview" class="badge badge-sm badge-success">Ready for Review</span>
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
              <ng-template #noFinancials>
                <!-- Create Feasibility Assessment Button -->
                <div *ngIf="!showFeasibilityForm()" class="flex flex-col items-center justify-center py-8 text-base-content/50">
                  <span class="material-symbols-outlined text-4xl mb-2">analytics</span>
                  <p class="text-sm font-medium">No feasibility assessment available</p>
                  <p class="text-xs mt-1 mb-4">Create a feasibility assessment to evaluate this opportunity's financial viability.</p>
                  <button class="btn btn-primary btn-sm gap-1" (click)="showFeasibilityForm.set(true)">
                    <span class="material-symbols-outlined text-sm">add</span>
                    Create Feasibility Assessment
                  </button>
                </div>

                <!-- Inline Feasibility Form -->
                <div *ngIf="showFeasibilityForm()" class="card bg-base-200/30 border border-base-200" style="animation: scale-in 0.2s ease-out">
                  <div class="card-body p-4 space-y-4">
                    <h4 class="text-sm font-semibold text-base-content">New Feasibility Assessment</h4>
                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      <div class="form-control w-full">
                        <label class="label"><span class="label-text text-xs font-medium">Estimated Land Cost (£)</span></label>
                        <input type="number" class="input input-bordered input-sm w-full" [(ngModel)]="feasibilityForm.landCost" min="0" placeholder="e.g. 500000" />
                      </div>
                      <div class="form-control w-full">
                        <label class="label"><span class="label-text text-xs font-medium">Estimated Build Cost (£)</span></label>
                        <input type="number" class="input input-bordered input-sm w-full" [(ngModel)]="feasibilityForm.buildCost" min="0" placeholder="e.g. 2000000" />
                      </div>
                      <div class="form-control w-full">
                        <label class="label"><span class="label-text text-xs font-medium">Professional Fees (£)</span></label>
                        <input type="number" class="input input-bordered input-sm w-full" [(ngModel)]="feasibilityForm.fees" min="0" placeholder="e.g. 150000" />
                      </div>
                      <div class="form-control w-full">
                        <label class="label"><span class="label-text text-xs font-medium">Finance Costs (£)</span></label>
                        <input type="number" class="input input-bordered input-sm w-full" [(ngModel)]="feasibilityForm.financeCosts" min="0" placeholder="e.g. 100000" />
                      </div>
                      <div class="form-control w-full">
                        <label class="label"><span class="label-text text-xs font-medium">Expected Sales Revenue (£)</span></label>
                        <input type="number" class="input input-bordered input-sm w-full" [(ngModel)]="feasibilityForm.revenue" min="0" placeholder="e.g. 4000000" />
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
                      <button class="btn btn-primary btn-sm" (click)="saveFeasibility()">
                        <span class="material-symbols-outlined text-sm">save</span>
                        Save Assessment
                      </button>
                    </div>
                  </div>
                </div>
              </ng-template>
            </div>

            <!-- Activity Tab -->
            <div
              *ngIf="activeTab() === 'activity'"
              id="panel-activity"
              role="tabpanel"
              aria-labelledby="tab-activity">
              <app-activity-timeline [activities]="activityData()"></app-activity-timeline>
            </div>
          </div>
        </div>
      </section>

      <!-- Approval Requests Section (shown when requests exist) -->
      <section *ngIf="opportunity()!.approvalRequests && opportunity()!.approvalRequests.length > 0"
        aria-label="Approval Requests"
        style="animation: slide-up 0.4s ease-out 0.3s backwards">
        <div class="space-y-4">
          <h2 class="text-base font-semibold text-base-content flex items-center gap-2">
            <span class="material-symbols-outlined text-secondary">approval</span>
            Approval Requests
          </h2>
          <app-approval-panel
            *ngFor="let req of opportunity()!.approvalRequests"
            [approval]="req"
            (approved)="handleApprovalDecision($event)"
            (rejected)="handleRejectionDecision($event)">
          </app-approval-panel>
        </div>
      </section>
    </div>
  `
})
export class OpportunityDetailPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly store = inject(Store);
  private readonly opportunityService = inject(OpportunityService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly http = inject(HttpClient);
  private readonly toast = inject(ToastService);

  /** Reactive state signals */
  readonly opportunity = signal<IOpportunityDetail | null>(null);
  readonly loading = signal<boolean>(true);
  readonly error = signal<string | null>(null);
  readonly activeTab = signal<string>('overview');

  /** Form visibility toggles */
  readonly showDdForm = signal(false);
  readonly showOfferForm = signal(false);
  readonly showDocForm = signal(false);
  readonly showFeasibilityForm = signal(false);
  readonly showApprovalForm = signal(false);

  /** Form models (simple objects for template-driven forms) */
  ddForm = { type: 'Legal', status: 'Pending', findings: '', reportDate: '' };
  offerForm = { amount: 0, validUntil: '' };
  docForm = { docType: 'TitleDeed', fileName: '' };
  feasibilityForm = { landCost: 0, buildCost: 0, fees: 0, financeCosts: 0, revenue: 0, scenario: 'Expected' };
  approvalForm = { requestedAmount: 0 };

  /** Computed: show approval button when status is OfferMade or UnderContract */
  readonly showApprovalButton = computed(() => {
    const opp = this.opportunity();
    if (!opp) return false;
    return (opp.status === OpportunityStatus.OfferMade || opp.status === OpportunityStatus.UnderContract) && !this.showApprovalForm();
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

  /** Tab configuration */
  readonly tabs: readonly { id: string; label: string; icon: string }[] = [
    { id: 'overview', label: 'Overview', icon: 'info' },
    { id: 'due-diligence', label: 'Due Diligence', icon: 'fact_check' },
    { id: 'offers', label: 'Offers', icon: 'request_quote' },
    { id: 'documents', label: 'Documents', icon: 'folder' },
    { id: 'financials', label: 'Financials', icon: 'analytics' },
    { id: 'activity', label: 'Activity', icon: 'history' }
  ];

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
   * Computed activity data for the Activity tab.
   * In a full implementation this would come from an audit API;
   * here we construct from available data.
   */
  readonly activityData = computed<readonly IRecentActivity[]>(() => {
    const opp = this.opportunity();
    if (!opp) return [];

    // Build a synthetic activity entry from the opportunity creation
    const activities: IRecentActivity[] = [
      {
        id: opp.id + '-creation',
        opportunityId: opp.id,
        opportunityName: opp.name,
        previousStatus: '',
        newStatus: opp.status,
        changedBy: opp.createdBy,
        changedAt: opp.createdAt
      }
    ];

    return activities;
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

  /** Switch the active tab */
  setActiveTab(tabId: string): void {
    this.activeTab.set(tabId);
  }

  /**
   * Transitions the opportunity to a new status.
   * For Withdrawn status, a reason would be collected (simplified here).
   */
  transitionStatus(targetStatus: OpportunityStatus): void {
    const opp = this.opportunity();
    if (!opp) return;

    // For withdrawal, prompt for a reason (simplified — full modal in 13.4/13.5)
    let reason: string | undefined;
    if (targetStatus === OpportunityStatus.Withdrawn) {
      reason = prompt('Please provide a reason for withdrawal (min 10 characters):') ?? undefined;
      if (!reason || reason.length < 10) {
        return; // User cancelled or invalid reason
      }
    }

    this.store.dispatch(
      OpportunityActions.transitionStatus({ id: opp.id, targetStatus, reason })
    );

    // Reload the detail to reflect the updated state
    setTimeout(() => this.loadOpportunity(), 500);
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

  /** Map enum string values to integer values for the API */
  private getDdTypeInt(type: string): number {
    const map: Record<string, number> = { Legal: 0, Environmental: 1, Planning: 2, Utilities: 3, Valuation: 4 };
    return map[type] ?? 0;
  }

  private getDdStatusInt(status: string): number {
    const map: Record<string, number> = { Pending: 0, InProgress: 1, Completed: 2, Failed: 3 };
    return map[status] ?? 0;
  }

  private getDocTypeInt(docType: string): number {
    const map: Record<string, number> = { TitleDeed: 0, SearchReport: 1, LegalDocument: 2, EnvironmentalReport: 3, PlanningDocument: 4, Contract: 5, Valuation: 6, Correspondence: 7 };
    return map[docType] ?? 0;
  }

  private getScenarioInt(scenario: string): number {
    const map: Record<string, number> = { BestCase: 0, Expected: 1, WorstCase: 2 };
    return map[scenario] ?? 1;
  }

  /** Save a new due diligence check */
  saveDueDiligence(): void {
    const opp = this.opportunity();
    if (!opp) return;

    // Validate: findings required if Completed or Failed
    if ((this.ddForm.status === 'Completed' || this.ddForm.status === 'Failed') && !this.ddForm.findings.trim()) {
      this.toast.showWarning('Findings are required when status is Completed or Failed.');
      return;
    }

    const body = {
      opportunityId: opp.id,
      type: this.getDdTypeInt(this.ddForm.type),
      status: this.getDdStatusInt(this.ddForm.status),
      findings: this.ddForm.findings.trim() || null,
      reportDate: this.ddForm.reportDate || null
    };

    this.http.post(`/api/v1/opportunities/${opp.id}/due-diligence`, body)
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

  cancelDdForm(): void {
    this.showDdForm.set(false);
    this.ddForm = { type: 'Legal', status: 'Pending', findings: '', reportDate: '' };
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

    const body = {
      opportunityId: opp.id,
      amount: this.offerForm.amount,
      currency: 'GBP',
      validUntil: this.offerForm.validUntil
    };

    this.http.post(`/api/v1/opportunities/${opp.id}/offers`, body)
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

  /** Save a new document */
  saveDocument(): void {
    const opp = this.opportunity();
    if (!opp) return;

    if (!this.docForm.fileName.trim()) {
      this.toast.showWarning('Please enter a file name.');
      return;
    }

    const body = {
      opportunityId: opp.id,
      docType: this.getDocTypeInt(this.docForm.docType),
      fileName: this.docForm.fileName.trim(),
      filePath: '/documents/demo/' + this.docForm.fileName.trim(),
      contentType: 'application/pdf',
      fileSizeBytes: Math.floor(Math.random() * 4500000) + 500000
    };

    this.http.post(`/api/v1/opportunities/${opp.id}/documents`, body)
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
  }

  /** Save a new feasibility assessment */
  saveFeasibility(): void {
    const opp = this.opportunity();
    if (!opp) return;

    if (this.feasibilityForm.revenue <= 0) {
      this.toast.showWarning('Please enter expected sales revenue.');
      return;
    }

    const totalCosts = this.feasibilityForm.landCost + this.feasibilityForm.buildCost + this.feasibilityForm.fees + this.feasibilityForm.financeCosts;
    const profit = this.feasibilityForm.revenue - totalCosts;
    const roi = totalCosts > 0 ? (profit / totalCosts) * 100 : 0;

    const body = {
      opportunityId: opp.id,
      estimatedLandCost: this.feasibilityForm.landCost,
      estimatedBuildCost: this.feasibilityForm.buildCost,
      professionalFees: this.feasibilityForm.fees,
      financeCosts: this.feasibilityForm.financeCosts,
      expectedSalesRevenue: this.feasibilityForm.revenue,
      totalCosts,
      estimatedProfit: profit,
      roiPercentage: roi,
      scenario: this.getScenarioInt(this.feasibilityForm.scenario)
    };

    this.http.post(`/api/v1/opportunities/${opp.id}/feasibility`, body)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toast.showSuccess('Feasibility assessment created successfully.');
          this.cancelFeasibilityForm();
          this.loadOpportunity();
        },
        error: () => {
          this.toast.showError('Failed to create feasibility assessment. Please try again.');
        }
      });
  }

  cancelFeasibilityForm(): void {
    this.showFeasibilityForm.set(false);
    this.feasibilityForm = { landCost: 0, buildCost: 0, fees: 0, financeCosts: 0, revenue: 0, scenario: 'Expected' };
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

    this.http.post('/api/v1/approval-requests', body)
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
  acceptOffer(offerId: string): void {
    const opp = this.opportunity();
    if (!opp) return;

    this.http.put(`/api/v1/opportunities/${opp.id}/offers/${offerId}/status`, { status: 'Accepted' })
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
  rejectOffer(offerId: string): void {
    const opp = this.opportunity();
    if (!opp) return;

    this.http.put(`/api/v1/opportunities/${opp.id}/offers/${offerId}/status`, { status: 'Rejected' })
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
    this.http.put(`/api/v1/approval-requests/${decision.approvalId}/approve`, { approvalNotes: decision.notes })
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
    this.http.put(`/api/v1/approval-requests/${decision.approvalId}/reject`, { rejectionReason: decision.reason })
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
}
