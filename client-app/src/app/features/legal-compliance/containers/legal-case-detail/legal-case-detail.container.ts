import {
  Component,
  ChangeDetectionStrategy,
  OnInit,
  inject,
  signal,
  computed,
  DestroyRef
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';

import { LegalCaseService } from '../../services/legal-case.service';
import { LegalCasesActions } from '../../store/legal-cases/legal-cases.actions';
import {
  ILegalCaseDetail,
  IApiResponse,
  LegalCaseStatus,
  LegalCaseType,
  LegalCasePriority
} from '../../models';
import { StatusTransitionDialogComponent } from '../../components/status-transition-dialog/status-transition-dialog.component';

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
  readonly status: LegalCaseStatus;
  readonly label: string;
  readonly state: 'completed' | 'current' | 'future';
}

/**
 * Tab definition for the detail view.
 */
interface ITab {
  readonly id: string;
  readonly label: string;
  readonly icon: string;
}

/**
 * Valid status transitions for a legal case state machine.
 * Used to determine permitted transitions from the current status.
 */
const LEGAL_CASE_TRANSITIONS: Record<LegalCaseStatus, readonly LegalCaseStatus[]> = {
  [LegalCaseStatus.Open]: [LegalCaseStatus.InProgress, LegalCaseStatus.OnHold],
  [LegalCaseStatus.InProgress]: [LegalCaseStatus.UnderReview, LegalCaseStatus.OnHold, LegalCaseStatus.Escalated],
  [LegalCaseStatus.UnderReview]: [LegalCaseStatus.Resolved, LegalCaseStatus.Escalated, LegalCaseStatus.InProgress],
  [LegalCaseStatus.OnHold]: [LegalCaseStatus.Open, LegalCaseStatus.InProgress],
  [LegalCaseStatus.Escalated]: [LegalCaseStatus.InProgress, LegalCaseStatus.UnderReview],
  [LegalCaseStatus.Resolved]: [LegalCaseStatus.Closed],
  [LegalCaseStatus.Closed]: [LegalCaseStatus.Reopened],
  [LegalCaseStatus.Reopened]: [LegalCaseStatus.InProgress]
};

/**
 * Ordered list of statuses representing the canonical lifecycle path.
 * Used to display the progress indicator.
 */
const STATUS_LIFECYCLE_ORDER: readonly LegalCaseStatus[] = [
  LegalCaseStatus.Open,
  LegalCaseStatus.InProgress,
  LegalCaseStatus.UnderReview,
  LegalCaseStatus.Resolved,
  LegalCaseStatus.Closed
];

/**
 * LegalCaseDetailContainer — Smart container that displays
 * the full detail view of a single legal case.
 *
 * - Loads case detail from the service using route param :id
 * - Displays header with case summary (Title, CaseReference, CaseType, Status, Priority, AssignedSolicitor, SolicitorFirm)
 * - Shows a status progress indicator for lifecycle position
 * - DaisyUI Tabs: Overview, Contracts, Documents, Compliance, Insurance, Activity
 * - Contextual action buttons (transition status, edit) based on current status
 * - Uses status-transition-dialog component for transitions
 *
 * Requirements: 15.1, 15.2, 15.5, 15.6, 15.7
 */
