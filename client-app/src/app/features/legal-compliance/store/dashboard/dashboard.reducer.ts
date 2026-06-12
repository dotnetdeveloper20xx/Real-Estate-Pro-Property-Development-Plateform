import { createReducer, on } from '@ngrx/store';
import { DashboardState } from './dashboard.state';
import { DashboardActions } from './dashboard.actions';

/**
 * Initial state for the dashboard slice.
 */
export const initialDashboardState: DashboardState = {
  data: null,
  loading: false,
  error: null
};

/**
 * Dashboard reducer handling all dashboard-related actions.
 * Stores the complete IDashboardData object returned by the API.
 */
export const dashboardReducer = createReducer(
  initialDashboardState,

  on(DashboardActions.loadDashboard, (state): DashboardState => ({
    ...state,
    loading: true,
    error: null
  })),

  on(DashboardActions.loadDashboardSuccess, (state, { data }): DashboardState => ({
    ...state,
    data,
    loading: false,
    error: null
  })),

  on(DashboardActions.loadDashboardFailure, (state, { error }): DashboardState => ({
    ...state,
    loading: false,
    error
  }))
);
