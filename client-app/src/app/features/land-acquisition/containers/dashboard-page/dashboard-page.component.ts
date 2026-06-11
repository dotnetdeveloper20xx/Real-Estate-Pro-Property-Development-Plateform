import { Component, ChangeDetectionStrategy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';

import { DashboardActions, selectMetrics, selectActivity, selectDashboardLoading } from '../../store/dashboard';
import { KpiCardComponent } from '../../components/kpi-card/kpi-card.component';
import { ActivityTimelineComponent } from '../../components/activity-timeline/activity-timeline.component';
import { IDashboardMetrics, IRecentActivity } from '../../models/dashboard.model';
import { OpportunityStatus } from '../../models/opportunity.model';

/**
 * Dashboard container page for the Land Acquisition module.
 *
 * Dispatches loadMetrics and loadActivity on init, displays:
 * - KPI cards (Avg Cycle, Total Evaluated, Conversion Rate, DD Pass Rate)
 * - Pipeline summary (count per status)
 * - Recent activity (last 5 actions)
 * - Alerts section (offers expiring within 7 days, overdue DD items)
 * - Skeleton loading placeholders while data loads
 *
 * Requirements: 18.1, 18.2, 18.3, 18.4, 18.5, 18.6
 */
@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [CommonModule, KpiCardComponent, ActivityTimelineComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Page Header -->
    <div class="p-6 space-y-6">
      <div class="flex flex-col gap-1">
        <h1 class="text-2xl font-bold text-base-content">Land Acquisition Dashboard</h1>
        <p class="text-sm text-base-content/60">
          Overview of acquisition pipeline, KPIs, and recent activity.
        </p>
      </div>

      <!-- KPI Cards Section -->
      <section aria-label="Key Performance Indicators">
        <ng-container *ngIf="!(loading$ | async); else kpiSkeleton">
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" *ngIf="metrics$ | async as metrics">
            <app-kpi-card
              label="Avg. Acquisition Cycle"
              [value]="formatCycleDays(metrics.averageAcquisitionCycleDays)"
              icon="schedule">
            </app-kpi-card>
            <app-kpi-card
              label="Total Evaluated"
              [value]="metrics.totalEvaluated.toString()"
              icon="assignment_turned_in">
            </app-kpi-card>
            <app-kpi-card
              label="Conversion Rate"
              [value]="formatPercent(metrics.conversionRatePercent)"
              icon="trending_up">
            </app-kpi-card>
            <app-kpi-card
              label="DD Pass Rate"
              [value]="formatPercent(metrics.dueDiligencePassRatePercent)"
              icon="verified">
            </app-kpi-card>
          </div>
        </ng-container>

        <ng-template #kpiSkeleton>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div *ngFor="let i of [1,2,3,4]" class="card bg-base-100 shadow-sm border border-base-200 h-full">
              <div class="card-body p-5 animate-pulse">
                <div class="flex items-start justify-between">
                  <div class="flex flex-col gap-2">
                    <div class="h-4 w-28 bg-base-300 rounded"></div>
                    <div class="h-7 w-20 bg-base-300 rounded"></div>
                  </div>
                  <div class="w-10 h-10 bg-base-300 rounded-lg"></div>
                </div>
              </div>
            </div>
          </div>
        </ng-template>
      </section>

      <!-- Pipeline Summary + Alerts Row -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Pipeline Summary -->
        <section class="lg:col-span-2" aria-label="Pipeline Summary">
          <ng-container *ngIf="!(loading$ | async); else pipelineSkeleton">
            <div class="card bg-base-100 shadow-sm border border-base-200" *ngIf="metrics$ | async as metrics">
              <div class="card-body p-5">
                <h2 class="text-lg font-semibold text-base-content mb-4">Pipeline Summary</h2>
                <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  <div
                    *ngFor="let status of pipelineStatuses"
                    class="flex flex-col items-center p-3 rounded-lg bg-base-200/50 border border-base-200">
                    <span class="text-2xl font-bold text-primary">
                      {{ getStatusCount(metrics, status) }}
                    </span>
                    <span class="text-xs text-base-content/60 text-center mt-1">
                      {{ formatStatusLabel(status) }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </ng-container>

          <ng-template #pipelineSkeleton>
            <div class="card bg-base-100 shadow-sm border border-base-200">
              <div class="card-body p-5 animate-pulse">
                <div class="h-5 w-40 bg-base-300 rounded mb-4"></div>
                <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  <div *ngFor="let i of [1,2,3,4,5,6,7]" class="flex flex-col items-center p-3 rounded-lg bg-base-200/50 border border-base-200">
                    <div class="h-7 w-10 bg-base-300 rounded mb-1"></div>
                    <div class="h-3 w-16 bg-base-300 rounded"></div>
                  </div>
                </div>
              </div>
            </div>
          </ng-template>
        </section>

        <!-- Alerts Section -->
        <section aria-label="Alerts and Notifications">
          <ng-container *ngIf="!(loading$ | async); else alertsSkeleton">
            <div class="card bg-base-100 shadow-sm border border-base-200 h-full">
              <div class="card-body p-5">
                <h2 class="text-lg font-semibold text-base-content mb-4">
                  <span class="material-symbols-outlined text-warning align-middle mr-1">notifications_active</span>
                  Alerts
                </h2>
                <div class="space-y-3">
                  <!-- Placeholder alert items — populated when API provides alert data -->
                  <div class="flex items-start gap-3 p-3 rounded-lg bg-warning/10 border border-warning/20">
                    <span class="material-symbols-outlined text-warning text-lg mt-0.5">timer</span>
                    <div class="flex flex-col">
                      <span class="text-sm font-medium text-base-content">Offers Expiring Soon</span>
                      <span class="text-xs text-base-content/60">Offers expiring within 7 days require attention</span>
                    </div>
                  </div>
                  <div class="flex items-start gap-3 p-3 rounded-lg bg-error/10 border border-error/20">
                    <span class="material-symbols-outlined text-error text-lg mt-0.5">warning</span>
                    <div class="flex flex-col">
                      <span class="text-sm font-medium text-base-content">Overdue Due Diligence</span>
                      <span class="text-xs text-base-content/60">Due diligence items past their expected completion</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ng-container>

          <ng-template #alertsSkeleton>
            <div class="card bg-base-100 shadow-sm border border-base-200 h-full">
              <div class="card-body p-5 animate-pulse">
                <div class="h-5 w-24 bg-base-300 rounded mb-4"></div>
                <div class="space-y-3">
                  <div class="h-16 bg-base-300 rounded-lg"></div>
                  <div class="h-16 bg-base-300 rounded-lg"></div>
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
              <h2 class="text-lg font-semibold text-base-content mb-4">Recent Activity</h2>
              <app-activity-timeline [activities]="(activity$ | async) ?? []"></app-activity-timeline>
            </div>
          </div>
        </ng-container>

        <ng-template #activitySkeleton>
          <div class="card bg-base-100 shadow-sm border border-base-200">
            <div class="card-body p-5 animate-pulse">
              <div class="h-5 w-36 bg-base-300 rounded mb-4"></div>
              <div class="space-y-4">
                <div *ngFor="let i of [1,2,3,4,5]" class="flex items-center gap-3">
                  <div class="w-3 h-3 bg-base-300 rounded-full"></div>
                  <div class="flex-1 space-y-1">
                    <div class="h-4 w-48 bg-base-300 rounded"></div>
                    <div class="h-3 w-64 bg-base-300 rounded"></div>
                  </div>
                  <div class="h-3 w-24 bg-base-300 rounded"></div>
                </div>
              </div>
            </div>
          </div>
        </ng-template>
      </section>
    </div>
  `
})
export class DashboardPageComponent implements OnInit {
  private readonly store = inject(Store);

  /** Observable of dashboard KPI metrics. */
  readonly metrics$: Observable<IDashboardMetrics | null> = this.store.select(selectMetrics);

  /** Observable of recent activity feed. */
  readonly activity$: Observable<readonly IRecentActivity[]> = this.store.select(selectActivity);

  /** Observable of loading state. */
  readonly loading$: Observable<boolean> = this.store.select(selectDashboardLoading);

  /** Pipeline statuses displayed in the summary section. */
  readonly pipelineStatuses: readonly OpportunityStatus[] = [
    OpportunityStatus.Identified,
    OpportunityStatus.InitialReview,
    OpportunityStatus.DueDiligence,
    OpportunityStatus.OfferMade,
    OpportunityStatus.UnderContract,
    OpportunityStatus.Acquired,
    OpportunityStatus.Withdrawn
  ];

  ngOnInit(): void {
    this.store.dispatch(DashboardActions.loadMetrics());
    this.store.dispatch(DashboardActions.loadActivity());
  }

  /**
   * Formats the average cycle days into a display string.
   */
  formatCycleDays(days: number): string {
    return `${Math.round(days)} days`;
  }

  /**
   * Formats a percentage value for display.
   */
  formatPercent(value: number): string {
    return `${value.toFixed(1)}%`;
  }

  /**
   * Gets the count for a specific status from metrics.
   */
  getStatusCount(metrics: IDashboardMetrics, status: OpportunityStatus): number {
    return metrics.opportunitiesByStatus[status] ?? 0;
  }

  /**
   * Formats an OpportunityStatus enum value into a human-readable label.
   */
  formatStatusLabel(status: OpportunityStatus): string {
    return status
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2')
      .trim();
  }
}
