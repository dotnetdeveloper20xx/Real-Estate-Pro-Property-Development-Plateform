import { IDashboardMetrics } from '../../models/dashboard.model';

/**
 * State shape for the dashboard feature slice.
 * Holds comprehensive dashboard metrics, loading flag, and error state.
 */
export interface IDashboardState {
  readonly metrics: IDashboardMetrics | null;
  readonly loading: boolean;
  readonly error: string | null;
}

/**
 * Initial state for the dashboard store slice.
 */
export const initialDashboardState: IDashboardState = {
  metrics: null,
  loading: false,
  error: null
};
