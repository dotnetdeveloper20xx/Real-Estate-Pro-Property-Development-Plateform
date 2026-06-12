import { createReducer, on } from '@ngrx/store';
import { IDashboardState, initialDashboardState } from './dashboard.state';
import { DashboardActions } from './dashboard.actions';

/**
 * Reducer for the planning dashboard state slice.
 * Handles the load dashboard lifecycle (loading, success, failure).
 */
export const dashboardReducer = createReducer(
  initialDashboardState,

  on(DashboardActions.loadDashboard, (state): IDashboardState => ({
    ...state,
    loading: true,
    error: null
  })),

  on(DashboardActions.loadDashboardSuccess, (state, { metrics }): IDashboardState => ({
    ...state,
    metrics,
    loading: false,
    error: null
  })),

  on(DashboardActions.loadDashboardFailure, (state, { error }): IDashboardState => ({
    ...state,
    loading: false,
    error
  }))
);
