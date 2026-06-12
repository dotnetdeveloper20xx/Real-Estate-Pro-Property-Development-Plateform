import { Component, ChangeDetectionStrategy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import {
  DashboardActions,
  selectDashboardLoading,
  selectDashboardError,
  selectTotalOpenCases,
  selectAverageResolutionTimeDays,
  selectComplianceRate,
  selectContractsAwaitingApproval,
  selectExpiringInsuranceCount,
  selectExpiredInsuranceCount,
  selectOverdueComplianceCount,
  selectOverdueAuditCount,
  selectRecentActivities,
  selectCaseCountsByStatus
} from '../../store/dashboard';
import { selectExpiringSoonRecords } from '../../store/insurance';
import { ICaseCountByStatus, IRecentActivity } from '../../models/dashboard.model';
import { IInsuranceRecordListItem } from '../../models/insurance-record.model';
import { KpiMetricCardComponent } from '../../components/kpi-metric-card/kpi-metric-card.component';
import { InsuranceAlertCardComponent } from '../../components/insurance-alert-card/insurance-alert-card.component';
import { AuditTimelineComponent } from '../../components/audit-timeline/audit-timeline.component';
import { ComplianceStatusBadgeComponent, ComplianceStatusColor } from '../../components/compliance-status-badge/compliance-status-badge.component';

/**
 * LegalDashboardComponent — Smart container for the Legal & Compliance Dashboard.
 *
 * Responsibilities:
 * - Dispatches DashboardActions.loadDashboard on init
 * - Displays KPI cards: Open Cases, Avg Resolution Time, Compliance Rate,
 *   Contracts Awaiting Approval, Expiring Insurance
 * - Shows compliance overview section with overdue counts
 * - Shows insurance alerts section with expiring/expired counts
 * - Shows recent activity using the audit-timeline component
 * - Renders skeleton loading placeholders (DaisyUI) while data loads
 * - Displays error state with retry action
 *
 * Requirements: 18.1, 18.2, 18.3, 18.4, 18.5, 18.6, 18.7
 */
@Component({
  selector: 'app-legal-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    KpiMetricCardComponent,
    InsuranceAlertCardComponent,
    AuditTimelineComponent,
    ComplianceStatusBadgeComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Page Header -->
    <div class="p-6 space-y-6">
      <div class="flex flex-col gap-1">
        <h1 class="text-2xl font-bold text-base-content">Legal & Compliance Dashboard</h1>
        <p class="text-sm text-base-content/60">
          Monitor legal cases, compliance status, insurance coverage, and audit activities at a glance.
        </p>
      </div>

      <!-- Error State -->
      <div
        *ngIf="error$ | async as error"
        class="alert alert-error shadow-sm"
        role="alert"
      >
        <span class="material-symbols-outlined">error</span>
        <div>
          <h3 class="font-semibold">Failed to Load Dashboard</h3>
          <p class="text-sm">{{ error }}</p>
        </div>
        <button class="btn btn-sm btn-ghost" (click)="refresh()" aria-label="Retry loading dashboard">
          Retry
        </button>
      </div>

      <!-- KPI Cards Section -->
      <section aria-label="Key Performance Indicators">
        <ng-container *ngIf="!(loading$ | async); else kpiSkeleton">
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <app-kpi-metric-card
              label="Open Cases"
              [value]="(totalOpenCases$ | async) ?? 0"
              icon="folder_open"
            ></app-kpi-metric-card>

            <app-kpi-metric-card
              label="Avg Resolution Time"
              [value]="formatResolutionTime((averageResolutionTimeDays$ | async) ?? 0)"
              icon="schedule"
            ></app-kpi-metric-card>

            <app-kpi-metric-card
              label="Compliance Rate"
              [value]="formatPercent((complianceRate$ | async) ?? 0)"
              icon="verified"
            ></app-kpi-metric-card>

            <app-kpi-metric-card
              label="Contracts Awaiting Approval"
              [value]="(contractsAwaitingApproval$ | async) ?? 0"
              icon="pending_actions"
            ></app-kpi-metric-card>

            <app-kpi-metric-card
              label="Expiring Insurance"
              [value]="getTotalInsuranceAlerts()"
              icon="shield"
              [trend]="getInsuranceTrend()"
            ></app-kpi-metric-card>
          </div>
        </ng-container>

        <ng-template #kpiSkeleton>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div
              *ngFor="let i of skeletonKpiCards"
              class="card bg-base-100 shadow-sm border border-base-200 h-full"
            >
              <div class="card-body p-5 animate-pulse flex flex-col items-center gap-2">
                <div class="h-6 w-6 bg-base-300 rounded-full"></div>
                <div class="h-8 w-16 bg-base-300 rounded"></div>
                <div class="h-4 w-24 bg-base-300 rounded"></div>
              </div>
            </div>
          </div>
        </ng-template>
      </section>

      <!-- Compliance Overview + Insurance Alerts Row -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Compliance Overview Section -->
        <section aria-label="Compliance Overview">
          <ng-container *ngIf="!(loading$ | async); else complianceSkeleton">
            <div class="card bg-base-100 shadow-sm border border-base-200 h-full">
              <div class="card-body p-5">
                <h2 class="text-lg font-semibold text-base-content mb-4">
                  <span class="material-symbols-outlined text-primary align-middle mr-1">checklist</span>
                  Compliance Overview
                </h2>

                <div class="space-y-4">
                  <!-- Compliance Rate Summary -->
                  <div class="flex items-center justify-between p-3 rounded-lg bg-base-200/40 border border-base-200">
                    <div class="flex items-center gap-2">
                      <app-compliance-status-badge
                        [statusColor]="getComplianceStatusColor()"
                        [showLabel]="true"
                      ></app-compliance-status-badge>
                    </div>
                    <span class="text-lg font-bold text-base-content">
                      {{ formatPercent((complianceRate$ | async) ?? 0) }}
                    </span>
                  </div>

                  <!-- Overdue Counts -->
                  <div class="grid grid-cols-2 gap-3">
                    <div class="flex flex-col items-center p-3 rounded-lg border border-base-200">
                      <span
                        class="text-2xl font-bold"
                        [class.text-error]="((overdueComplianceCount$ | async) ?? 0) > 0"
                        [class.text-success]="((overdueComplianceCount$ | async) ?? 0) === 0"
                      >
                        {{ (overdueComplianceCount$ | async) ?? 0 }}
                      </span>
                      <span class="text-xs text-base-content/60 text-center mt-1">Overdue Requirements</span>
                    </div>
                    <div class="flex flex-col items-center p-3 rounded-lg border border-base-200">
                      <span
                        class="text-2xl font-bold"
                        [class.text-error]="((overdueAuditCount$ | async) ?? 0) > 0"
                        [class.text-success]="((overdueAuditCount$ | async) ?? 0) === 0"
                      >
                        {{ (overdueAuditCount$ | async) ?? 0 }}
                      </span>
                      <span class="text-xs text-base-content/60 text-center mt-1">Overdue Audit Actions</span>
                    </div>
                  </div>

                  <!-- Case Pipeline Mini Summary -->
                  <div *ngIf="caseCountsByStatus$ | async as statusCounts">
                    <h3 class="text-sm font-medium text-base-content/70 mb-2">Cases by Status</h3>
                    <div class="flex flex-wrap gap-2">
                      <div
                        *ngFor="let item of statusCounts"
                        class="badge badge-outline gap-1"
                      >
                        <span class="font-semibold">{{ item.count }}</span>
                        {{ formatStatusLabel(item.status) }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ng-container>

          <ng-template #complianceSkeleton>
            <div class="card bg-base-100 shadow-sm border border-base-200 h-full">
              <div class="card-body p-5 animate-pulse">
                <div class="h-5 w-44 bg-base-300 rounded mb-4"></div>
                <div class="space-y-4">
                  <div class="h-14 bg-base-300 rounded"></div>
                  <div class="grid grid-cols-2 gap-3">
                    <div class="h-16 bg-base-300 rounded"></div>
                    <div class="h-16 bg-base-300 rounded"></div>
                  </div>
                  <div class="h-10 bg-base-300 rounded"></div>
                </div>
              </div>
            </div>
          </ng-template>
        </section>

        <!-- Insurance Alerts Section -->
        <section aria-label="Insurance Alerts">
          <ng-container *ngIf="!(loading$ | async); else insuranceSkeleton">
            <div class="card bg-base-100 shadow-sm border border-base-200 h-full">
              <div class="card-body p-5">
                <h2 class="text-lg font-semibold text-base-content mb-4">
                  <span class="material-symbols-outlined text-warning align-middle mr-1">shield</span>
                  Insurance Alerts
                </h2>

                <div class="space-y-3">
                  <!-- Summary counts -->
                  <div class="grid grid-cols-2 gap-3 mb-3">
                    <div class="flex items-center justify-between p-2 rounded-lg border border-warning/30 bg-warning/5">
                      <span class="text-xs font-medium text-base-content">Expiring Soon</span>
                      <span class="text-lg font-bold text-warning">
                        {{ (expiringInsuranceCount$ | async) ?? 0 }}
                      </span>
                    </div>
                    <div class="flex items-center justify-between p-2 rounded-lg border border-error/30 bg-error/5">
                      <span class="text-xs font-medium text-base-content">Expired</span>
                      <span class="text-lg font-bold text-error">
                        {{ (expiredInsuranceCount$ | async) ?? 0 }}
                      </span>
                    </div>
                  </div>

                  <!-- Individual alert cards for expiring policies -->
                  <div
                    *ngIf="(insuranceAlerts$ | async)?.length; else noInsuranceAlerts"
                    class="space-y-2 max-h-64 overflow-y-auto"
                  >
                    <app-insurance-alert-card
                      *ngFor="let record of insuranceAlerts$ | async; trackBy: trackByInsurance"
                      [insuranceRecord]="record"
                      (cardClick)="onInsuranceCardClick($event)"
                    ></app-insurance-alert-card>
                  </div>

                  <ng-template #noInsuranceAlerts>
                    <div class="flex flex-col items-center justify-center py-6 text-center">
                      <span class="material-symbols-outlined text-4xl text-success/50 mb-2">verified_user</span>
                      <p class="text-sm text-base-content/60">All insurance policies are up to date</p>
                      <p class="text-xs text-base-content/40 mt-1">No policies require immediate attention.</p>
                    </div>
                  </ng-template>
                </div>
              </div>
            </div>
          </ng-container>

          <ng-template #insuranceSkeleton>
            <div class="card bg-base-100 shadow-sm border border-base-200 h-full">
              <div class="card-body p-5 animate-pulse">
                <div class="h-5 w-40 bg-base-300 rounded mb-4"></div>
                <div class="space-y-3">
                  <div class="h-14 bg-base-300 rounded"></div>
                  <div class="h-14 bg-base-300 rounded"></div>
                  <div class="h-14 bg-base-300 rounded"></div>
                </div>
              </div>
            </div>
          </ng-template>
        </section>
      </div>

      <!-- Recent Activity Section -->
      <section aria-label="Recent Activity">
        <ng-container *ngIf="!(loading$ | async); else activitySkeleton">
          <div class="card bg-base-100 shadow-sm border border-base-200">
            <div class="card-body p-5">
              <h2 class="text-lg font-semibold text-base-content mb-4">
                <span class="material-symbols-outlined text-info align-middle mr-1">history</span>
                Recent Activity
              </h2>
              <app-audit-timeline
                [activities]="(recentActivities$ | async) ?? []"
              ></app-audit-timeline>
            </div>
          </div>
        </ng-container>

        <ng-template #activitySkeleton>
          <div class="card bg-base-100 shadow-sm border border-base-200">
            <div class="card-body p-5 animate-pulse">
              <div class="h-5 w-36 bg-base-300 rounded mb-4"></div>
              <div class="space-y-4">
                <div *ngFor="let i of skeletonActivityItems" class="flex items-start gap-3">
                  <div class="w-3 h-3 bg-base-300 rounded-full mt-1"></div>
                  <div class="flex-1 space-y-1">
                    <div class="h-4 w-48 bg-base-300 rounded"></div>
                    <div class="h-3 w-64 bg-base-300 rounded"></div>
                  </div>
                  <div class="h-3 w-20 bg-base-300 rounded"></div>
                </div>
              </div>
            </div>
          </div>
        </ng-template>
      </section>
    </div>
  `
})
export class LegalDashboardComponent implements OnInit {
  private readonly store = inject(Store);

  /** Loading state for skeleton display. */
  readonly loading$: Observable<boolean> = this.store.select(selectDashboardLoading);

  /** Error state for error display with retry. */
  readonly error$: Observable<string | null> = this.store.select(selectDashboardError);

  /** Total open cases KPI. */
  readonly totalOpenCases$: Observable<number> = this.store.select(selectTotalOpenCases);

  /** Average resolution time in days KPI. */
  readonly averageResolutionTimeDays$: Observable<number> = this.store.select(selectAverageResolutionTimeDays);

  /** Compliance rate percentage KPI. */
  readonly complianceRate$: Observable<number> = this.store.select(selectComplianceRate);

  /** Contracts awaiting approval count KPI. */
  readonly contractsAwaitingApproval$: Observable<number> = this.store.select(selectContractsAwaitingApproval);

  /** Count of insurance records expiring soon. */
  readonly expiringInsuranceCount$: Observable<number> = this.store.select(selectExpiringInsuranceCount);

  /** Count of insurance records already expired. */
  readonly expiredInsuranceCount$: Observable<number> = this.store.select(selectExpiredInsuranceCount);

  /** Count of overdue compliance requirements. */
  readonly overdueComplianceCount$: Observable<number> = this.store.select(selectOverdueComplianceCount);

  /** Count of overdue audit actions. */
  readonly overdueAuditCount$: Observable<number> = this.store.select(selectOverdueAuditCount);

  /** Recent activity entries for the audit timeline. */
  readonly recentActivities$: Observable<readonly IRecentActivity[]> = this.store.select(selectRecentActivities);

  /** Case counts grouped by status for pipeline mini-summary. */
  readonly caseCountsByStatus$: Observable<readonly ICaseCountByStatus[]> = this.store.select(selectCaseCountsByStatus);

  /** Combined expiring + expired insurance records for alert cards. */
  readonly insuranceAlerts$: Observable<readonly IInsuranceRecordListItem[]> = this.store.select(selectExpiringSoonRecords).pipe(
    map(expiring => {
      // We combine expiring soon records (the most urgent alerts to show)
      return expiring.slice(0, 5);
    })
  );

  /** Array used for skeleton KPI card iteration. */
  readonly skeletonKpiCards = [1, 2, 3, 4, 5];

  /** Array used for skeleton activity item iteration. */
  readonly skeletonActivityItems = [1, 2, 3, 4, 5];

  /** Cached values for synchronous template helpers. */
  private cachedExpiringCount = 0;
  private cachedExpiredCount = 0;
  private cachedComplianceRate = 0;

  constructor() {
    this.expiringInsuranceCount$.subscribe(count => this.cachedExpiringCount = count);
    this.expiredInsuranceCount$.subscribe(count => this.cachedExpiredCount = count);
    this.complianceRate$.subscribe(rate => this.cachedComplianceRate = rate);
  }

  /**
   * Dispatches the load dashboard action on component initialization.
   */
  ngOnInit(): void {
    this.store.dispatch(DashboardActions.loadDashboard());
  }

  /**
   * Manual refresh triggered by the retry button on error state.
   */
  refresh(): void {
    this.store.dispatch(DashboardActions.loadDashboard());
  }

  /**
   * Formats the average resolution time into a user-friendly string.
   */
  formatResolutionTime(days: number): string {
    if (days === 0) {
      return 'N/A';
    }
    return `${Math.round(days)} days`;
  }

  /**
   * Formats a percentage value for display.
   */
  formatPercent(value: number): string {
    return `${value.toFixed(1)}%`;
  }

  /**
   * Returns total insurance alerts (expiring + expired).
   */
  getTotalInsuranceAlerts(): number {
    return this.cachedExpiringCount + this.cachedExpiredCount;
  }

  /**
   * Returns trend direction based on insurance alert severity.
   */
  getInsuranceTrend(): 'up' | 'down' | 'flat' {
    const total = this.cachedExpiringCount + this.cachedExpiredCount;
    if (total === 0) {
      return 'flat';
    }
    return 'down';
  }

  /**
   * Returns a ComplianceStatusColor based on the compliance rate.
   */
  getComplianceStatusColor(): ComplianceStatusColor {
    const rate = this.cachedComplianceRate;
    if (rate >= 90) {
      return 'green';
    }
    if (rate >= 70) {
      return 'amber';
    }
    if (rate > 0) {
      return 'red';
    }
    return 'grey';
  }

  /**
   * Formats a status string from PascalCase to space-separated words.
   */
  formatStatusLabel(status: string): string {
    return status
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2')
      .trim();
  }

  /**
   * TrackBy function for insurance alert cards.
   */
  trackByInsurance(_index: number, item: IInsuranceRecordListItem): string {
    return item.id;
  }

  /**
   * Handles insurance alert card click events.
   * In a full implementation this would navigate to the insurance detail page.
   */
  onInsuranceCardClick(_record: IInsuranceRecordListItem): void {
    // Navigation to insurance detail will be implemented in a future task
  }
}
