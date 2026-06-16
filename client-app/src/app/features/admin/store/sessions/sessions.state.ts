import { ISessionItem } from '../../models/user.model';

/**
 * NgRx state interface for the admin sessions feature slice.
 */
export interface SessionsState {
  /** List of sessions for the currently viewed user */
  readonly sessions: readonly ISessionItem[];
  /** The user ID whose sessions are currently loaded */
  readonly userId: string | null;
  /** Whether a sessions API call is in progress */
  readonly loading: boolean;
  /** The latest error message from a failed API call */
  readonly error: string | null;
}

/**
 * Initial state for the admin sessions store.
 */
export const initialSessionsState: SessionsState = {
  sessions: [],
  userId: null,
  loading: false,
  error: null
};