@Component({
  selector: 'app-legal-case-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe, StatusTransitionDialogComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Loading Skeleton -->
    <div *ngIf="loading()" class="p-6 space-y-6 animate-pulse" aria-busy="true" aria-label="Loading legal case details">
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
            <div *ngFor="let i of [1,2,3,4,5,6]" class="h-8 w-24 bg-base-300 rounded"></div>
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
          <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <h2 class="text-lg font-semibold text-base-content">Unable to load legal case</h2>
          <p class="text-sm text-base-content/60">{{ error() }}</p>
          <button class="btn btn-primary btn-sm" (click)="loadCase()">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Retry
          </button>
        </div>
      </div>
    </div>

    <!-- Legal Case Detail Content -->
    <div *ngIf="!loading() && !error() && legalCase()" class="p-6 space-y-6">
      <!-- Breadcrumb Navigation -->
      <nav aria-label="Breadcrumb">
        <ol class="flex items-center gap-2 text-sm text-base-content/60">
          <li>
            <a routerLink="/legal-compliance" class="hover:text-primary transition-colors">Legal & Compliance</a>
          </li>
          <li>
            <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </li>
          <li>
            <a routerLink="/legal-compliance/cases" class="hover:text-primary transition-colors">Cases</a>
          </li>
          <li>
            <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </li>
          <li class="text-base-content font-medium truncate max-w-xs">{{ legalCase()!.caseReference }}</li>
        </ol>
      </nav>

      <!-- Header Card -->
      <section aria-label="Legal Case Summary">
        <div class="card bg-base-100 shadow-sm border border-base-200">
          <div class="card-body p-6">
            <!-- Top Row: Title + Actions -->
            <div class="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
              <!-- Left: Title and Metadata -->
              <div class="flex flex-col gap-2">
                <div class="flex items-center gap-3 flex-wrap">
                  <h1 class="text-2xl font-bold text-base-content">{{ legalCase()!.title }}</h1>
                  <span class="badge badge-sm" [ngClass]="getCaseTypeBadge(legalCase()!.caseType)">
                    {{ formatCaseType(legalCase()!.caseType) }}
                  </span>
                  <span class="badge badge-sm" [ngClass]="getStatusBadge(legalCase()!.status)">
                    {{ formatStatus(legalCase()!.status) }}
                  </span>
                  <span class="badge badge-sm" [ngClass]="getPriorityBadge(legalCase()!.priority)">
                    {{ legalCase()!.priority }}
                  </span>
                </div>
                <div class="flex flex-wrap items-center gap-4 text-sm text-base-content/70">
                  <span class="flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                    </svg>
                    {{ legalCase()!.caseReference }}
                  </span>
                  <span *ngIf="legalCase()!.assignedSolicitor" class="flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    {{ legalCase()!.assignedSolicitor }}
                  </span>
                  <span *ngIf="legalCase()!.solicitorFirm" class="flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    {{ legalCase()!.solicitorFirm }}
                  </span>
                  <span class="flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Created: {{ legalCase()!.createdAt | date:'dd MMM yyyy' }}
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
                  {{ btn.label }}
                </button>
              </div>
            </div>

            <!-- Status Progress Indicator -->
            <div class="mt-4 pt-4 border-t border-base-200">
              <div class="flex items-center justify-between gap-1 overflow-x-auto" role="progressbar" aria-label="Legal case lifecycle progress">
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
                      <svg *ngIf="step.state === 'completed'" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                      </svg>
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
      <section aria-label="Legal Case Details">
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
                {{ tab.label }}
              </button>
            </div>

            <!-- Overview Tab -->
            <div
              *ngIf="activeTab() === 'overview'"
              id="panel-overview"
              role="tabpanel"
              aria-labelledby="tab-overview">
              <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <!-- Case Details -->
                <div class="space-y-4">
                  <h3 class="text-base font-semibold text-base-content">Case Details</h3>
                  <div class="grid grid-cols-2 gap-3">
                    <div class="flex flex-col gap-0.5">
                      <span class="text-xs text-base-content/50 uppercase font-medium">Case Reference</span>
                      <span class="text-sm text-base-content font-mono">{{ legalCase()!.caseReference }}</span>
                    </div>
                    <div class="flex flex-col gap-0.5">
                      <span class="text-xs text-base-content/50 uppercase font-medium">Case Type</span>
                      <span class="badge badge-sm badge-outline">{{ formatCaseType(legalCase()!.caseType) }}</span>
                    </div>
                    <div class="flex flex-col gap-0.5">
                      <span class="text-xs text-base-content/50 uppercase font-medium">Status</span>
                      <span class="badge badge-sm" [ngClass]="getStatusBadge(legalCase()!.status)">{{ formatStatus(legalCase()!.status) }}</span>
                    </div>
                    <div class="flex flex-col gap-0.5">
                      <span class="text-xs text-base-content/50 uppercase font-medium">Priority</span>
                      <span class="badge badge-sm" [ngClass]="getPriorityBadge(legalCase()!.priority)">{{ legalCase()!.priority }}</span>
                    </div>
                    <div class="flex flex-col gap-0.5">
                      <span class="text-xs text-base-content/50 uppercase font-medium">Created</span>
                      <span class="text-sm text-base-content">{{ legalCase()!.createdAt | date:'dd MMM yyyy, HH:mm' }}</span>
                    </div>
                    <div class="flex flex-col gap-0.5">
                      <span class="text-xs text-base-content/50 uppercase font-medium">Created By</span>
                      <span class="text-sm text-base-content">{{ legalCase()!.createdBy }}</span>
                    </div>
                    <div *ngIf="legalCase()!.updatedAt" class="flex flex-col gap-0.5">
                      <span class="text-xs text-base-content/50 uppercase font-medium">Last Updated</span>
                      <span class="text-sm text-base-content">{{ legalCase()!.updatedAt | date:'dd MMM yyyy, HH:mm' }}</span>
                    </div>
                    <div *ngIf="legalCase()!.resolutionDate" class="flex flex-col gap-0.5">
                      <span class="text-xs text-base-content/50 uppercase font-medium">Resolution Date</span>
                      <span class="text-sm text-base-content">{{ legalCase()!.resolutionDate | date:'dd MMM yyyy' }}</span>
                    </div>
                    <div class="flex flex-col gap-0.5 col-span-2">
                      <span class="text-xs text-base-content/50 uppercase font-medium">Description</span>
                      <span class="text-sm text-base-content">{{ legalCase()!.description }}</span>
                    </div>
                    <div *ngIf="legalCase()!.resolutionSummary" class="flex flex-col gap-0.5 col-span-2">
                      <span class="text-xs text-base-content/50 uppercase font-medium">Resolution Summary</span>
                      <span class="text-sm text-base-content">{{ legalCase()!.resolutionSummary }}</span>
                    </div>
                    <div *ngIf="legalCase()!.escalationReason" class="flex flex-col gap-0.5 col-span-2">
                      <span class="text-xs text-base-content/50 uppercase font-medium">Escalation Reason</span>
                      <span class="text-sm text-error">{{ legalCase()!.escalationReason }}</span>
                    </div>
                    <div *ngIf="legalCase()!.holdReason" class="flex flex-col gap-0.5 col-span-2">
                      <span class="text-xs text-base-content/50 uppercase font-medium">Hold Reason</span>
                      <span class="text-sm text-warning">{{ legalCase()!.holdReason }}</span>
                    </div>
                    <div *ngIf="legalCase()!.notes" class="flex flex-col gap-0.5 col-span-2">
                      <span class="text-xs text-base-content/50 uppercase font-medium">Notes</span>
                      <span class="text-sm text-base-content whitespace-pre-line">{{ legalCase()!.notes }}</span>
                    </div>
                  </div>
                </div>

                <!-- Solicitor Details -->
                <div class="space-y-4">
                  <h3 class="text-base font-semibold text-base-content">Solicitor Details</h3>
                  <div *ngIf="legalCase()!.assignedSolicitor; else noSolicitor">
                    <div class="grid grid-cols-2 gap-3">
                      <div class="flex flex-col gap-0.5">
                        <span class="text-xs text-base-content/50 uppercase font-medium">Solicitor</span>
                        <span class="text-sm text-base-content">{{ legalCase()!.assignedSolicitor }}</span>
                      </div>
                      <div *ngIf="legalCase()!.solicitorFirm" class="flex flex-col gap-0.5">
                        <span class="text-xs text-base-content/50 uppercase font-medium">Firm</span>
                        <span class="text-sm text-base-content">{{ legalCase()!.solicitorFirm }}</span>
                      </div>
                      <div *ngIf="legalCase()!.solicitorEmail" class="flex flex-col gap-0.5">
                        <span class="text-xs text-base-content/50 uppercase font-medium">Email</span>
                        <a [href]="'mailto:' + legalCase()!.solicitorEmail" class="text-sm text-primary hover:underline">{{ legalCase()!.solicitorEmail }}</a>
                      </div>
                      <div *ngIf="legalCase()!.solicitorPhone" class="flex flex-col gap-0.5">
                        <span class="text-xs text-base-content/50 uppercase font-medium">Phone</span>
                        <a [href]="'tel:' + legalCase()!.solicitorPhone" class="text-sm text-primary hover:underline">{{ legalCase()!.solicitorPhone }}</a>
                      </div>
                    </div>
                  </div>
                  <ng-template #noSolicitor>
                    <div class="flex flex-col items-center justify-center py-4 text-base-content/50">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <p class="text-sm">No solicitor assigned yet.</p>
                    </div>
                  </ng-template>

                  <!-- Case Statistics -->
                  <h3 class="text-base font-semibold text-base-content mt-6">Related Records</h3>
                  <div class="grid grid-cols-3 gap-3">
                    <div class="p-3 rounded-lg bg-base-200/50 border border-base-200 text-center">
                      <p class="text-lg font-bold text-base-content">{{ legalCase()!.contractCount }}</p>
                      <p class="text-xs text-base-content/50">Contracts</p>
                    </div>
                    <div class="p-3 rounded-lg bg-base-200/50 border border-base-200 text-center">
                      <p class="text-lg font-bold text-base-content">{{ legalCase()!.documentCount }}</p>
                      <p class="text-xs text-base-content/50">Documents</p>
                    </div>
                    <div class="p-3 rounded-lg bg-base-200/50 border border-base-200 text-center">
                      <p class="text-lg font-bold text-base-content">{{ legalCase()!.insuranceCount }}</p>
                      <p class="text-xs text-base-content/50">Insurance</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Contracts Tab -->
            <div
              *ngIf="activeTab() === 'contracts'"
              id="panel-contracts"
              role="tabpanel"
              aria-labelledby="tab-contracts">
              <div class="flex flex-col items-center justify-center py-8 text-base-content/50">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p class="text-sm font-medium">Contracts</p>
                <p class="text-xs mt-1">Contracts linked to this legal case will appear here once added.</p>
              </div>
            </div>

            <!-- Documents Tab -->
            <div
              *ngIf="activeTab() === 'documents'"
              id="panel-documents"
              role="tabpanel"
              aria-labelledby="tab-documents">
              <div class="flex flex-col items-center justify-center py-8 text-base-content/50">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                <p class="text-sm font-medium">Documents</p>
                <p class="text-xs mt-1">Legal documents uploaded against this case will appear here.</p>
              </div>
            </div>

            <!-- Compliance Tab -->
            <div
              *ngIf="activeTab() === 'compliance'"
              id="panel-compliance"
              role="tabpanel"
              aria-labelledby="tab-compliance">
              <div class="flex flex-col items-center justify-center py-8 text-base-content/50">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <p class="text-sm font-medium">Compliance</p>
                <p class="text-xs mt-1">Compliance requirements and checks related to this case will appear here.</p>
              </div>
            </div>

            <!-- Insurance Tab -->
            <div
              *ngIf="activeTab() === 'insurance'"
              id="panel-insurance"
              role="tabpanel"
              aria-labelledby="tab-insurance">
              <div class="flex flex-col items-center justify-center py-8 text-base-content/50">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <p class="text-sm font-medium">Insurance</p>
                <p class="text-xs mt-1">Insurance records linked to this legal case will appear here.</p>
              </div>
            </div>

            <!-- Activity Tab -->
            <div
              *ngIf="activeTab() === 'activity'"
              id="panel-activity"
              role="tabpanel"
              aria-labelledby="tab-activity">
              <div class="flex flex-col items-center justify-center py-8 text-base-content/50">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p class="text-sm font-medium">Activity</p>
                <p class="text-xs mt-1">A chronological timeline of status changes and audit events will appear here.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>

    <!-- Status Transition Dialog -->
    <app-status-transition-dialog
      [open]="showTransitionDialog()"
      [currentStatus]="legalCase()?.status ?? ''"
      [permittedTransitions]="permittedTransitions()"
      entityType="Legal Case"
      (transitionSelected)="onTransitionSelected($event)"
      (dialogClosed)="closeTransitionDialog()">
    </app-status-transition-dialog>
  `
})
export class LegalCaseDetailContainer implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly store = inject(Store);
  private readonly legalCaseService = inject(LegalCaseService);
  private readonly destroyRef = inject(DestroyRef);

  /** The loaded legal case detail. */
  readonly legalCase = signal<ILegalCaseDetail | null>(null);

  /** Loading state. */
  readonly loading = signal<boolean>(true);

  /** Error message from failed API call. */
  readonly error = signal<string | null>(null);

  /** Currently active tab. */
  readonly activeTab = signal<string>('overview');

  /** Controls visibility of the status transition dialog. */
  readonly showTransitionDialog = signal<boolean>(false);

  /** Tab definitions */
  readonly tabs: readonly ITab[] = [
    { id: 'overview', label: 'Overview', icon: 'info' },
    { id: 'contracts', label: 'Contracts', icon: 'description' },
    { id: 'documents', label: 'Documents', icon: 'folder' },
    { id: 'compliance', label: 'Compliance', icon: 'verified_user' },
    { id: 'insurance', label: 'Insurance', icon: 'shield' },
    { id: 'activity', label: 'Activity', icon: 'history' }
  ];

  /** Computed: contextual action buttons based on current status. */
  readonly actionButtons = computed<readonly IActionButton[]>(() => {
    const caseData = this.legalCase();
    if (!caseData) return [];

    const buttons: IActionButton[] = [];

    // Transition Status button — only if transitions are available
    const transitions = LEGAL_CASE_TRANSITIONS[caseData.status] ?? [];
    if (transitions.length > 0) {
      buttons.push({
        label: 'Change Status',
        icon: 'swap_horiz',
        cssClass: 'btn-primary',
        action: () => this.openTransitionDialog()
      });
    }

    // Edit button — available when the case is not Closed
    if (caseData.status !== LegalCaseStatus.Closed) {
      buttons.push({
        label: 'Edit Case',
        icon: 'edit',
        cssClass: 'btn-outline btn-secondary',
        action: () => this.onEditCase()
      });
    }

    return buttons;
  });

  /** Computed: permitted transitions from the current status. */
  readonly permittedTransitions = computed<readonly string[]>(() => {
    const caseData = this.legalCase();
    if (!caseData) return [];
    return LEGAL_CASE_TRANSITIONS[caseData.status] ?? [];
  });

  /** Computed: status lifecycle steps for the progress indicator. */
  readonly statusSteps = computed<readonly IStatusStep[]>(() => {
    const caseData = this.legalCase();
    if (!caseData) return [];

    const currentIndex = STATUS_LIFECYCLE_ORDER.indexOf(caseData.status);

    return STATUS_LIFECYCLE_ORDER.map((status, index) => {
      let state: 'completed' | 'current' | 'future';

      if (currentIndex >= 0) {
        if (index < currentIndex) {
          state = 'completed';
        } else if (index === currentIndex) {
          state = 'current';
        } else {
          state = 'future';
        }
      } else {
        // For statuses not in the main lifecycle (OnHold, Escalated, Reopened)
        // Show Open as completed, rest as future, and highlight none as current
        state = index === 0 ? 'completed' : 'future';
      }

      return {
        status,
        label: this.formatStatus(status),
        state
      };
    });
  });

  /** The case ID from route params. */
  private caseId = '';

  ngOnInit(): void {
    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        const id = params.get('id');
        if (id) {
          this.caseId = id;
          this.loadCase();
        }
      });
  }

  /** Loads the legal case detail from the API. */
  loadCase(): void {
    if (!this.caseId) return;

    this.loading.set(true);
    this.error.set(null);

    this.legalCaseService.getById(this.caseId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response: IApiResponse<ILegalCaseDetail>) => {
          if (response.success && response.data) {
            this.legalCase.set(response.data);
            this.store.dispatch(LegalCasesActions.selectLegalCase({ id: this.caseId }));
          } else {
            this.error.set(response.errors?.[0] ?? 'Failed to load legal case.');
          }
          this.loading.set(false);
        },
        error: () => {
          this.error.set('An unexpected error occurred while loading the legal case. Please try again.');
          this.loading.set(false);
        }
      });
  }

  /** Changes the active tab. */
  setActiveTab(tabId: string): void {
    this.activeTab.set(tabId);
  }

  /** Opens the status transition dialog. */
  openTransitionDialog(): void {
    this.showTransitionDialog.set(true);
  }

  /** Closes the status transition dialog. */
  closeTransitionDialog(): void {
    this.showTransitionDialog.set(false);
  }

  /** Handles a transition selection from the dialog. */
  onTransitionSelected(event: { newStatus: string; entityType: string }): void {
    this.closeTransitionDialog();
    this.store.dispatch(LegalCasesActions.transitionLegalCaseStatus({
      id: this.caseId,
      transition: { newStatus: event.newStatus as LegalCaseStatus }
    }));
  }

  /** Navigates to edit (placeholder — will be routed in future task). */
  onEditCase(): void {
    // Navigation to edit form will be implemented in the legal-case-create container task
  }

  /** Returns the 1-based index for a status step in the progress indicator. */
  getStepIndex(status: LegalCaseStatus): number {
    return STATUS_LIFECYCLE_ORDER.indexOf(status) + 1;
  }

  /** Formats PascalCase status to a readable label. */
  formatStatus(status: string): string {
    return status
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2')
      .trim();
  }

  /** Formats case type enum to readable text. */
  formatCaseType(caseType: LegalCaseType): string {
    switch (caseType) {
      case LegalCaseType.Conveyancing: return 'Conveyancing';
      case LegalCaseType.Dispute: return 'Dispute';
      case LegalCaseType.ContractReview: return 'Contract Review';
      case LegalCaseType.Regulatory: return 'Regulatory';
      case LegalCaseType.Planning: return 'Planning';
      case LegalCaseType.General: return 'General';
      default: return caseType;
    }
  }

  /** Returns DaisyUI badge class for case type. */
  getCaseTypeBadge(caseType: LegalCaseType): string {
    switch (caseType) {
      case LegalCaseType.Conveyancing: return 'badge-info';
      case LegalCaseType.Dispute: return 'badge-error';
      case LegalCaseType.ContractReview: return 'badge-warning';
      case LegalCaseType.Regulatory: return 'badge-accent';
      case LegalCaseType.Planning: return 'badge-secondary';
      case LegalCaseType.General: return 'badge-neutral';
      default: return 'badge-ghost';
    }
  }

  /** Returns DaisyUI badge class for status. */
  getStatusBadge(status: LegalCaseStatus): string {
    switch (status) {
      case LegalCaseStatus.Open: return 'badge-info';
      case LegalCaseStatus.InProgress: return 'badge-primary';
      case LegalCaseStatus.UnderReview: return 'badge-warning';
      case LegalCaseStatus.OnHold: return 'badge-neutral';
      case LegalCaseStatus.Escalated: return 'badge-error';
      case LegalCaseStatus.Resolved: return 'badge-success';
      case LegalCaseStatus.Closed: return 'badge-ghost';
      case LegalCaseStatus.Reopened: return 'badge-secondary';
      default: return 'badge-ghost';
    }
  }

  /** Returns DaisyUI badge class for priority. */
  getPriorityBadge(priority: LegalCasePriority): string {
    switch (priority) {
      case LegalCasePriority.Low: return 'badge-success';
      case LegalCasePriority.Medium: return 'badge-warning';
      case LegalCasePriority.High: return 'badge-error';
      case LegalCasePriority.Critical: return 'badge-error badge-outline';
      default: return 'badge-ghost';
    }
  }
}

