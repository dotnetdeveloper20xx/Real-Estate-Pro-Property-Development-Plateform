import {
  Component,
  ChangeDetectionStrategy,
  OnInit,
  inject,
  signal,
  computed,
  DestroyRef
} from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';

import { ContractService } from '../../services/contract.service';
import { ContractActions } from '../../store/contracts/contracts.actions';
import {
  IContractDetail,
  IApiResponse,
  LegalContractStatus,
  LegalContractType
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
  readonly status: LegalContractStatus;
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
 * Valid status transitions for the contract state machine.
 * Used to determine permitted transitions from the current status.
 */
const CONTRACT_TRANSITIONS: Record<LegalContractStatus, readonly LegalContractStatus[]> = {
  [LegalContractStatus.Draft]: [LegalContractStatus.UnderReview, LegalContractStatus.Cancelled],
  [LegalContractStatus.UnderReview]: [LegalContractStatus.Approved, LegalContractStatus.Rejected, LegalContractStatus.Draft],
  [LegalContractStatus.Approved]: [LegalContractStatus.AwaitingSignature],
  [LegalContractStatus.AwaitingSignature]: [LegalContractStatus.Executed, LegalContractStatus.Cancelled],
  [LegalContractStatus.Executed]: [LegalContractStatus.Active],
  [LegalContractStatus.Active]: [LegalContractStatus.Completed, LegalContractStatus.Terminated, LegalContractStatus.Expired, LegalContractStatus.UnderDispute],
  [LegalContractStatus.Completed]: [LegalContractStatus.Closed],
  [LegalContractStatus.Terminated]: [LegalContractStatus.Closed],
  [LegalContractStatus.Expired]: [LegalContractStatus.Renewed, LegalContractStatus.Closed],
  [LegalContractStatus.UnderDispute]: [LegalContractStatus.Active, LegalContractStatus.Terminated],
  [LegalContractStatus.Renewed]: [LegalContractStatus.Active],
  [LegalContractStatus.Cancelled]: [LegalContractStatus.Closed],
  [LegalContractStatus.Rejected]: [],
  [LegalContractStatus.Closed]: []
};

/**
 * Ordered list of statuses representing the canonical contract lifecycle path.
 * Used to display the progress indicator.
 */
const STATUS_LIFECYCLE_ORDER: readonly LegalContractStatus[] = [
  LegalContractStatus.Draft,
  LegalContractStatus.UnderReview,
  LegalContractStatus.Approved,
  LegalContractStatus.AwaitingSignature,
  LegalContractStatus.Executed,
  LegalContractStatus.Active,
  LegalContractStatus.Completed,
  LegalContractStatus.Closed
];

/**
 * ContractDetailContainer — Smart container that displays
 * the full detail view of a single contract.
 *
 * - Loads contract detail from the service using route param :id
 * - Displays header with contract summary (Title, ContractReference, ContractType, CounterpartyName, ContractValue, Status, StartDate, EndDate)
 * - Shows a status progress indicator for lifecycle position
 * - DaisyUI Tabs: Overview, Documents, Signatories, Key Dates, Activity
 * - Contextual action buttons (transition status, edit) based on current status and user role
 * - Uses status-transition-dialog component for transitions
 *
 * Requirements: 15.3, 15.4, 15.5, 15.6, 15.7
 */
@Component({
  selector: 'app-contract-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe, CurrencyPipe, StatusTransitionDialogComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Loading Skeleton -->
    <div *ngIf="loading()" class="p-6 space-y-6 animate-pulse" aria-busy="true" aria-label="Loading contract details">
      <div class="flex items-center gap-2">
        <div class="h-4 w-24 bg-base-300 rounded"></div>
      </div>
      <div class="card bg-base-100 shadow-sm border border-base-200">
        <div class="card-body p-6">
          <div class="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div class="flex flex-col gap-3">
              <div class="h-7 w-72 bg-base-300 rounded"></div>
              <div class="flex flex-wrap gap-4">
                <div class="h-5 w-28 bg-base-300 rounded"></div>
                <div class="h-5 w-20 bg-base-300 rounded"></div>
                <div class="h-5 w-40 bg-base-300 rounded"></div>
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
            <div *ngFor="let i of [1,2,3,4,5]" class="h-8 w-24 bg-base-300 rounded"></div>
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
          <h2 class="text-lg font-semibold text-base-content">Unable to load contract</h2>
          <p class="text-sm text-base-content/60">{{ error() }}</p>
          <button class="btn btn-primary btn-sm" (click)="loadContract()">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Retry
          </button>
        </div>
      </div>
    </div>

    <!-- Contract Detail Content -->
    <div *ngIf="!loading() && !error() && contract()" class="p-6 space-y-6">
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
            <a routerLink="/legal-compliance/contracts" class="hover:text-primary transition-colors">Contracts</a>
          </li>
          <li>
            <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </li>
          <li class="text-base-content font-medium truncate max-w-xs">{{ contract()!.contractReference }}</li>
        </ol>
      </nav>

      <!-- Header Card -->
      <section aria-label="Contract Summary">
        <div class="card bg-base-100 shadow-sm border border-base-200">
          <div class="card-body p-6">
            <!-- Top Row: Title + Actions -->
            <div class="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
              <!-- Left: Title and Metadata -->
              <div class="flex flex-col gap-2">
                <div class="flex items-center gap-3 flex-wrap">
                  <h1 class="text-2xl font-bold text-base-content">{{ contract()!.title }}</h1>
                  <span class="badge badge-sm" [ngClass]="getContractTypeBadge(contract()!.contractType)">
                    {{ formatContractType(contract()!.contractType) }}
                  </span>
                  <span class="badge badge-sm" [ngClass]="getStatusBadge(contract()!.status)">
                    {{ formatStatus(contract()!.status) }}
                  </span>
                </div>
                <div class="flex flex-wrap items-center gap-4 text-sm text-base-content/70">
                  <span class="flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                    </svg>
                    {{ contract()!.contractReference }}
                  </span>
                  <span class="flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    {{ contract()!.counterpartyName }}
                  </span>
                  <span class="flex items-center gap-1 font-semibold text-base-content">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {{ contract()!.contractValue | currency:contract()!.currency:'symbol':'1.2-2' }}
                  </span>
                  <span class="flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {{ contract()!.startDate | date:'dd MMM yyyy' }} — {{ contract()!.endDate | date:'dd MMM yyyy' }}
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
              <div class="flex items-center justify-between gap-1 overflow-x-auto" role="progressbar" aria-label="Contract lifecycle progress">
                <div
                  *ngFor="let step of statusSteps(); let last = last"
                  class="flex items-center"
                  [class.flex-1]="!last">
                  <div class="flex flex-col items-center gap-1 min-w-[72px]">
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
                      class="text-[10px] text-center leading-tight max-w-[68px]"
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
      <section aria-label="Contract Details">
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
                <!-- Contract Details -->
                <div class="space-y-4">
                  <h3 class="text-base font-semibold text-base-content">Contract Details</h3>
                  <div class="grid grid-cols-2 gap-3">
                    <div class="flex flex-col gap-0.5">
                      <span class="text-xs text-base-content/50 uppercase font-medium">Contract Reference</span>
                      <span class="text-sm text-base-content font-mono">{{ contract()!.contractReference }}</span>
                    </div>
                    <div class="flex flex-col gap-0.5">
                      <span class="text-xs text-base-content/50 uppercase font-medium">Contract Type</span>
                      <span class="badge badge-sm badge-outline">{{ formatContractType(contract()!.contractType) }}</span>
                    </div>
                    <div class="flex flex-col gap-0.5">
                      <span class="text-xs text-base-content/50 uppercase font-medium">Status</span>
                      <span class="badge badge-sm" [ngClass]="getStatusBadge(contract()!.status)">{{ formatStatus(contract()!.status) }}</span>
                    </div>
                    <div class="flex flex-col gap-0.5">
                      <span class="text-xs text-base-content/50 uppercase font-medium">Counterparty</span>
                      <span class="text-sm text-base-content">{{ contract()!.counterpartyName }}</span>
                    </div>
                    <div class="flex flex-col gap-0.5">
                      <span class="text-xs text-base-content/50 uppercase font-medium">Contract Value</span>
                      <span class="text-sm text-base-content font-semibold">{{ contract()!.contractValue | currency:contract()!.currency:'symbol':'1.2-2' }}</span>
                    </div>
                    <div class="flex flex-col gap-0.5">
                      <span class="text-xs text-base-content/50 uppercase font-medium">Currency</span>
                      <span class="text-sm text-base-content">{{ contract()!.currency }}</span>
                    </div>
                    <div class="flex flex-col gap-0.5">
                      <span class="text-xs text-base-content/50 uppercase font-medium">Start Date</span>
                      <span class="text-sm text-base-content">{{ contract()!.startDate | date:'dd MMM yyyy' }}</span>
                    </div>
                    <div class="flex flex-col gap-0.5">
                      <span class="text-xs text-base-content/50 uppercase font-medium">End Date</span>
                      <span class="text-sm text-base-content">{{ contract()!.endDate | date:'dd MMM yyyy' }}</span>
                    </div>
                    <div class="flex flex-col gap-0.5">
                      <span class="text-xs text-base-content/50 uppercase font-medium">Created</span>
                      <span class="text-sm text-base-content">{{ contract()!.createdAt | date:'dd MMM yyyy, HH:mm' }}</span>
                    </div>
                    <div class="flex flex-col gap-0.5">
                      <span class="text-xs text-base-content/50 uppercase font-medium">Created By</span>
                      <span class="text-sm text-base-content">{{ contract()!.createdBy }}</span>
                    </div>
                    <div *ngIf="contract()!.updatedAt" class="flex flex-col gap-0.5">
                      <span class="text-xs text-base-content/50 uppercase font-medium">Last Updated</span>
                      <span class="text-sm text-base-content">{{ contract()!.updatedAt | date:'dd MMM yyyy, HH:mm' }}</span>
                    </div>
                    <div *ngIf="contract()!.renewalDate" class="flex flex-col gap-0.5">
                      <span class="text-xs text-base-content/50 uppercase font-medium">Renewal Date</span>
                      <span class="text-sm text-base-content">{{ contract()!.renewalDate | date:'dd MMM yyyy' }}</span>
                    </div>
                  </div>
                </div>

                <!-- Terms & Conditions -->
                <div class="space-y-4">
                  <h3 class="text-base font-semibold text-base-content">Terms & Conditions</h3>
                  <div class="grid grid-cols-1 gap-3">
                    <div *ngIf="contract()!.paymentTerms" class="flex flex-col gap-0.5">
                      <span class="text-xs text-base-content/50 uppercase font-medium">Payment Terms</span>
                      <span class="text-sm text-base-content">{{ contract()!.paymentTerms }}</span>
                    </div>
                    <div *ngIf="contract()!.terminationClause" class="flex flex-col gap-0.5">
                      <span class="text-xs text-base-content/50 uppercase font-medium">Termination Clause</span>
                      <span class="text-sm text-base-content whitespace-pre-line">{{ contract()!.terminationClause }}</span>
                    </div>
                    <div *ngIf="contract()!.specialConditions" class="flex flex-col gap-0.5">
                      <span class="text-xs text-base-content/50 uppercase font-medium">Special Conditions</span>
                      <span class="text-sm text-base-content whitespace-pre-line">{{ contract()!.specialConditions }}</span>
                    </div>
                    <div *ngIf="!contract()!.paymentTerms && !contract()!.terminationClause && !contract()!.specialConditions" class="flex flex-col items-center justify-center py-4 text-base-content/50">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p class="text-sm">No additional terms recorded yet.</p>
                    </div>
                  </div>

                  <!-- Linked Case -->
                  <h3 class="text-base font-semibold text-base-content mt-6">Linked Legal Case</h3>
                  <div class="p-3 rounded-lg bg-base-200/50 border border-base-200">
                    <div class="flex items-center justify-between">
                      <div>
                        <p class="text-sm font-medium text-base-content">{{ contract()!.caseTitle }}</p>
                        <p class="text-xs text-base-content/60 font-mono">{{ contract()!.caseReference }}</p>
                      </div>
                      <a [routerLink]="['/legal-compliance', 'cases', contract()!.legalCaseId]" class="btn btn-xs btn-ghost text-primary">
                        View Case
                      </a>
                    </div>
                  </div>

                  <!-- Document Count -->
                  <h3 class="text-base font-semibold text-base-content mt-6">Related Records</h3>
                  <div class="grid grid-cols-1 gap-3">
                    <div class="p-3 rounded-lg bg-base-200/50 border border-base-200 text-center">
                      <p class="text-lg font-bold text-base-content">{{ contract()!.documentCount }}</p>
                      <p class="text-xs text-base-content/50">Documents</p>
                    </div>
                  </div>
                </div>
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
                <p class="text-xs mt-1">Legal documents uploaded against this contract will appear here.</p>
              </div>
            </div>

            <!-- Signatories Tab -->
            <div
              *ngIf="activeTab() === 'signatories'"
              id="panel-signatories"
              role="tabpanel"
              aria-labelledby="tab-signatories">
              <div *ngIf="contract()!.signatoryNames; else noSignatories">
                <h3 class="text-base font-semibold text-base-content mb-4">Contract Signatories</h3>
                <div class="space-y-2">
                  <div *ngFor="let signatory of getSignatoryList()" class="flex items-center gap-3 p-3 rounded-lg bg-base-200/50 border border-base-200">
                    <div class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <span class="text-sm text-base-content">{{ signatory }}</span>
                  </div>
                </div>
                <div *ngIf="contract()!.executionDate" class="mt-4 p-3 rounded-lg bg-success/5 border border-success/20">
                  <p class="text-xs text-base-content/60">Executed on</p>
                  <p class="text-sm text-base-content font-medium">{{ contract()!.executionDate | date:'dd MMM yyyy' }}</p>
                </div>
              </div>
              <ng-template #noSignatories>
                <div class="flex flex-col items-center justify-center py-8 text-base-content/50">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <p class="text-sm font-medium">No Signatories Recorded</p>
                  <p class="text-xs mt-1">Signatory details will be captured when the contract is executed.</p>
                </div>
              </ng-template>
            </div>

            <!-- Key Dates Tab -->
            <div
              *ngIf="activeTab() === 'keydates'"
              id="panel-keydates"
              role="tabpanel"
              aria-labelledby="tab-keydates">
              <h3 class="text-base font-semibold text-base-content mb-4">Key Contract Dates</h3>
              <div class="space-y-3">
                <div class="flex items-center gap-3 p-3 rounded-lg bg-base-200/50 border border-base-200">
                  <div class="w-10 h-10 rounded-full bg-info/10 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-info" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div class="flex-1">
                    <p class="text-xs text-base-content/60 uppercase font-medium">Start Date</p>
                    <p class="text-sm text-base-content font-medium">{{ contract()!.startDate | date:'dd MMM yyyy' }}</p>
                  </div>
                </div>

                <div class="flex items-center gap-3 p-3 rounded-lg bg-base-200/50 border border-base-200">
                  <div class="w-10 h-10 rounded-full bg-warning/10 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div class="flex-1">
                    <p class="text-xs text-base-content/60 uppercase font-medium">End Date</p>
                    <p class="text-sm text-base-content font-medium">{{ contract()!.endDate | date:'dd MMM yyyy' }}</p>
                  </div>
                </div>

                <div *ngIf="contract()!.renewalDate" class="flex items-center gap-3 p-3 rounded-lg bg-base-200/50 border border-base-200">
                  <div class="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </div>
                  <div class="flex-1">
                    <p class="text-xs text-base-content/60 uppercase font-medium">Renewal Date</p>
                    <p class="text-sm text-base-content font-medium">{{ contract()!.renewalDate | date:'dd MMM yyyy' }}</p>
                  </div>
                </div>

                <div *ngIf="contract()!.executionDate" class="flex items-center gap-3 p-3 rounded-lg bg-success/5 border border-success/20">
                  <div class="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div class="flex-1">
                    <p class="text-xs text-base-content/60 uppercase font-medium">Execution Date</p>
                    <p class="text-sm text-base-content font-medium">{{ contract()!.executionDate | date:'dd MMM yyyy' }}</p>
                  </div>
                </div>

                <div *ngIf="contract()!.terminationDate" class="flex items-center gap-3 p-3 rounded-lg bg-error/5 border border-error/20">
                  <div class="w-10 h-10 rounded-full bg-error/10 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <div class="flex-1">
                    <p class="text-xs text-base-content/60 uppercase font-medium">Termination Date</p>
                    <p class="text-sm text-base-content font-medium">{{ contract()!.terminationDate | date:'dd MMM yyyy' }}</p>
                  </div>
                </div>

                <div *ngIf="contract()!.approvalTimestamp" class="flex items-center gap-3 p-3 rounded-lg bg-base-200/50 border border-base-200">
                  <div class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div class="flex-1">
                    <p class="text-xs text-base-content/60 uppercase font-medium">Approval Date</p>
                    <p class="text-sm text-base-content font-medium">{{ contract()!.approvalTimestamp | date:'dd MMM yyyy, HH:mm' }}</p>
                    <p *ngIf="contract()!.approvalNotes" class="text-xs text-base-content/60 mt-0.5">{{ contract()!.approvalNotes }}</p>
                  </div>
                </div>
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
      [currentStatus]="contract()?.status ?? ''"
      [permittedTransitions]="permittedTransitions()"
      entityType="Contract"
      (transitionSelected)="onTransitionSelected($event)"
      (dialogClosed)="closeTransitionDialog()">
    </app-status-transition-dialog>
  `
})
export class ContractDetailContainer implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly store = inject(Store);
  private readonly contractService = inject(ContractService);
  private readonly destroyRef = inject(DestroyRef);

  /** The loaded contract detail. */
  readonly contract = signal<IContractDetail | null>(null);

  /** Loading state. */
  readonly loading = signal<boolean>(true);

  /** Error message from failed API call. */
  readonly error = signal<string | null>(null);

  /** Currently active tab. */
  readonly activeTab = signal<string>('overview');

  /** Controls visibility of the status transition dialog. */
  readonly showTransitionDialog = signal<boolean>(false);

  /** Tab definitions for the contract detail view. */
  readonly tabs: readonly ITab[] = [
    { id: 'overview', label: 'Overview', icon: 'info' },
    { id: 'documents', label: 'Documents', icon: 'folder' },
    { id: 'signatories', label: 'Signatories', icon: 'people' },
    { id: 'keydates', label: 'Key Dates', icon: 'event' },
    { id: 'activity', label: 'Activity', icon: 'history' }
  ];

  /** Computed: contextual action buttons based on current status. */
  readonly actionButtons = computed<readonly IActionButton[]>(() => {
    const contractData = this.contract();
    if (!contractData) return [];

    const buttons: IActionButton[] = [];

    // Transition Status button — only if transitions are available
    const transitions = CONTRACT_TRANSITIONS[contractData.status] ?? [];
    if (transitions.length > 0) {
      buttons.push({
        label: 'Change Status',
        icon: 'swap_horiz',
        cssClass: 'btn-primary',
        action: () => this.openTransitionDialog()
      });
    }

    // Edit button — available when the contract is not Closed or Rejected
    if (contractData.status !== LegalContractStatus.Closed && contractData.status !== LegalContractStatus.Rejected) {
      buttons.push({
        label: 'Edit Contract',
        icon: 'edit',
        cssClass: 'btn-outline btn-secondary',
        action: () => this.onEditContract()
      });
    }

    return buttons;
  });

  /** Computed: permitted transitions from the current status. */
  readonly permittedTransitions = computed<readonly string[]>(() => {
    const contractData = this.contract();
    if (!contractData) return [];
    return CONTRACT_TRANSITIONS[contractData.status] ?? [];
  });

  /** Computed: status lifecycle steps for the progress indicator. */
  readonly statusSteps = computed<readonly IStatusStep[]>(() => {
    const contractData = this.contract();
    if (!contractData) return [];

    const currentIndex = STATUS_LIFECYCLE_ORDER.indexOf(contractData.status);

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
        // For statuses not in the main lifecycle (Terminated, Expired, UnderDispute, Renewed, Cancelled, Rejected)
        // Show Draft as completed, rest as future
        state = index === 0 ? 'completed' : 'future';
      }

      return {
        status,
        label: this.formatStatus(status),
        state
      };
    });
  });

  /** The contract ID from route params. */
  private contractId = '';

  ngOnInit(): void {
    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        const id = params.get('id');
        if (id) {
          this.contractId = id;
          this.loadContract();
        }
      });
  }

  /** Loads the contract detail from the API. */
  loadContract(): void {
    if (!this.contractId) return;

    this.loading.set(true);
    this.error.set(null);

    this.contractService.getById(this.contractId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response: IApiResponse<IContractDetail>) => {
          if (response.success && response.data) {
            this.contract.set(response.data);
            this.store.dispatch(ContractActions.selectContract({ id: this.contractId }));
          } else {
            this.error.set(response.errors?.[0] ?? 'Failed to load contract.');
          }
          this.loading.set(false);
        },
        error: () => {
          this.error.set('An unexpected error occurred while loading the contract. Please try again.');
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
    this.store.dispatch(ContractActions.transitionStatus({
      id: this.contractId,
      transition: { newStatus: event.newStatus as LegalContractStatus }
    }));
  }

  /** Navigates to edit (placeholder — will be routed in future task). */
  onEditContract(): void {
    // Navigation to edit form will be implemented in the contract-create container task
  }

  /** Returns the 1-based index for a status step in the progress indicator. */
  getStepIndex(status: LegalContractStatus): number {
    return STATUS_LIFECYCLE_ORDER.indexOf(status) + 1;
  }

  /** Parses signatory names (comma or semicolon separated) into a list. */
  getSignatoryList(): readonly string[] {
    const names = this.contract()?.signatoryNames;
    if (!names) return [];
    return names.split(/[;,]/).map(n => n.trim()).filter(n => n.length > 0);
  }

  /** Formats PascalCase status to a readable label. */
  formatStatus(status: string): string {
    return status
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2')
      .trim();
  }

  /** Formats contract type enum to readable text. */
  formatContractType(contractType: LegalContractType): string {
    switch (contractType) {
      case LegalContractType.LandPurchase: return 'Land Purchase';
      case LegalContractType.Construction: return 'Construction';
      case LegalContractType.ProfessionalServices: return 'Professional Services';
      case LegalContractType.Insurance: return 'Insurance';
      case LegalContractType.Lease: return 'Lease';
      case LegalContractType.Settlement: return 'Settlement';
      case LegalContractType.FrameworkAgreement: return 'Framework Agreement';
      default: return contractType;
    }
  }

  /** Returns DaisyUI badge class for contract type. */
  getContractTypeBadge(contractType: LegalContractType): string {
    switch (contractType) {
      case LegalContractType.LandPurchase: return 'badge-info';
      case LegalContractType.Construction: return 'badge-warning';
      case LegalContractType.ProfessionalServices: return 'badge-accent';
      case LegalContractType.Insurance: return 'badge-secondary';
      case LegalContractType.Lease: return 'badge-primary';
      case LegalContractType.Settlement: return 'badge-error';
      case LegalContractType.FrameworkAgreement: return 'badge-neutral';
      default: return 'badge-ghost';
    }
  }

  /** Returns DaisyUI badge class for contract status. */
  getStatusBadge(status: LegalContractStatus): string {
    switch (status) {
      case LegalContractStatus.Draft: return 'badge-neutral';
      case LegalContractStatus.UnderReview: return 'badge-warning';
      case LegalContractStatus.Approved: return 'badge-info';
      case LegalContractStatus.AwaitingSignature: return 'badge-accent';
      case LegalContractStatus.Executed: return 'badge-primary';
      case LegalContractStatus.Active: return 'badge-success';
      case LegalContractStatus.Completed: return 'badge-success badge-outline';
      case LegalContractStatus.Terminated: return 'badge-error';
      case LegalContractStatus.Expired: return 'badge-error badge-outline';
      case LegalContractStatus.UnderDispute: return 'badge-error';
      case LegalContractStatus.Renewed: return 'badge-info badge-outline';
      case LegalContractStatus.Cancelled: return 'badge-ghost';
      case LegalContractStatus.Rejected: return 'badge-error badge-outline';
      case LegalContractStatus.Closed: return 'badge-ghost';
      default: return 'badge-ghost';
    }
  }
}
