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
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';

import { OpportunityService } from '../../services/opportunity.service';
import { StatusProgressComponent } from '../../components/status-progress/status-progress.component';
import { StatusBadgeComponent } from '../../components/status-badge/status-badge.component';
import { ActivityTimelineComponent } from '../../components/activity-timeline/activity-timeline.component';
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
    RouterLink,
    DatePipe,
    DecimalPipe,
    StatusProgressComponent,
    StatusBadgeComponent,
    ActivityTimelineComponent
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
      <section aria-label="Opportunity Summary">
        <div class="card bg-base-100 shadow-sm border border-base-200">
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

            <!-- Status Progress Indicator -->
            <div class="mt-4 pt-4 border-t border-base-200">
              <app-status-progress [currentStatus]="opportunity()!.status"></app-status-progress>
            </div>
          </div>
        </div>
      </section>

      <!-- Tabbed Content -->
      <section aria-label="Opportunity Details">
        <div class="card bg-base-100 shadow-sm border border-base-200">
          <div class="card-body p-6">
            <!-- DaisyUI Tabs -->
            <div role="tablist" class="tabs tabs-bordered mb-6">
              <button
                *ngFor="let tab of tabs"
                role="tab"
                class="tab"
                [class.tab-active]="activeTab() === tab.id"
                [attr.aria-selected]="activeTab() === tab.id"
                [attr.aria-controls]="'panel-' + tab.id"
                (click)="setActiveTab(tab.id)">
                <span class="material-symbols-outlined text-sm mr-1">{{ tab.icon }}</span>
                {{ tab.label }}
              </button>
            </div>

            <!-- Tab Panels -->
            <!-- Overview Tab -->
            <div
              *ngIf="activeTab() === 'overview'"
              id="panel-overview"
              role="tabpanel"
              aria-labelledby="tab-overview">
              <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <!-- Opportunity Details Card -->
                <div class="space-y-4">
                  <h3 class="text-base font-semibold text-base-content">Opportunity Details</h3>
                  <div class="grid grid-cols-2 gap-3">
                    <div class="flex flex-col gap-0.5">
                      <span class="text-xs text-base-content/50 uppercase font-medium">Name</span>
                      <span class="text-sm text-base-content">{{ opportunity()!.name }}</span>
                    </div>
                    <div class="flex flex-col gap-0.5">
                      <span class="text-xs text-base-content/50 uppercase font-medium">Location</span>
                      <span class="text-sm text-base-content">{{ opportunity()!.location }}</span>
                    </div>
                    <div class="flex flex-col gap-0.5">
                      <span class="text-xs text-base-content/50 uppercase font-medium">Land Size</span>
                      <span class="text-sm text-base-content">{{ opportunity()!.landSize | number:'1.2-2' }} acres</span>
                    </div>
                    <div class="flex flex-col gap-0.5">
                      <span class="text-xs text-base-content/50 uppercase font-medium">Status</span>
                      <app-status-badge [status]="opportunity()!.status"></app-status-badge>
                    </div>
                    <div class="flex flex-col gap-0.5">
                      <span class="text-xs text-base-content/50 uppercase font-medium">Source</span>
                      <span class="text-sm text-base-content">{{ opportunity()!.source ?? 'Not specified' }}</span>
                    </div>
                    <div class="flex flex-col gap-0.5">
                      <span class="text-xs text-base-content/50 uppercase font-medium">Target Acquisition</span>
                      <span class="text-sm text-base-content">
                        {{ opportunity()!.expectedAcquisition ? (opportunity()!.expectedAcquisition | date:'dd MMM yyyy') : 'Not set' }}
                      </span>
                    </div>
                    <div class="flex flex-col gap-0.5">
                      <span class="text-xs text-base-content/50 uppercase font-medium">Created</span>
                      <span class="text-sm text-base-content">{{ opportunity()!.createdAt | date:'dd MMM yyyy, HH:mm' }}</span>
                    </div>
                    <div class="flex flex-col gap-0.5" *ngIf="opportunity()!.withdrawalReason">
                      <span class="text-xs text-base-content/50 uppercase font-medium">Withdrawal Reason</span>
                      <span class="text-sm text-base-content text-error">{{ opportunity()!.withdrawalReason }}</span>
                    </div>
                  </div>
                </div>

                <!-- Land Owner Card -->
                <div class="space-y-4">
                  <h3 class="text-base font-semibold text-base-content">Land Owner</h3>
                  <div *ngIf="opportunity()!.landOwner as owner; else noOwner">
                    <div class="grid grid-cols-2 gap-3">
                      <div class="flex flex-col gap-0.5">
                        <span class="text-xs text-base-content/50 uppercase font-medium">Owner Name</span>
                        <span class="text-sm text-base-content">{{ owner.name }}</span>
                      </div>
                      <div class="flex flex-col gap-0.5">
                        <span class="text-xs text-base-content/50 uppercase font-medium">Ownership Type</span>
                        <span class="text-sm text-base-content">{{ owner.ownershipType }}</span>
                      </div>
                      <div class="flex flex-col gap-0.5 col-span-2">
                        <span class="text-xs text-base-content/50 uppercase font-medium">Contact Details</span>
                        <span class="text-sm text-base-content">{{ owner.contactDetails }}</span>
                      </div>
                      <div *ngIf="owner.address" class="flex flex-col gap-0.5 col-span-2">
                        <span class="text-xs text-base-content/50 uppercase font-medium">Address</span>
                        <span class="text-sm text-base-content">{{ owner.address }}</span>
                      </div>
                    </div>
                  </div>
                  <ng-template #noOwner>
                    <div class="flex flex-col items-center justify-center py-6 text-base-content/50">
                      <span class="material-symbols-outlined text-3xl mb-2">person_off</span>
                      <p class="text-sm">No land owner recorded yet.</p>
                    </div>
                  </ng-template>
                </div>
              </div>
            </div>

            <!-- Due Diligence Tab -->
            <div
              *ngIf="activeTab() === 'due-diligence'"
              id="panel-due-diligence"
              role="tabpanel"
              aria-labelledby="tab-due-diligence">
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
                <div class="flex flex-col items-center justify-center py-8 text-base-content/50">
                  <span class="material-symbols-outlined text-4xl mb-2">analytics</span>
                  <p class="text-sm font-medium">No feasibility assessment available</p>
                  <p class="text-xs mt-1">Financial feasibility analysis will appear here once submitted by the valuation team.</p>
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
    </div>
  `
})
export class OpportunityDetailPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly store = inject(Store);
  private readonly opportunityService = inject(OpportunityService);
  private readonly destroyRef = inject(DestroyRef);

  /** Reactive state signals */
  readonly opportunity = signal<IOpportunityDetail | null>(null);
  readonly loading = signal<boolean>(true);
  readonly error = signal<string | null>(null);
  readonly activeTab = signal<string>('overview');

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
}
