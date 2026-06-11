import { createFeatureSelector, createSelector } from '@ngrx/store';
import { IDashboardState } from './dashboard.state';

/**
 * Feature selector for the dashboard state slice.
 */
export const selectDashboardState = createFeatureSelector<IDashboardState>('dashboard');

/**
 * Select dashboard KPI metrics.
 * Returns null when metrics have not yet been loaded.
 */
export const selectMetrics = createSelector(
  selectDashboardState,
  (state) => state.metrics
);

/**
 * Select the recent activity feed.
 */
export const selectActivity = createSelector(
  selectDashboardState,
  (state) => state.recentActivity
);

/**
 * Select the loading flag for the dashboard state.
 */
export const selectDashboardLoading = createSelector(
  selectDashboardState,
  (state) => state.loading
);

/**
 * Select the error message from the dashboard state.
 * Returns null when no error is present.
 */
export const selectDashboardError = createSelector(
  selectDashboardState,
  (state) => state.error
);
