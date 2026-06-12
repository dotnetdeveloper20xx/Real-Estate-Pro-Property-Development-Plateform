import { createFeatureSelector, createSelector } from '@ngrx/store';
import { IDashboardState } from './dashboard.state';

/**
 * Feature selector for the planning dashboard state slice.
 */
export const selectPlanningDashboardState =
  createFeatureSelector<IDashboardState>('planningDashboard');

/**
 * Select the full dashboard metrics object.
 * Returns null when data has not yet been loaded.
 */
export const selectMetrics = createSelector(
  selectPlanningDashboardState,
  (state) => state.metrics
);

/**
 * Select KPI values: approval rate, appeal success rate,
 * average decision time, outstanding conditions, and overdue milestones.
 */
export const selectKPIs = createSelector(
  selectMetrics,
  (metrics) => {
    if (!metrics) {
      return null;
    }
    return {
      approvalRatePercent: metrics.approvalRatePercent,
      appealSuccessRatePercent: metrics.appealSuccessRatePercent,
      averageDecisionTimeDays: metrics.averageDecisionTimeDays,
      outstandingConditionsCount: metrics.outstandingConditionsCount,
      overdueMilestonesCount: metrics.overdueMilestonesCount
    };
  }
);

/**
 * Select the status counts (pipeline summary) showing application count per status.
 */
export const selectStatusCounts = createSelector(
  selectMetrics,
  (metrics) => metrics?.statusCounts ?? null
);

/**
 * Select the recent activity feed showing latest status changes.
 */
export const selectRecentActivity = createSelector(
  selectMetrics,
  (metrics) => metrics?.recentActivity ?? []
);

/**
 * Select the approaching deadlines (applications nearing target decision date).
 */
export const selectApproachingDeadlines = createSelector(
  selectMetrics,
  (metrics) => metrics?.approachingDeadlines ?? []
);

/**
 * Select the loading flag for the dashboard state.
 */
export const selectLoading = createSelector(
  selectPlanningDashboardState,
  (state) => state.loading
);

/**
 * Select the error message from the dashboard state.
 * Returns null when no error is present.
 */
export const selectError = createSelector(
  selectPlanningDashboardState,
  (state) => state.error
);
