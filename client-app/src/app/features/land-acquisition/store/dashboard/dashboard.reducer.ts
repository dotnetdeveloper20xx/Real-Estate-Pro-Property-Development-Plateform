import { createReducer, on } from '@ngrx/store';
import { IDashboardState, initialDashboardState } from './dashboard.state';
import { DashboardActions } from './dashboard.actions';

/**
 * Reducer for the dashboard state slice.
 * Handles metrics and activity loading lifecycle.
 */
export const dashboardReducer = createReducer(
  initialDashboardState,

  // Load Metrics
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
  })),

  // Load Activity
  on(DashboardActions.loadActivity, (state): IDashboardState => ({
    ...state,
    loading: true,
    error: null
  })),

  on(DashboardActions.loadActivitySuccess, (state, { activity }): IDashboardState => ({
    ...state,
    recentActivity: activity,
    loading: false,
    error: null
  })),

  on(DashboardActions.loadActivityFailure, (state, { error }): IDashboardState => ({
    ...state,
    loading: false,
    error
  }))
);
