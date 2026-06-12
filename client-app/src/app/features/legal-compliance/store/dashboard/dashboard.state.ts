import { IDashboardData } from '../../models';

/**
 * NgRx state interface for the legal compliance dashboard feature slice.
 * Stores the complete dashboard KPI data as returned by the API.
 */
export interface DashboardState {
  /** The full dashboard data object (null until first successful load) */
  readonly data: IDashboardData | null;
  /** Indicates whether an API call is in progress */
  readonly loading: boolean;
  /** Stores the latest error message from a failed API call */
  readonly error: string | null;
}
