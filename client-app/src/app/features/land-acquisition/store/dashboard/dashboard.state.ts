import { IDashboardMetrics, IRecentActivity } from '../../models/dashboard.model';

/**
 * State shape for the dashboard feature slice.
 * Holds KPI metrics, recent activity, loading flag, and error state.
 */
export interface IDashboardState {
  readonly metrics: IDashboardMetrics | null;
  readonly recentActivity: readonly IRecentActivity[];
  readonly loading: boolean;
  readonly error: string | null;
}

/**
 * Initial state for the dashboard store slice.
 */
export const initialDashboardState: IDashboardState = {
  metrics: null,
  recentActivity: [],
  loading: false,
  error: null
};
