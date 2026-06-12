import { Component, ChangeDetectionStrategy, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';

import {
  DashboardActions,
  selectKPIs,
  selectStatusCounts,
  selectRecentActivity,
  selectApproachingDeadlines,
  selectLoading,
  selectError
} from '../../store/dashboard';
import { KpiCardComponent } from '../../components/kpi-card/kpi-card.component';
import { IRecentActivity, IApproachingDeadline } from '../../models/dashboard-metrics.model';
import { PlanningApplicationStatus } from '../../models/planning-application.model';

/**
 * KPI data shape from the dashboard selector.
 */
interface IKpiData {
  readonly approvalRatePercent: number;
  readonly appealSuccessRatePercent: number;
  readonly averageDecisionTimeDays: number | null;
  readonly outstandingConditionsCount: number;
  readonly overdueMilestonesCount: number;
}

/**
 * PlanningDashboardContainer — Smart container component for the Planning & Approvals dashboard.
 *
 * Responsibilities:
 * - Dispatches loadDashboard action on init (and on navigation)
 * - Displays KPI cards: Average Decision Time, Approval Rate, Appeal Success Rate, Outstanding Conditions
 * - Shows pipeline summary chart (count per status)
 * - Shows recent activity section (last 5 actions)
 * - Shows upcoming deadlines section (milestones due within 14 days and overdue)
 * - Renders skeleton loading placeholders while data loads
 *
 * Requirements: 18.1, 18.2, 18.3, 18.4, 18.5, 18.6
 */
@Component({
  selector: 'app-planning-dashboard',
  standalone: true,
  imports: [CommonModule, KpiCardComponent, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Page Header -->
    <div class="p-6 space-y-6">
      <div class="flex flex-col gap-1">
        <h1 class="text-2xl font-bold text-base-content">Planning & Approvals Dashboard</h1>
        <p class="text-sm text-base-content/60">
          Monitor planning performance, track application pipeline, and stay on top of upcoming deadlines.
        </p>
      </div>

      <!-- Error State -->
      <div *ngIf="error$ | async as error" class="alert alert-error shadow-sm">
        <span class="material-symbols-outlined">error</span>
        <div>
          <h3 class="font-semibold">Failed to Load Dashboard</h3>
          <p class="text-sm">{{ error }}</p>
        </div>
        <button class="btn btn-sm btn-ghost" (click)="refresh()">Retry</button>
      </div>

      <!-- KPI Cards Section -->
      <section aria-label="Key Performance Indicators">
        <ng-container *ngIf="!(loading$ | async); else kpiSkeleton">
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" *ngIf="kpis$ | async as kpis">
            <app-planning-kpi-card
              label="Avg. Decision Time"
              [value]="formatDecisionTime(kpis.averageDecisionTimeDays)"
              icon="schedule">
            </app-planning-kpi-card>
            <app-planning-kpi-card
              label="Approval Rate"
              [value]="formatPercent(kpis.approvalRatePercent)"
              icon="check_circle">
            </app-planning-kpi-card>
            <app-planning-kpi-card
              label="Appeal Success Rate"
              [value]="formatPercent(kpis.appealSuccessRatePercent)"
              icon="gavel">
            </app-planning-kpi-card>
            <app-planning-kpi-card
              label="Outstanding Conditions"
              [value]="kpis.outstandingConditionsCount.toString()"
              icon="pending_actions">
            </app-planning-kpi-card>
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

      <!-- Pipeline Summary + Upcoming Deadlines Row -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Pipeline Summary -->
        <section class="lg:col-span-2" aria-label="Pipeline Summary">
          <ng-container *ngIf="!(loading$ | async); else pipelineSkeleton">
            <div class="card bg-base-100 shadow-sm border border-base-200" *ngIf="statusCounts$ | async as statusCounts">
              <div class="card-body p-5">
                <h2 class="text-lg font-semibold text-base-content mb-4">Pipeline Summary</h2>
                <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                  <div
                    *ngFor="let status of pipelineStatuses"
                    class="flex flex-col items-center p-3 rounded-lg bg-base-200/50 border border-base-200">
                    <span class="text-2xl font-bold text-primary">
                      {{ getStatusCount(statusCounts, status) }}
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
                <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                  <div *ngFor="let i of [1,2,3,4,5,6,7,8,9,10]" class="flex flex-col items-center p-3 rounded-lg bg-base-200/50 border border-base-200">
                    <div class="h-7 w-10 bg-base-300 rounded mb-1"></div>
                    <div class="h-3 w-16 bg-base-300 rounded"></div>
                  </div>
                </div>
              </div>
            </div>
          </ng-template>
        </section>

        <!-- Upcoming Deadlines Section -->
        <section aria-label="Upcoming Deadlines">
          <ng-container *ngIf="!(loading$ | async); else deadlinesSkeleton">
            <div class="card bg-base-100 shadow-sm border border-base-200 h-full">
              <div class="card-body p-5">
                <h2 class="text-lg font-semibold text-base-content mb-4">
                  <span class="material-symbols-outlined text-warning align-middle mr-1">event_upcoming</span>
                  Upcoming Deadlines
                </h2>
                <ng-container *ngIf="(deadlines$ | async)?.length; else noDeadlines">
                  <div class="overflow-x-auto">
                    <table class="table table-sm w-full">
                      <thead>
                        <tr>
                          <th class="text-xs">Application</th>
                          <th class="text-xs">Target Date</th>
                          <th class="text-xs text-right">Days</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr *ngFor="let deadline of deadlines$ | async" class="hover">
                          <td class="text-sm max-w-[180px] truncate" [title]="deadline.description">
                            {{ deadline.description }}
                          </td>
                          <td class="text-sm">{{ deadline.targetDecisionDate | date:'dd MMM yyyy' }}</td>
                          <td class="text-right">
                            <span
                              class="badge badge-sm"
                              [ngClass]="deadline.daysRemaining < 0 ? 'badge-error' : deadline.daysRemaining <= 7 ? 'badge-warning' : 'badge-info'">
                              {{ deadline.daysRemaining < 0 ? 'Overdue' : deadline.daysRemaining + 'd' }}
                            </span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </ng-container>
                <ng-template #noDeadlines>
                  <div class="flex flex-col items-center justify-center py-6 text-center">
                    <span class="material-symbols-outlined text-4xl text-base-content/30 mb-2">event_available</span>
                    <p class="text-sm text-base-content/60">No upcoming deadlines within 14 days</p>
                  </div>
                </ng-template>
              </div>
            </div>
          </ng-container>

          <ng-template #deadlinesSkeleton>
            <div class="card bg-base-100 shadow-sm border border-base-200 h-full">
              <div class="card-body p-5 animate-pulse">
                <div class="h-5 w-44 bg-base-300 rounded mb-4"></div>
                <div class="space-y-3">
                  <div *ngFor="let i of [1,2,3,4]" class="flex items-center gap-3">
                    <div class="h-4 w-32 bg-base-300 rounded"></div>
                    <div class="h-4 w-20 bg-base-300 rounded"></div>
                    <div class="h-5 w-12 bg-base-300 rounded ml-auto"></div>
                  </div>
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
              <ng-container *ngIf="(recentActivity$ | async)?.length; else noActivity">
                <div class="space-y-4">
                  <div
                    *ngFor="let activity of recentActivity$ | async; trackBy: trackByActivity"
                    class="flex items-start gap-3 p-3 rounded-lg bg-base-200/30 border border-base-200/50">
                    <div class="flex-shrink-0 mt-0.5">
                      <div class="w-3 h-3 rounded-full bg-primary"></div>
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-medium text-base-content truncate">
                        {{ activity.description }}
                      </p>
                      <p class="text-xs text-base-content/60 mt-0.5">
                        <span class="badge badge-ghost badge-xs mr-1">{{ activity.previousStatus }}</span>
                        →
                        <span class="badge badge-primary badge-xs ml-1">{{ activity.newStatus }}</span>
                        <span class="ml-2">by {{ activity.changedBy }}</span>
                      </p>
                    </div>
                    <div class="flex-shrink-0 text-xs text-base-content/50">
                      {{ activity.changedAt | date:'dd MMM, HH:mm' }}
                    </div>
                  </div>
                </div>
              </ng-container>
              <ng-template #noActivity>
                <div class="flex flex-col items-center justify-center py-6 text-center">
                  <span class="material-symbols-outlined text-4xl text-base-content/30 mb-2">history</span>
                  <p class="text-sm text-base-content/60">No recent activity to display</p>
                  <p class="text-xs text-base-content/40 mt-1">Activity will appear here as applications progress through the pipeline.</p>
                </div>
              </ng-template>
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
export class PlanningDashboardComponent implements OnInit {
  private readonly store = inject(Store);

  /** Observable of KPI data (approval rate, appeal success rate, decision time, conditions). */
  readonly kpis$: Observable<IKpiData | null> = this.store.select(selectKPIs);

  /** Observable of application status counts for pipeline summary. */
  readonly statusCounts$: Observable<Readonly<Record<string, number>> | null> = this.store.select(selectStatusCounts);

  /** Observable of recent activity entries (last 5 shown in template). */
  readonly recentActivity$: Observable<readonly IRecentActivity[]> = this.store.select(selectRecentActivity);

  /** Observable of approaching deadlines (milestones due within 14 days and overdue). */
  readonly deadlines$: Observable<readonly IApproachingDeadline[]> = this.store.select(selectApproachingDeadlines);

  /** Observable of loading state for skeleton display. */
  readonly loading$: Observable<boolean> = this.store.select(selectLoading);

  /** Observable of error state for error display. */
  readonly error$: Observable<string | null> = this.store.select(selectError);

  /** All pipeline statuses displayed in the pipeline summary section. */
  readonly pipelineStatuses: readonly PlanningApplicationStatus[] = [
    PlanningApplicationStatus.PreApplication,
    PlanningApplicationStatus.Submitted,
    PlanningApplicationStatus.Validated,
    PlanningApplicationStatus.UnderReview,
    PlanningApplicationStatus.CommitteeReview,
    PlanningApplicationStatus.Approved,
    PlanningApplicationStatus.ApprovedWithConditions,
    PlanningApplicationStatus.Refused,
    PlanningApplicationStatus.Appeal,
    PlanningApplicationStatus.Withdrawn
  ];

  /**
   * Dispatches loadDashboard on init — refreshes data each time the user navigates here.
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
   * Formats the average decision time into a display string.
   * Returns 'N/A' when no data is available.
   */
  formatDecisionTime(days: number | null): string {
    if (days === null || days === undefined) {
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
   * Gets the count for a specific status from the status counts record.
   */
  getStatusCount(statusCounts: Readonly<Record<string, number>>, status: PlanningApplicationStatus): number {
    return statusCounts[status] ?? 0;
  }

  /**
   * Formats a PlanningApplicationStatus enum value into a human-readable label.
   */
  formatStatusLabel(status: PlanningApplicationStatus): string {
    return status
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2')
      .trim();
  }

  /**
   * TrackBy function for the recent activity ngFor loop.
   */
  trackByActivity(_index: number, activity: IRecentActivity): string {
    return `${activity.applicationId}-${activity.changedAt}`;
  }
}
