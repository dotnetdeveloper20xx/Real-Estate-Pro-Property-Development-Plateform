import { IDashboardMetrics } from '../../models/dashboard-metrics.model';

/**
 * State shape for the planning dashboard feature slice.
 * Holds the full dashboard metrics object, loading flag, and error state.
 */
export interface IDashboardState {
  /** Full dashboard metrics including KPIs, status counts, activity, and deadlines */
  readonly metrics: IDashboardMetrics | null;
  /** Indicates whether an API call is in progress */
  readonly loading: boolean;
  /** Stores the latest error message from a failed API call */
  readonly error: string | null;
}

/**
 * Initial state for the planning dashboard store slice.
 */
export const initialDashboardState: IDashboardState = {
  metrics: null,
  loading: false,
  error: null
};
