import { createReducer, on } from '@ngrx/store';
import { IDashboardState, initialDashboardState } from './dashboard.state';
import { DashboardActions } from './dashboard.actions';

/**
 * Reducer for the dashboard state slice.
 * Handles the single metrics load lifecycle.
 */
export const dashboardReducer = createReducer(
  initialDashboardState,

  on(DashboardActions.loadMetrics, (state): IDashboardState => ({
    ...state,
    loading: true,
    error: null
  })),

  on(DashboardActions.loadMetricsSuccess, (state, { metrics }): IDashboardState => ({
    ...state,
    metrics,
    loading: false,
    error: null
  })),

  on(DashboardActions.loadMetricsFailure, (state, { error }): IDashboardState => ({
    ...state,
    loading: false,
    error
  }))
);
