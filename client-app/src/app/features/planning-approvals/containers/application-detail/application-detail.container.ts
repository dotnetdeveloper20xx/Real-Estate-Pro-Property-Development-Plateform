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
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';

import { PlanningApplicationService } from '../../services/planning-application.service';
import { ApplicationActions } from '../../store/application/application.actions';
import {
  IApplicationDetail,
  IApiResponse,
  PlanningApplicationStatus,
  PlanningApplicationType,
  ConditionStatus,
  ConditionType,
  PaymentStatus,
  FeeType,
  MilestoneStatus,
  AppealStatus,
  IPlanningFee
} from '../../models';

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
 * Status step definition for the progress indicator.
 */
interface IStatusStep {
  readonly status: PlanningApplicationStatus;
  readonly label: string;
  readonly state: 'completed' | 'current' | 'future';
}

/**
 * ApplicationDetailContainer — Smart container that displays
 * the full detail view of a single planning application.
 *
 * - Loads application detail from the service using route param :id
 * - Displays header with application summary
 * - Shows a status progress indicator for lifecycle position
 * - Tabs: Overview, Conditions, Documents, Fees, Timeline, Appeals, Activity
 * - Contextual action buttons based on status and user role
 *
 * Requirements: 15.1, 15.2, 15.3, 15.4, 15.5
 */
