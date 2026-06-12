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
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';

import { ComplianceService } from '../../services/compliance.service';
import { ComplianceCheckActions } from '../../store/compliance/compliance.actions';
import {
  selectAllComplianceChecks,
  selectChecksLoading,
  selectChecksError,
  selectChecksTotalCount
} from '../../store/compliance/compliance.selectors';
import {
  IComplianceRequirement,
  IComplianceCheck,
  ComplianceCategory,
  ComplianceFrequency,
  ComplianceRequirementStatus,
  ComplianceCheckOutcome
} from '../../models';
import { ComplianceStatusBadgeComponent, ComplianceStatusColor } from '../../components/compliance-status-badge/compliance-status-badge.component';

/**
 * Determines the compliance status color for the requirement based on check history.
 * - green: Last check was Compliant and not overdue
 * - amber: Has a next due date within 7 days
 * - red: Overdue (next due date has passed) or last check was NonCompliant
 * - grey: No checks recorded yet
 */
function getRequirementStatusColor(
  requirement: IComplianceRequirement,
  checks: readonly IComplianceCheck[]
): ComplianceStatusColor {
  if (checks.length === 0) {
    return 'grey';
  }

  // Check overdue
  if (requirement.nextDueDate) {
    const now = new Date();
    const nextDue = new Date(requirement.nextDueDate);
    if (nextDue.getTime() < now.getTime()) {
      return 'red';
    }
    const daysUntilDue = Math.ceil(
      (nextDue.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysUntilDue <= 7) {
      return 'amber';
    }
  }

  // Latest check outcome
  const latestCheck = [...checks].sort(
    (a, b) => new Date(b.checkDate).getTime() - new Date(a.checkDate).getTime()
  )[0];

  if (latestCheck.outcome === ComplianceCheckOutcome.Compliant) {
    return 'green';
  }
  if (
    latestCheck.outcome === ComplianceCheckOutcome.NonCompliant ||
    latestCheck.outcome === ComplianceCheckOutcome.PartiallyCompliant
  ) {
    return 'red';
  }

  return 'grey';
}

/**
 * ComplianceRequirementDetailContainer — Smart container component
 * that displays the full detail view of a single compliance requirement.
 *
 * Features:
 * - Loads the requirement by ID from the route parameter
 * - Displays requirement info: Name, Category, Frequency, SourceRegulation, ResponsibleRole, Status, NextDueDate
 * - Shows full check history in a data table
 * - Shows current compliance status (color-coded)
 * - Provides a button to record a new compliance check
 *
 * Requirements: 20.5
 */
@Component({
  selector: 'app-compliance-requirement-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe, ComplianceStatusBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Loading Skeleton -->
    <div *ngIf="loading()" class="p-6 space-y-6 animate-pulse" aria-busy="true" aria-label="Loading compliance requirement details">
      <div class="flex items-center gap-2">
        <div class="h-4 w-32 bg-base-300 rounded"></div>
      </div>
      <div class="card bg-base-100 shadow-sm border border-base-200">
        <div class="card-body p-6">
          <div class="flex flex-col gap-3">
            <div class="h-7 w-64 bg-base-300 rounded"></div>
            <div class="flex flex-wrap gap-4">
              <div class="h-5 w-24 bg-base-300 rounded"></div>
              <div class="h-5 w-20 bg-base-300 rounded"></div>
              <div class="h-5 w-36 bg-base-300 rounded"></div>
            </div>
          </div>
        </div>
      </div>
      <div class="card bg-base-100 shadow-sm border border-base-200">
        <div class="card-body p-6">
          <div class="h-5 w-40 bg-base-300 rounded mb-4"></div>
          <div class="space-y-3">
            <div class="h-10 w-full bg-base-300 rounded"></div>
            <div class="h-10 w-full bg-base-300 rounded"></div>
            <div class="h-10 w-full bg-base-300 rounded"></div>
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
          <h2 class="text-lg font-semibold text-base-content">Unable to load compliance requirement</h2>
          <p class="text-sm text-base-content/60">{{ error() }}</p>
          <button class="btn btn-primary btn-sm" (click)="loadRequirement()">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Retry
          </button>
        </div>
      </div>
    </div>

    <!-- Requirement Detail Content -->
    <div *ngIf="!loading() && !error() && requirement()" class="p-6 space-y-6">
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
            <a routerLink="/legal-compliance/compliance" class="hover:text-primary transition-colors">Compliance Checklist</a>
          </li>
          <li>
            <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </li>
          <li class="text-base-content font-medium truncate max-w-xs">{{ requirement()!.name }}</li>
        </ol>
      </nav>

      <!-- Header Card: Requirement Information -->
      <section aria-label="Compliance Requirement Summary">
        <div class="card bg-base-100 shadow-sm border border-base-200">
          <div class="card-body p-6">
            <!-- Top Row: Title + Actions -->
            <div class="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
              <!-- Left: Name and Metadata -->
              <div class="flex flex-col gap-2">
                <div class="flex items-center gap-3 flex-wrap">
                  <h1 class="text-2xl font-bold text-base-content">{{ requirement()!.name }}</h1>
                  <span class="badge badge-sm" [ngClass]="getCategoryBadge(requirement()!.category)">
                    {{ formatCategory(requirement()!.category) }}
                  </span>
                  <span class="badge badge-sm" [ngClass]="getStatusBadge(requirement()!.status)">
                    {{ requirement()!.status }}
                  </span>
                  <app-compliance-status-badge
                    [statusColor]="currentStatusColor()"
                    [showLabel]="true">
                  </app-compliance-status-badge>
                </div>
                <p class="text-sm text-base-content/70 max-w-2xl">{{ requirement()!.description }}</p>
              </div>

              <!-- Right: Record New Check button -->
              <div class="flex flex-wrap gap-2">
                <button
                  *ngIf="requirement()!.status === requirementStatusActive"
                  class="btn btn-primary btn-sm"
                  (click)="recordNewCheck()"
                  aria-label="Record a new compliance check">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                  </svg>
                  Record New Check
                </button>
              </div>
            </div>

            <!-- Requirement Detail Grid -->
            <div class="mt-6 pt-4 border-t border-base-200">
              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                <div class="flex flex-col gap-0.5">
                  <span class="text-xs text-base-content/50 uppercase font-medium">Category</span>
                  <span class="text-sm text-base-content">{{ formatCategory(requirement()!.category) }}</span>
                </div>
                <div class="flex flex-col gap-0.5">
                  <span class="text-xs text-base-content/50 uppercase font-medium">Frequency</span>
                  <span class="text-sm text-base-content">{{ formatFrequency(requirement()!.frequency) }}</span>
                </div>
                <div class="flex flex-col gap-0.5">
                  <span class="text-xs text-base-content/50 uppercase font-medium">Source Regulation</span>
                  <span class="text-sm text-base-content">{{ requirement()!.sourceRegulation }}</span>
                </div>
                <div class="flex flex-col gap-0.5">
                  <span class="text-xs text-base-content/50 uppercase font-medium">Responsible Role</span>
                  <span class="text-sm text-base-content">{{ requirement()!.responsibleRole }}</span>
                </div>
                <div class="flex flex-col gap-0.5">
                  <span class="text-xs text-base-content/50 uppercase font-medium">Status</span>
                  <span class="badge badge-sm" [ngClass]="getStatusBadge(requirement()!.status)">{{ requirement()!.status }}</span>
                </div>
                <div class="flex flex-col gap-0.5">
                  <span class="text-xs text-base-content/50 uppercase font-medium">Next Due Date</span>
                  <span class="text-sm text-base-content" [ngClass]="{ 'text-error font-semibold': isOverdue() }">
                    {{ requirement()!.nextDueDate ? (requirement()!.nextDueDate | date:'dd MMM yyyy') : 'Not scheduled' }}
                    <span *ngIf="isOverdue()" class="badge badge-xs badge-error ml-1">Overdue</span>
                  </span>
                </div>
                <div *ngIf="requirement()!.retirementReason" class="flex flex-col gap-0.5 sm:col-span-2">
                  <span class="text-xs text-base-content/50 uppercase font-medium">Retirement Reason</span>
                  <span class="text-sm text-base-content">{{ requirement()!.retirementReason }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Check History Table -->
      <section aria-label="Compliance Check History">
        <div class="card bg-base-100 shadow-sm border border-base-200">
          <div class="card-body p-6">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-lg font-semibold text-base-content">Check History</h2>
              <span class="text-sm text-base-content/60">{{ checksTotalCount() }} record(s)</span>
            </div>

            <!-- Checks Loading -->
            <div *ngIf="checksLoading()" class="space-y-3 animate-pulse" aria-busy="true">
              <div class="h-10 w-full bg-base-300 rounded"></div>
              <div class="h-10 w-full bg-base-300 rounded"></div>
              <div class="h-10 w-full bg-base-300 rounded"></div>
            </div>

            <!-- Checks Error -->
            <div *ngIf="checksError() && !checksLoading()" class="flex flex-col items-center py-6 gap-2 text-error">
              <p class="text-sm">{{ checksError() }}</p>
              <button class="btn btn-sm btn-outline btn-error" (click)="loadChecks()">Retry</button>
            </div>

            <!-- Empty State -->
            <div *ngIf="!checksLoading() && !checksError() && checks().length === 0" class="flex flex-col items-center justify-center py-8 text-base-content/50">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              <p class="text-sm font-medium">No compliance checks recorded yet</p>
              <p class="text-xs mt-1">Record your first compliance check to start tracking this requirement.</p>
            </div>

            <!-- Check History Data Table -->
            <div *ngIf="!checksLoading() && !checksError() && checks().length > 0" class="overflow-x-auto">
              <table class="table table-sm w-full" aria-label="Compliance check history">
                <thead>
                  <tr>
                    <th class="text-xs uppercase">Check Date</th>
                    <th class="text-xs uppercase">Outcome</th>
                    <th class="text-xs uppercase">Reviewer</th>
                    <th class="text-xs uppercase">Findings</th>
                    <th class="text-xs uppercase">Evidence</th>
                    <th class="text-xs uppercase">Remediation Due</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let check of checks(); trackBy: trackByCheckId" class="hover">
                    <td class="text-sm whitespace-nowrap">{{ check.checkDate | date:'dd MMM yyyy' }}</td>
                    <td>
                      <span class="badge badge-sm" [ngClass]="getOutcomeBadge(check.outcome)">
                        {{ formatOutcome(check.outcome) }}
                      </span>
                    </td>
                    <td class="text-sm">{{ check.reviewerName }}</td>
                    <td class="text-sm max-w-xs truncate" [title]="check.findings">{{ check.findings }}</td>
                    <td class="text-sm">{{ check.evidenceReference || '—' }}</td>
                    <td class="text-sm whitespace-nowrap">
                      {{ check.remediationDueDate ? (check.remediationDueDate | date:'dd MMM yyyy') : '—' }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
    </div>
  `
})
export class ComplianceRequirementDetailContainer implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly store = inject(Store);
  private readonly complianceService = inject(ComplianceService);
  private readonly destroyRef = inject(DestroyRef);

  /** The ComplianceRequirementStatus.Active value for template comparison. */
  readonly requirementStatusActive = ComplianceRequirementStatus.Active;

  /** The loaded compliance requirement. */
  readonly requirement = signal<IComplianceRequirement | null>(null);

  /** Loading state for the requirement. */
  readonly loading = signal<boolean>(true);

  /** Error message if requirement load fails. */
  readonly error = signal<string | null>(null);

  /** Compliance checks from the NgRx store. */
  readonly checks = this.store.selectSignal(selectAllComplianceChecks);

  /** Whether checks are loading. */
  readonly checksLoading = this.store.selectSignal(selectChecksLoading);

  /** Checks error message. */
  readonly checksError = this.store.selectSignal(selectChecksError);

  /** Total count of checks for display. */
  readonly checksTotalCount = this.store.selectSignal(selectChecksTotalCount);

  /** Computed: current compliance status color. */
  readonly currentStatusColor = computed<ComplianceStatusColor>(() => {
    const req = this.requirement();
    const checksData = this.checks();
    if (!req) return 'grey';
    return getRequirementStatusColor(req, checksData);
  });

  /** Computed: whether the requirement is overdue. */
  readonly isOverdue = computed<boolean>(() => {
    const req = this.requirement();
    if (!req?.nextDueDate) return false;
    return new Date(req.nextDueDate).getTime() < new Date().getTime();
  });

  /** The requirement ID from the route. */
  private requirementId = '';

  ngOnInit(): void {
    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        const id = params.get('id');
        if (id) {
          this.requirementId = id;
          this.loadRequirement();
          this.loadChecks();
        }
      });
  }

  /** Load the compliance requirement by ID from the API. */
  loadRequirement(): void {
    this.loading.set(true);
    this.error.set(null);

    this.complianceService.getRequirementById(this.requirementId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.requirement.set(response.data);
          } else {
            this.error.set(response.errors?.[0] ?? 'Requirement not found.');
          }
          this.loading.set(false);
        },
        error: (err: { message?: string }) => {
          this.error.set(err.message ?? 'An unexpected error occurred while loading the requirement.');
          this.loading.set(false);
        }
      });
  }

  /** Load compliance checks for this requirement via NgRx store. */
  loadChecks(): void {
    this.store.dispatch(
      ComplianceCheckActions.loadChecks({ requirementId: this.requirementId })
    );
  }

  /** Navigate to the record new check page/form. */
  recordNewCheck(): void {
    this.router.navigate(['/legal-compliance/compliance/checks/new'], {
      queryParams: { requirementId: this.requirementId }
    });
  }

  /** TrackBy function for ngFor performance. */
  trackByCheckId(_index: number, check: IComplianceCheck): string {
    return check.id;
  }

  // ──────────────────────────────────────────────
  // Display Formatting
  // ──────────────────────────────────────────────

  /** Format ComplianceCategory enum to human-readable text. */
  formatCategory(category: ComplianceCategory): string {
    const map: Record<ComplianceCategory, string> = {
      [ComplianceCategory.HealthAndSafety]: 'Health & Safety',
      [ComplianceCategory.Environmental]: 'Environmental',
      [ComplianceCategory.Financial]: 'Financial',
      [ComplianceCategory.DataProtection]: 'Data Protection',
      [ComplianceCategory.BuildingRegulations]: 'Building Regulations',
      [ComplianceCategory.PlanningCompliance]: 'Planning Compliance',
      [ComplianceCategory.AntiMoneyLaundering]: 'Anti Money Laundering',
      [ComplianceCategory.Employment]: 'Employment'
    };
    return map[category] ?? category;
  }

  /** Format ComplianceFrequency enum to human-readable text. */
  formatFrequency(frequency: ComplianceFrequency): string {
    const map: Record<ComplianceFrequency, string> = {
      [ComplianceFrequency.OneOff]: 'One-Off',
      [ComplianceFrequency.Daily]: 'Daily',
      [ComplianceFrequency.Weekly]: 'Weekly',
      [ComplianceFrequency.Monthly]: 'Monthly',
      [ComplianceFrequency.Quarterly]: 'Quarterly',
      [ComplianceFrequency.Annually]: 'Annually',
      [ComplianceFrequency.Ongoing]: 'Ongoing'
    };
    return map[frequency] ?? frequency;
  }

  /** Format ComplianceCheckOutcome enum to human-readable text. */
  formatOutcome(outcome: ComplianceCheckOutcome): string {
    const map: Record<ComplianceCheckOutcome, string> = {
      [ComplianceCheckOutcome.Compliant]: 'Compliant',
      [ComplianceCheckOutcome.NonCompliant]: 'Non-Compliant',
      [ComplianceCheckOutcome.PartiallyCompliant]: 'Partially Compliant',
      [ComplianceCheckOutcome.NotApplicable]: 'Not Applicable'
    };
    return map[outcome] ?? outcome;
  }

  /** Get DaisyUI badge class for a category. */
  getCategoryBadge(category: ComplianceCategory): string {
    const map: Record<ComplianceCategory, string> = {
      [ComplianceCategory.HealthAndSafety]: 'badge-warning badge-outline',
      [ComplianceCategory.Environmental]: 'badge-success badge-outline',
      [ComplianceCategory.Financial]: 'badge-info badge-outline',
      [ComplianceCategory.DataProtection]: 'badge-secondary badge-outline',
      [ComplianceCategory.BuildingRegulations]: 'badge-accent badge-outline',
      [ComplianceCategory.PlanningCompliance]: 'badge-primary badge-outline',
      [ComplianceCategory.AntiMoneyLaundering]: 'badge-error badge-outline',
      [ComplianceCategory.Employment]: 'badge-neutral badge-outline'
    };
    return map[category] ?? 'badge-ghost';
  }

  /** Get DaisyUI badge class for requirement status. */
  getStatusBadge(status: ComplianceRequirementStatus): string {
    const map: Record<ComplianceRequirementStatus, string> = {
      [ComplianceRequirementStatus.Active]: 'badge-success',
      [ComplianceRequirementStatus.Superseded]: 'badge-warning',
      [ComplianceRequirementStatus.Retired]: 'badge-neutral'
    };
    return map[status] ?? 'badge-ghost';
  }

  /** Get DaisyUI badge class for check outcome. */
  getOutcomeBadge(outcome: ComplianceCheckOutcome): string {
    const map: Record<ComplianceCheckOutcome, string> = {
      [ComplianceCheckOutcome.Compliant]: 'badge-success',
      [ComplianceCheckOutcome.NonCompliant]: 'badge-error',
      [ComplianceCheckOutcome.PartiallyCompliant]: 'badge-warning',
      [ComplianceCheckOutcome.NotApplicable]: 'badge-neutral'
    };
    return map[outcome] ?? 'badge-ghost';
  }
}
