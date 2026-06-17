import { createFeatureSelector, createSelector } from '@ngrx/store';
import { IDashboardState } from './dashboard.state';

/**
 * Feature selector for the dashboard state slice.
 */
export const selectDashboardState = createFeatureSelector<IDashboardState>('dashboard');

/**
 * Select dashboard metrics (all data in one object).
 * Returns null when data has not yet been loaded.
 */
export const selectMetrics = createSelector(
  selectDashboardState,
  (state) => state.metrics
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
 */
export const selectDashboardError = createSelector(
  selectDashboardState,
  (state) => state.error
);