@Component({
  selector: 'app-application-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe, DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Loading Skeleton -->
    <div *ngIf="loading()" class="p-6 space-y-6 animate-pulse" aria-busy="true" aria-label="Loading application details">
      <div class="flex items-center gap-2">
        <div class="h-4 w-24 bg-base-300 rounded"></div>
      </div>
      <div class="card bg-base-100 shadow-sm border border-base-200">
        <div class="card-body p-6">
          <div class="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div class="flex flex-col gap-3">
              <div class="h-7 w-72 bg-base-300 rounded"></div>
              <div class="flex flex-wrap gap-4">
                <div class="h-5 w-24 bg-base-300 rounded"></div>
                <div class="h-5 w-20 bg-base-300 rounded"></div>
                <div class="h-5 w-36 bg-base-300 rounded"></div>
              </div>
            </div>
            <div class="flex gap-2">
              <div class="h-10 w-36 bg-base-300 rounded-lg"></div>
              <div class="h-10 w-28 bg-base-300 rounded-lg"></div>
            </div>
          </div>
          <div class="mt-4 h-12 w-full bg-base-300 rounded"></div>
        </div>
      </div>
      <div class="card bg-base-100 shadow-sm border border-base-200">
        <div class="card-body p-6">
          <div class="flex gap-4 border-b border-base-200 pb-2 mb-4">
            <div *ngFor="let i of [1,2,3,4,5,6,7]" class="h-8 w-24 bg-base-300 rounded"></div>
          </div>
          <div class="space-y-4">
            <div class="h-5 w-48 bg-base-300 rounded"></div>
            <div class="h-4 w-full bg-base-300 rounded"></div>
            <div class="h-4 w-3/4 bg-base-300 rounded"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Error State -->
    <div *ngIf="error()" class="p-6">
      <div class="card bg-base-100 shadow-sm border border-error/30">
        <div class="card-body p-6 flex flex-col items-center text-center gap-4">
          <span class="material-symbols-outlined text-5xl text-error">error</span>
          <h2 class="text-lg font-semibold text-base-content">Unable to load application</h2>
          <p class="text-sm text-base-content/60">{{ error() }}</p>
          <button class="btn btn-primary btn-sm" (click)="loadApplication()">
            <span class="material-symbols-outlined text-sm mr-1">refresh</span>
            Retry
          </button>
        </div>
      </div>
    </div>

    <!-- Application Detail Content -->
    <div *ngIf="!loading() && !error() && application()" class="p-6 space-y-6">
      <!-- Breadcrumb Navigation -->
      <nav aria-label="Breadcrumb">
        <ol class="flex items-center gap-2 text-sm text-base-content/60">
          <li>
            <a routerLink="/planning-approvals/pipeline" class="hover:text-primary transition-colors">Pipeline</a>
          </li>
          <li><span class="material-symbols-outlined text-xs">chevron_right</span></li>
          <li class="text-base-content font-medium truncate max-w-xs">{{ application()!.description }}</li>
        </ol>
      </nav>

      <!-- Header Card -->
      <section aria-label="Application Summary">
        <div class="card bg-base-100 shadow-sm border border-base-200">
          <div class="card-body p-6">
            <!-- Top Row: Title + Actions -->
            <div class="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
              <!-- Left: Title and Metadata -->
              <div class="flex flex-col gap-2">
                <div class="flex items-center gap-3 flex-wrap">
                  <h1 class="text-2xl font-bold text-base-content">{{ application()!.description }}</h1>
                  <span class="badge badge-sm" [ngClass]="getApplicationTypeBadge(application()!.applicationType)">
                    {{ formatApplicationType(application()!.applicationType) }}
                  </span>
                  <span class="badge badge-sm" [ngClass]="getStatusBadge(application()!.status)">
                    {{ formatStatus(application()!.status) }}
                  </span>
                </div>
                <div class="flex flex-wrap items-center gap-4 text-sm text-base-content/70">
                  <span class="flex items-center gap-1">
                    <span class="material-symbols-outlined text-base">apartment</span>
                    {{ application()!.councilName }}
                  </span>
                  <span *ngIf="application()!.applicationReference" class="flex items-center gap-1">
                    <span class="material-symbols-outlined text-base">tag</span>
                    {{ application()!.applicationReference }}
                  </span>
                  <span *ngIf="application()!.opportunity" class="flex items-center gap-1">
                    <span class="material-symbols-outlined text-base">landscape</span>
                    {{ application()!.opportunity!.name }}
                  </span>
                  <span *ngIf="application()!.submissionDate" class="flex items-center gap-1">
                    <span class="material-symbols-outlined text-base">send</span>
                    Submitted: {{ application()!.submissionDate | date:'dd MMM yyyy' }}
                  </span>
                  <span *ngIf="application()!.targetDecisionDate" class="flex items-center gap-1">
                    <span class="material-symbols-outlined text-base">event</span>
                    Target: {{ application()!.targetDecisionDate | date:'dd MMM yyyy' }}
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
              <div class="flex items-center justify-between gap-1 overflow-x-auto" role="progressbar" aria-label="Application lifecycle progress">
                <div
                  *ngFor="let step of statusSteps(); let last = last"
                  class="flex items-center"
                  [class.flex-1]="!last">
                  <div class="flex flex-col items-center gap-1 min-w-[80px]">
                    <div
                      class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition-colors"
                      [ngClass]="{
                        'bg-primary text-primary-content border-primary': step.state === 'current',
                        'bg-success text-success-content border-success': step.state === 'completed',
                        'bg-base-200 text-base-content/40 border-base-300': step.state === 'future'
                      }">
                      <span *ngIf="step.state === 'completed'" class="material-symbols-outlined text-sm">check</span>
                      <span *ngIf="step.state !== 'completed'" class="text-xs">{{ getStepIndex(step.status) }}</span>
                    </div>
                    <span
                      class="text-[10px] text-center leading-tight max-w-[72px]"
                      [ngClass]="{
                        'text-primary font-semibold': step.state === 'current',
                        'text-success': step.state === 'completed',
                        'text-base-content/40': step.state === 'future'
                      }">
                      {{ step.label }}
                    </span>
                  </div>
                  <div
                    *ngIf="!last"
                    class="flex-1 h-0.5 mx-1 mt-[-16px]"
                    [ngClass]="{
                      'bg-success': step.state === 'completed',
                      'bg-base-300': step.state !== 'completed'
                    }">
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Tabbed Content -->
      <section aria-label="Application Details">
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
                <span *ngIf="tab.count !== undefined && tab.count > 0" class="badge badge-xs badge-neutral ml-1">{{ tab.count }}</span>
              </button>
            </div>

            <!-- Overview Tab -->
            <div
              *ngIf="activeTab() === 'overview'"
              id="panel-overview"
              role="tabpanel"
              aria-labelledby="tab-overview">
              <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <!-- Application Details -->
                <div class="space-y-4">
                  <h3 class="text-base font-semibold text-base-content">Application Details</h3>
                  <div class="grid grid-cols-2 gap-3">
                    <div class="flex flex-col gap-0.5">
                      <span class="text-xs text-base-content/50 uppercase font-medium">Description</span>
                      <span class="text-sm text-base-content">{{ application()!.description }}</span>
                    </div>
                    <div class="flex flex-col gap-0.5">
                      <span class="text-xs text-base-content/50 uppercase font-medium">Application Type</span>
                      <span class="badge badge-sm badge-outline">{{ formatApplicationType(application()!.applicationType) }}</span>
                    </div>
                    <div class="flex flex-col gap-0.5">
                      <span class="text-xs text-base-content/50 uppercase font-medium">Status</span>
                      <span class="badge badge-sm" [ngClass]="getStatusBadge(application()!.status)">{{ formatStatus(application()!.status) }}</span>
                    </div>
                    <div class="flex flex-col gap-0.5">
                      <span class="text-xs text-base-content/50 uppercase font-medium">Council</span>
                      <span class="text-sm text-base-content">{{ application()!.councilName }}</span>
                    </div>
                    <div class="flex flex-col gap-0.5">
                      <span class="text-xs text-base-content/50 uppercase font-medium">Reference</span>
                      <span class="text-sm text-base-content">{{ application()!.applicationReference ?? 'Not assigned' }}</span>
                    </div>
                    <div class="flex flex-col gap-0.5">
                      <span class="text-xs text-base-content/50 uppercase font-medium">Submission Date</span>
                      <span class="text-sm text-base-content">{{ application()!.submissionDate ? (application()!.submissionDate | date:'dd MMM yyyy') : 'Not submitted' }}</span>
                    </div>
                    <div class="flex flex-col gap-0.5">
                      <span class="text-xs text-base-content/50 uppercase font-medium">Target Decision</span>
                      <span class="text-sm text-base-content">{{ application()!.targetDecisionDate ? (application()!.targetDecisionDate | date:'dd MMM yyyy') : 'Not set' }}</span>
                    </div>
                    <div class="flex flex-col gap-0.5">
                      <span class="text-xs text-base-content/50 uppercase font-medium">Actual Decision</span>
                      <span class="text-sm text-base-content">{{ application()!.actualDecisionDate ? (application()!.actualDecisionDate | date:'dd MMM yyyy') : '—' }}</span>
                    </div>
                    <div class="flex flex-col gap-0.5">
                      <span class="text-xs text-base-content/50 uppercase font-medium">Created</span>
                      <span class="text-sm text-base-content">{{ application()!.createdAt | date:'dd MMM yyyy, HH:mm' }}</span>
                    </div>
                    <div class="flex flex-col gap-0.5">
                      <span class="text-xs text-base-content/50 uppercase font-medium">Created By</span>
                      <span class="text-sm text-base-content">{{ application()!.createdBy }}</span>
                    </div>
                    <div *ngIf="application()!.withdrawalReason" class="flex flex-col gap-0.5 col-span-2">
                      <span class="text-xs text-base-content/50 uppercase font-medium">Withdrawal Reason</span>
                      <span class="text-sm text-error">{{ application()!.withdrawalReason }}</span>
                    </div>
                  </div>
                </div>

                <!-- Land Opportunity & Council Contact -->
                <div class="space-y-6">
                  <!-- Linked Land Opportunity -->
                  <div class="space-y-4">
                    <h3 class="text-base font-semibold text-base-content">Linked Land Opportunity</h3>
                    <div *ngIf="application()!.opportunity as opp; else noOpportunity">
                      <div class="grid grid-cols-2 gap-3">
                        <div class="flex flex-col gap-0.5">
                          <span class="text-xs text-base-content/50 uppercase font-medium">Name</span>
                          <span class="text-sm text-base-content">{{ opp.name }}</span>
                        </div>
                        <div class="flex flex-col gap-0.5">
                          <span class="text-xs text-base-content/50 uppercase font-medium">Location</span>
                          <span class="text-sm text-base-content">{{ opp.location }}</span>
                        </div>
                        <div class="flex flex-col gap-0.5">
                          <span class="text-xs text-base-content/50 uppercase font-medium">Land Size</span>
                          <span class="text-sm text-base-content">{{ opp.landSize | number:'1.2-2' }} acres</span>
                        </div>
                        <div class="flex flex-col gap-0.5">
                          <span class="text-xs text-base-content/50 uppercase font-medium">Status</span>
                          <span class="badge badge-sm badge-success">{{ opp.status }}</span>
                        </div>
                      </div>
                    </div>
                    <ng-template #noOpportunity>
                      <div class="flex flex-col items-center justify-center py-4 text-base-content/50">
                        <span class="material-symbols-outlined text-3xl mb-1">landscape</span>
                        <p class="text-sm">No opportunity linked.</p>
                      </div>
                    </ng-template>
                  </div>

                  <!-- Council Contact -->
                  <div class="space-y-4">
                    <h3 class="text-base font-semibold text-base-content">Council Contact</h3>
                    <div *ngIf="application()!.councilContact as contact; else noContact">
                      <div class="grid grid-cols-2 gap-3">
                        <div class="flex flex-col gap-0.5">
                          <span class="text-xs text-base-content/50 uppercase font-medium">Council</span>
                          <span class="text-sm text-base-content">{{ contact.councilName }}</span>
                        </div>
                        <div class="flex flex-col gap-0.5">
                          <span class="text-xs text-base-content/50 uppercase font-medium">Planning Officer</span>
                          <span class="text-sm text-base-content">{{ contact.planningOfficerName }}</span>
                        </div>
                        <div class="flex flex-col gap-0.5">
                          <span class="text-xs text-base-content/50 uppercase font-medium">Email</span>
                          <a [href]="'mailto:' + contact.email" class="text-sm text-primary hover:underline">{{ contact.email }}</a>
                        </div>
                        <div class="flex flex-col gap-0.5">
                          <span class="text-xs text-base-content/50 uppercase font-medium">Phone</span>
                          <a [href]="'tel:' + contact.phone" class="text-sm text-primary hover:underline">{{ contact.phone }}</a>
                        </div>
                        <div class="flex flex-col gap-0.5 col-span-2">
                          <span class="text-xs text-base-content/50 uppercase font-medium">Address</span>
                          <span class="text-sm text-base-content">{{ contact.address }}</span>
                        </div>
                      </div>
                    </div>
                    <ng-template #noContact>
                      <div class="flex flex-col items-center justify-center py-4 text-base-content/50">
                        <span class="material-symbols-outlined text-3xl mb-1">contact_phone</span>
                        <p class="text-sm">No council contact recorded yet.</p>
                      </div>
                    </ng-template>
                  </div>
                </div>
              </div>
            </div>

            <!-- Conditions Tab -->
            <div
              *ngIf="activeTab() === 'conditions'"
              id="panel-conditions"
              role="tabpanel"
              aria-labelledby="tab-conditions">
              <div *ngIf="application()!.conditions.length > 0; else noConditions">
                <div class="overflow-x-auto">
                  <table class="table table-sm w-full">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Description</th>
                        <th>Type</th>
                        <th>Status</th>
                        <th>Due Date</th>
                        <th>Discharged</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr *ngFor="let condition of application()!.conditions">
                        <td class="font-medium">{{ condition.conditionNumber }}</td>
                        <td class="max-w-xs truncate">{{ condition.description }}</td>
                        <td>
                          <span class="badge badge-sm badge-outline">{{ formatConditionType(condition.conditionType) }}</span>
                        </td>
                        <td>
                          <span class="badge badge-sm" [ngClass]="getConditionStatusBadge(condition.status)">
                            {{ formatConditionStatus(condition.status) }}
                          </span>
                        </td>
                        <td>{{ condition.dueDate ? (condition.dueDate | date:'dd MMM yyyy') : '—' }}</td>
                        <td>{{ condition.dischargeDate ? (condition.dischargeDate | date:'dd MMM yyyy') : '—' }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              <ng-template #noConditions>
                <div class="flex flex-col items-center justify-center py-8 text-base-content/50">
                  <span class="material-symbols-outlined text-4xl mb-2">checklist</span>
                  <p class="text-sm font-medium">No conditions recorded</p>
                  <p class="text-xs mt-1">Planning conditions will appear here once the application is approved with conditions.</p>
                </div>
              </ng-template>
            </div>

            <!-- Documents Tab -->
            <div
              *ngIf="activeTab() === 'documents'"
              id="panel-documents"
              role="tabpanel"
              aria-labelledby="tab-documents">
              <div *ngIf="application()!.documents.length > 0; else noDocuments">
                <div class="overflow-x-auto">
                  <table class="table table-sm w-full">
                    <thead>
                      <tr>
                        <th>File Name</th>
                        <th>Type</th>
                        <th>Size</th>
                        <th>Uploaded</th>
                        <th>Uploaded By</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr *ngFor="let doc of application()!.documents">
                        <td>
                          <div class="flex items-center gap-2">
                            <span class="material-symbols-outlined text-base text-base-content/60">description</span>
                            <span class="text-sm">{{ doc.fileName }}</span>
                          </div>
                        </td>
                        <td>
                          <span class="badge badge-sm badge-outline">{{ formatDocumentType(doc.documentType) }}</span>
                        </td>
                        <td class="text-xs text-base-content/60">{{ formatFileSize(doc.fileSizeBytes) }}</td>
                        <td>{{ doc.uploadedAt | date:'dd MMM yyyy' }}</td>
                        <td class="text-sm">{{ doc.uploadedBy }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              <ng-template #noDocuments>
                <div class="flex flex-col items-center justify-center py-8 text-base-content/50">
                  <span class="material-symbols-outlined text-4xl mb-2">folder_open</span>
                  <p class="text-sm font-medium">No documents uploaded</p>
                  <p class="text-xs mt-1">Planning drawings, reports, and council correspondence will appear here.</p>
                </div>
              </ng-template>
            </div>

            <!-- Fees Tab -->
            <div
              *ngIf="activeTab() === 'fees'"
              id="panel-fees"
              role="tabpanel"
              aria-labelledby="tab-fees">
              <div *ngIf="application()!.fees.length > 0; else noFees">
                <!-- Fee Summary -->
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                  <div class="p-3 rounded-lg bg-base-200/50 border border-base-200">
                    <p class="text-xs text-base-content/50 uppercase font-medium">Total Fees</p>
                    <p class="text-lg font-bold text-base-content mt-0.5">{{ totalFees() | number:'1.2-2' }}</p>
                  </div>
                  <div class="p-3 rounded-lg bg-success/10 border border-success/20">
                    <p class="text-xs text-base-content/50 uppercase font-medium">Paid</p>
                    <p class="text-lg font-bold text-success mt-0.5">{{ paidFees() | number:'1.2-2' }}</p>
                  </div>
                  <div class="p-3 rounded-lg bg-warning/10 border border-warning/20">
                    <p class="text-xs text-base-content/50 uppercase font-medium">Pending</p>
                    <p class="text-lg font-bold text-warning mt-0.5">{{ pendingFees() | number:'1.2-2' }}</p>
                  </div>
                  <div class="p-3 rounded-lg bg-info/10 border border-info/20">
                    <p class="text-xs text-base-content/50 uppercase font-medium">Awaiting Approval</p>
                    <p class="text-lg font-bold text-info mt-0.5">{{ awaitingApprovalFees() | number:'1.2-2' }}</p>
                  </div>
                </div>

                <!-- Fee Table -->
                <div class="overflow-x-auto">
                  <table class="table table-sm w-full">
                    <thead>
                      <tr>
                        <th>Description</th>
                        <th>Type</th>
                        <th>Amount</th>
                        <th>Currency</th>
                        <th>Status</th>
                        <th>Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr *ngFor="let fee of application()!.fees">
                        <td class="max-w-xs truncate">{{ fee.description }}</td>
                        <td>
                          <span class="badge badge-sm badge-outline">{{ formatFeeType(fee.feeType) }}</span>
                        </td>
                        <td class="font-medium">{{ fee.amount | number:'1.2-2' }}</td>
                        <td>{{ fee.currency }}</td>
                        <td>
                          <span class="badge badge-sm" [ngClass]="getPaymentStatusBadge(fee.paymentStatus)">
                            {{ formatPaymentStatus(fee.paymentStatus) }}
                          </span>
                        </td>
                        <td>{{ fee.createdAt | date:'dd MMM yyyy' }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              <ng-template #noFees>
                <div class="flex flex-col items-center justify-center py-8 text-base-content/50">
                  <span class="material-symbols-outlined text-4xl mb-2">payments</span>
                  <p class="text-sm font-medium">No fees recorded</p>
                  <p class="text-xs mt-1">Application fees and payment tracking will appear here.</p>
                </div>
              </ng-template>
            </div>

            <!-- Timeline Tab -->
            <div
              *ngIf="activeTab() === 'timeline'"
              id="panel-timeline"
              role="tabpanel"
              aria-labelledby="tab-timeline">
              <div *ngIf="application()!.milestones.length > 0; else noMilestones">
                <div class="space-y-4">
                  <div
                    *ngFor="let milestone of application()!.milestones"
                    class="flex items-start gap-4 p-3 rounded-lg border"
                    [ngClass]="{
                      'border-error/30 bg-error/5': milestone.status === 'Overdue',
                      'border-success/30 bg-success/5': milestone.status === 'Completed',
                      'border-base-200 bg-base-100': milestone.status === 'Pending'
                    }">
                    <div
                      class="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                      [ngClass]="{
                        'bg-error/10 text-error': milestone.status === 'Overdue',
                        'bg-success/10 text-success': milestone.status === 'Completed',
                        'bg-base-200 text-base-content/50': milestone.status === 'Pending'
                      }">
                      <span class="material-symbols-outlined text-lg">
                        {{ getMilestoneIcon(milestone.status) }}
                      </span>
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center justify-between gap-2">
                        <span class="text-sm font-medium text-base-content">{{ formatMilestoneType(milestone.milestoneType) }}</span>
                        <span class="badge badge-sm" [ngClass]="getMilestoneStatusBadge(milestone.status)">
                          {{ milestone.status }}
                        </span>
                      </div>
                      <div class="flex items-center gap-4 mt-1 text-xs text-base-content/60">
                        <span>Target: {{ milestone.targetDate | date:'dd MMM yyyy' }}</span>
                        <span *ngIf="milestone.actualDate">Actual: {{ milestone.actualDate | date:'dd MMM yyyy' }}</span>
                        <span *ngIf="milestone.varianceDays !== null"
                              [ngClass]="milestone.varianceDays! > 0 ? 'text-error' : 'text-success'">
                          {{ milestone.varianceDays! > 0 ? '+' : '' }}{{ milestone.varianceDays }} days
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <ng-template #noMilestones>
                <div class="flex flex-col items-center justify-center py-8 text-base-content/50">
                  <span class="material-symbols-outlined text-4xl mb-2">timeline</span>
                  <p class="text-sm font-medium">No milestones recorded</p>
                  <p class="text-xs mt-1">Key dates and deadlines will appear here once milestones are created.</p>
                </div>
              </ng-template>
            </div>

            <!-- Appeals Tab -->
            <div
              *ngIf="activeTab() === 'appeals'"
              id="panel-appeals"
              role="tabpanel"
              aria-labelledby="tab-appeals">
              <div *ngIf="application()!.appeals.length > 0; else noAppeals">
                <div class="space-y-4">
                  <div *ngFor="let appeal of application()!.appeals" class="card bg-base-200/30 border border-base-200">
                    <div class="card-body p-4">
                      <div class="flex items-start justify-between gap-4">
                        <div class="flex-1 min-w-0">
                          <div class="flex items-center gap-2 mb-2">
                            <span class="badge badge-sm badge-outline">{{ formatAppealType(appeal.appealType) }}</span>
                            <span class="badge badge-sm" [ngClass]="getAppealStatusBadge(appeal.status)">
                              {{ formatAppealStatus(appeal.status) }}
                            </span>
                          </div>
                          <p class="text-sm text-base-content/80 line-clamp-3">{{ appeal.appealGrounds }}</p>
                          <div class="flex items-center gap-4 mt-2 text-xs text-base-content/60">
                            <span>Lodged: {{ appeal.lodgedDate | date:'dd MMM yyyy' }}</span>
                            <span *ngIf="appeal.decisionDate">Decision: {{ appeal.decisionDate | date:'dd MMM yyyy' }}</span>
                          </div>
                          <p *ngIf="appeal.decisionSummary" class="text-xs text-base-content/70 mt-2 italic">
                            "{{ appeal.decisionSummary }}"
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <ng-template #noAppeals>
                <div class="flex flex-col items-center justify-center py-8 text-base-content/50">
                  <span class="material-symbols-outlined text-4xl mb-2">gavel</span>
                  <p class="text-sm font-medium">No appeals submitted</p>
                  <p class="text-xs mt-1">Appeals can be submitted when an application is refused.</p>
                </div>
              </ng-template>
            </div>

            <!-- Activity Tab -->
            <div
              *ngIf="activeTab() === 'activity'"
              id="panel-activity"
              role="tabpanel"
              aria-labelledby="tab-activity">
              <div class="space-y-3">
                <!-- Creation Entry -->
                <div class="flex items-start gap-3 p-3 rounded-lg bg-base-200/30 border border-base-200">
                  <div class="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                    <span class="material-symbols-outlined text-sm">add_circle</span>
                  </div>
                  <div>
                    <p class="text-sm text-base-content">Application created</p>
                    <p class="text-xs text-base-content/60 mt-0.5">
                      {{ application()!.createdBy }} · {{ application()!.createdAt | date:'dd MMM yyyy, HH:mm' }}
                    </p>
                  </div>
                </div>

                <!-- Status Updates (if updated) -->
                <div *ngIf="application()!.updatedAt" class="flex items-start gap-3 p-3 rounded-lg bg-base-200/30 border border-base-200">
                  <div class="w-8 h-8 rounded-full bg-info/10 text-info flex items-center justify-center flex-shrink-0">
                    <span class="material-symbols-outlined text-sm">edit</span>
                  </div>
                  <div>
                    <p class="text-sm text-base-content">Application updated</p>
                    <p class="text-xs text-base-content/60 mt-0.5">
                      {{ application()!.updatedBy ?? 'System' }} · {{ application()!.updatedAt | date:'dd MMM yyyy, HH:mm' }}
                    </p>
                  </div>
                </div>

                <!-- Decision Recorded -->
                <div *ngIf="application()!.decisionDate" class="flex items-start gap-3 p-3 rounded-lg bg-base-200/30 border border-base-200">
                  <div class="w-8 h-8 rounded-full bg-warning/10 text-warning flex items-center justify-center flex-shrink-0">
                    <span class="material-symbols-outlined text-sm">rule</span>
                  </div>
                  <div>
                    <p class="text-sm text-base-content">Decision recorded: {{ formatStatus(application()!.status) }}</p>
                    <p class="text-xs text-base-content/60 mt-0.5">
                      {{ application()!.decisionDate | date:'dd MMM yyyy' }}
                    </p>
                  </div>
                </div>

                <!-- Minimal guidance when no rich activity data -->
                <div *ngIf="!application()!.updatedAt && !application()!.decisionDate" class="text-center py-4">
                  <p class="text-xs text-base-content/50">Full audit trail available in the Activity module once more actions are recorded.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  `
})
export class ApplicationDetailContainer implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly store = inject(Store);
  private readonly applicationService = inject(PlanningApplicationService);
  private readonly destroyRef = inject(DestroyRef);

  /** Reactive state signals */
  readonly application = signal<IApplicationDetail | null>(null);
  readonly loading = signal<boolean>(true);
  readonly error = signal<string | null>(null);
  readonly activeTab = signal<string>('overview');

  /** Tab configuration with dynamic counts */
  get tabs(): readonly { id: string; label: string; icon: string; count?: number }[] {
    const app = this.application();
    return [
      { id: 'overview', label: 'Overview', icon: 'info' },
      { id: 'conditions', label: 'Conditions', icon: 'checklist', count: app?.conditions.length ?? 0 },
      { id: 'documents', label: 'Documents', icon: 'folder', count: app?.documents.length ?? 0 },
      { id: 'fees', label: 'Fees', icon: 'payments', count: app?.fees.length ?? 0 },
      { id: 'timeline', label: 'Timeline', icon: 'timeline', count: app?.milestones.length ?? 0 },
      { id: 'appeals', label: 'Appeals', icon: 'gavel', count: app?.appeals.length ?? 0 },
      { id: 'activity', label: 'Activity', icon: 'history' }
    ];
  }

  /**
   * The ordered lifecycle statuses for the progress indicator.
   * Withdrawn and Appeal are not shown in the linear flow.
   */
  private readonly lifecycleOrder: PlanningApplicationStatus[] = [
    PlanningApplicationStatus.PreApplication,
    PlanningApplicationStatus.Submitted,
    PlanningApplicationStatus.Validated,
    PlanningApplicationStatus.UnderReview,
    PlanningApplicationStatus.CommitteeReview,
    PlanningApplicationStatus.Approved
  ];

  /**
   * Computed status steps for the progress indicator.
   */
  readonly statusSteps = computed<IStatusStep[]>(() => {
    const app = this.application();
    if (!app) return [];

    const currentStatus = app.status as PlanningApplicationStatus;

    // Handle non-linear statuses
    if (currentStatus === PlanningApplicationStatus.Withdrawn) {
      return this.lifecycleOrder.map((status) => ({
        status,
        label: this.formatStatus(status),
        state: 'future' as const
      }));
    }

    // ApprovedWithConditions and Refused replace Approved in the display
    let displayOrder = [...this.lifecycleOrder];
    if (currentStatus === PlanningApplicationStatus.ApprovedWithConditions) {
      displayOrder[displayOrder.length - 1] = PlanningApplicationStatus.ApprovedWithConditions;
    } else if (currentStatus === PlanningApplicationStatus.Refused) {
      displayOrder[displayOrder.length - 1] = PlanningApplicationStatus.Refused;
    } else if (currentStatus === PlanningApplicationStatus.Appeal) {
      displayOrder = [...this.lifecycleOrder.slice(0, -1), PlanningApplicationStatus.Refused, PlanningApplicationStatus.Appeal];
    }

    const currentIndex = displayOrder.indexOf(currentStatus);

    return displayOrder.map((status, index) => ({
      status,
      label: this.formatStatus(status),
      state: index < currentIndex ? 'completed' as const
           : index === currentIndex ? 'current' as const
           : 'future' as const
    }));
  });

  /**
   * Computed contextual action buttons based on application status.
   */
  readonly actionButtons = computed<IActionButton[]>(() => {
    const app = this.application();
    if (!app) return [];

    const buttons: IActionButton[] = [];
    const status = app.status as PlanningApplicationStatus;

    // Status-specific forward transition actions
    switch (status) {
      case PlanningApplicationStatus.PreApplication:
        buttons.push({
          label: 'Submit Application',
          icon: 'send',
          cssClass: 'btn-primary',
          action: () => this.transitionStatus(PlanningApplicationStatus.Submitted)
        });
        break;
      case PlanningApplicationStatus.Submitted:
        buttons.push({
          label: 'Mark Validated',
          icon: 'verified',
          cssClass: 'btn-primary',
          action: () => this.transitionStatus(PlanningApplicationStatus.Validated)
        });
        break;
      case PlanningApplicationStatus.Validated:
        buttons.push({
          label: 'Begin Review',
          icon: 'rate_review',
          cssClass: 'btn-primary',
          action: () => this.transitionStatus(PlanningApplicationStatus.UnderReview)
        });
        break;
      case PlanningApplicationStatus.UnderReview:
        buttons.push({
          label: 'Committee Review',
          icon: 'groups',
          cssClass: 'btn-primary',
          action: () => this.transitionStatus(PlanningApplicationStatus.CommitteeReview)
        });
        buttons.push({
          label: 'Approve',
          icon: 'check_circle',
          cssClass: 'btn-success',
          action: () => this.transitionStatus(PlanningApplicationStatus.Approved)
        });
        break;
      case PlanningApplicationStatus.CommitteeReview:
        buttons.push({
          label: 'Approve',
          icon: 'check_circle',
          cssClass: 'btn-success',
          action: () => this.transitionStatus(PlanningApplicationStatus.Approved)
        });
        buttons.push({
          label: 'Approve with Conditions',
          icon: 'task_alt',
          cssClass: 'btn-info',
          action: () => this.transitionStatus(PlanningApplicationStatus.ApprovedWithConditions)
        });
        break;
      case PlanningApplicationStatus.Refused:
        buttons.push({
          label: 'Lodge Appeal',
          icon: 'gavel',
          cssClass: 'btn-warning',
          action: () => this.transitionStatus(PlanningApplicationStatus.Appeal)
        });
        break;
    }

    // Withdraw action — available on non-terminal statuses
    const terminalStatuses: PlanningApplicationStatus[] = [
      PlanningApplicationStatus.Approved,
      PlanningApplicationStatus.ApprovedWithConditions,
      PlanningApplicationStatus.Refused,
      PlanningApplicationStatus.Withdrawn,
      PlanningApplicationStatus.Appeal
    ];

    if (!terminalStatuses.includes(status)) {
      buttons.push({
        label: 'Withdraw',
        icon: 'cancel',
        cssClass: 'btn-error btn-outline',
        action: () => this.transitionStatus(PlanningApplicationStatus.Withdrawn)
      });
    }

    return buttons;
  });

  /** Computed fee aggregations */
  readonly totalFees = computed<number>(() => {
    const app = this.application();
    return app ? app.fees.reduce((sum: number, f: IPlanningFee) => sum + f.amount, 0) : 0;
  });

  readonly paidFees = computed<number>(() => {
    const app = this.application();
    return app ? app.fees.filter((f: IPlanningFee) => f.paymentStatus === PaymentStatus.Paid).reduce((sum: number, f: IPlanningFee) => sum + f.amount, 0) : 0;
  });

  readonly pendingFees = computed<number>(() => {
    const app = this.application();
    return app ? app.fees.filter((f: IPlanningFee) => f.paymentStatus === PaymentStatus.Pending).reduce((sum: number, f: IPlanningFee) => sum + f.amount, 0) : 0;
  });

  readonly awaitingApprovalFees = computed<number>(() => {
    const app = this.application();
    return app ? app.fees.filter((f: IPlanningFee) => f.paymentStatus === PaymentStatus.AwaitingApproval).reduce((sum: number, f: IPlanningFee) => sum + f.amount, 0) : 0;
  });

  ngOnInit(): void {
    this.loadApplication();
  }

  /**
   * Loads the application detail from the API using the route param :id.
   */
  loadApplication(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error.set('No application ID provided in the URL.');
      this.loading.set(false);
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.applicationService
      .getById(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response: IApiResponse<IApplicationDetail>) => {
          if (response.success && response.data) {
            this.application.set(response.data);
            this.store.dispatch(ApplicationActions.selectApplication({ id }));
          } else {
            this.error.set(response.errors?.[0] ?? 'Failed to load application details.');
          }
          this.loading.set(false);
        },
        error: (err: { message?: string }) => {
          this.error.set(err?.message ?? 'An unexpected error occurred while loading application details.');
          this.loading.set(false);
        }
      });
  }

  /** Switch the active tab */
  setActiveTab(tabId: string): void {
    this.activeTab.set(tabId);
  }

  /**
   * Transitions the application to a new status via the store.
   */
  transitionStatus(targetStatus: PlanningApplicationStatus): void {
    const app = this.application();
    if (!app) return;

    this.store.dispatch(
      ApplicationActions.transitionStatus({
        id: app.id,
        payload: { newStatus: targetStatus }
      })
    );

    // Reload the detail to reflect the updated state
    setTimeout(() => this.loadApplication(), 500);
  }

  /** Get 1-based index for step display */
  getStepIndex(status: PlanningApplicationStatus): number {
    const steps = this.statusSteps();
    const idx = steps.findIndex((s: IStatusStep) => s.status === status);
    return idx + 1;
  }

  // ─── Formatting Helpers ─────────────────────────────────────────────

  formatStatus(status: string): string {
    switch (status) {
      case PlanningApplicationStatus.PreApplication: return 'Pre-Application';
      case PlanningApplicationStatus.Submitted: return 'Submitted';
      case PlanningApplicationStatus.Validated: return 'Validated';
      case PlanningApplicationStatus.UnderReview: return 'Under Review';
      case PlanningApplicationStatus.CommitteeReview: return 'Committee Review';
      case PlanningApplicationStatus.Approved: return 'Approved';
      case PlanningApplicationStatus.ApprovedWithConditions: return 'Approved (Conditions)';
      case PlanningApplicationStatus.Refused: return 'Refused';
      case PlanningApplicationStatus.Appeal: return 'Appeal';
      case PlanningApplicationStatus.Withdrawn: return 'Withdrawn';
      default: return status.replace(/([a-z])([A-Z])/g, '$1 $2');
    }
  }

  formatApplicationType(type: string): string {
    switch (type) {
      case PlanningApplicationType.Full: return 'Full';
      case PlanningApplicationType.Outline: return 'Outline';
      case PlanningApplicationType.ReservedMatters: return 'Reserved Matters';
      case PlanningApplicationType.Householder: return 'Householder';
      case PlanningApplicationType.ListedBuilding: return 'Listed Building';
      case PlanningApplicationType.ChangeOfUse: return 'Change of Use';
      default: return type.replace(/([a-z])([A-Z])/g, '$1 $2');
    }
  }

  formatConditionType(type: string): string {
    switch (type) {
      case ConditionType.PreCommencement: return 'Pre-Commencement';
      case ConditionType.PreOccupation: return 'Pre-Occupation';
      case ConditionType.DuringConstruction: return 'During Construction';
      case ConditionType.Compliance: return 'Compliance';
      default: return type.replace(/([a-z])([A-Z])/g, '$1 $2');
    }
  }

  formatConditionStatus(status: string): string {
    switch (status) {
      case ConditionStatus.Outstanding: return 'Outstanding';
      case ConditionStatus.SubmittedForDischarge: return 'Submitted';
      case ConditionStatus.Discharged: return 'Discharged';
      case ConditionStatus.Rejected: return 'Rejected';
      default: return status.replace(/([a-z])([A-Z])/g, '$1 $2');
    }
  }

  formatDocumentType(type: string): string {
    return type
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2');
  }

  formatFeeType(type: string): string {
    switch (type) {
      case FeeType.ApplicationFee: return 'Application';
      case FeeType.PreApplicationFee: return 'Pre-Application';
      case FeeType.ConditionDischargeFee: return 'Condition Discharge';
      case FeeType.AppealFee: return 'Appeal';
      case FeeType.SupplementaryFee: return 'Supplementary';
      default: return type.replace(/([a-z])([A-Z])/g, '$1 $2');
    }
  }

  formatPaymentStatus(status: string): string {
    switch (status) {
      case PaymentStatus.Pending: return 'Pending';
      case PaymentStatus.AwaitingApproval: return 'Awaiting Approval';
      case PaymentStatus.Approved: return 'Approved';
      case PaymentStatus.Rejected: return 'Rejected';
      case PaymentStatus.Paid: return 'Paid';
      default: return status.replace(/([a-z])([A-Z])/g, '$1 $2');
    }
  }

  formatMilestoneType(type: string): string {
    return type
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2');
  }

  formatAppealType(type: string): string {
    switch (type) {
      case 'WrittenRepresentations': return 'Written Representations';
      case 'Hearing': return 'Hearing';
      case 'PublicInquiry': return 'Public Inquiry';
      default: return type.replace(/([a-z])([A-Z])/g, '$1 $2');
    }
  }

  formatAppealStatus(status: string): string {
    switch (status) {
      case AppealStatus.Lodged: return 'Lodged';
      case AppealStatus.UnderReview: return 'Under Review';
      case AppealStatus.HearingScheduled: return 'Hearing Scheduled';
      case AppealStatus.Allowed: return 'Allowed';
      case AppealStatus.Dismissed: return 'Dismissed';
      case AppealStatus.Closed: return 'Closed';
      default: return status.replace(/([a-z])([A-Z])/g, '$1 $2');
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
  }

  // ─── Badge CSS Helpers ────────────────────────────────────────────

  getStatusBadge(status: string): string {
    switch (status) {
      case PlanningApplicationStatus.PreApplication: return 'badge-ghost';
      case PlanningApplicationStatus.Submitted: return 'badge-info';
      case PlanningApplicationStatus.Validated: return 'badge-info';
      case PlanningApplicationStatus.UnderReview: return 'badge-warning';
      case PlanningApplicationStatus.CommitteeReview: return 'badge-warning';
      case PlanningApplicationStatus.Approved: return 'badge-success';
      case PlanningApplicationStatus.ApprovedWithConditions: return 'badge-success';
      case PlanningApplicationStatus.Refused: return 'badge-error';
      case PlanningApplicationStatus.Appeal: return 'badge-warning';
      case PlanningApplicationStatus.Withdrawn: return 'badge-neutral';
      default: return 'badge-ghost';
    }
  }

  getApplicationTypeBadge(type: string): string {
    switch (type) {
      case PlanningApplicationType.Full: return 'badge-primary badge-outline';
      case PlanningApplicationType.Outline: return 'badge-secondary badge-outline';
      case PlanningApplicationType.ReservedMatters: return 'badge-accent badge-outline';
      case PlanningApplicationType.Householder: return 'badge-info badge-outline';
      case PlanningApplicationType.ListedBuilding: return 'badge-warning badge-outline';
      case PlanningApplicationType.ChangeOfUse: return 'badge-neutral badge-outline';
      default: return 'badge-ghost badge-outline';
    }
  }

  getConditionStatusBadge(status: string): string {
    switch (status) {
      case ConditionStatus.Outstanding: return 'badge-warning';
      case ConditionStatus.SubmittedForDischarge: return 'badge-info';
      case ConditionStatus.Discharged: return 'badge-success';
      case ConditionStatus.Rejected: return 'badge-error';
      default: return 'badge-ghost';
    }
  }

  getPaymentStatusBadge(status: string): string {
    switch (status) {
      case PaymentStatus.Pending: return 'badge-warning';
      case PaymentStatus.AwaitingApproval: return 'badge-info';
      case PaymentStatus.Approved: return 'badge-success';
      case PaymentStatus.Rejected: return 'badge-error';
      case PaymentStatus.Paid: return 'badge-success';
      default: return 'badge-ghost';
    }
  }

  getMilestoneStatusBadge(status: string): string {
    switch (status) {
      case MilestoneStatus.Pending: return 'badge-ghost';
      case MilestoneStatus.Completed: return 'badge-success';
      case MilestoneStatus.Overdue: return 'badge-error';
      default: return 'badge-ghost';
    }
  }

  getMilestoneIcon(status: string): string {
    switch (status) {
      case MilestoneStatus.Completed: return 'check_circle';
      case MilestoneStatus.Overdue: return 'warning';
      case MilestoneStatus.Pending:
      default: return 'schedule';
    }
  }

  getAppealStatusBadge(status: string): string {
    switch (status) {
      case AppealStatus.Lodged: return 'badge-info';
      case AppealStatus.UnderReview: return 'badge-warning';
      case AppealStatus.HearingScheduled: return 'badge-warning';
      case AppealStatus.Allowed: return 'badge-success';
      case AppealStatus.Dismissed: return 'badge-error';
      case AppealStatus.Closed: return 'badge-neutral';
      default: return 'badge-ghost';
    }
  }
}
