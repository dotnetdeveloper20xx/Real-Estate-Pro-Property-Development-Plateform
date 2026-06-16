import { createFeatureSelector, createSelector } from '@ngrx/store';
import { SessionsState } from './sessions.state';

/**
 * Feature selector for the admin sessions state slice.
 */
export const selectSessionsState = createFeatureSelector<SessionsState>('adminSessions');

/**
 * Select all sessions for the current user.
 */
export const selectAllSessions = createSelector(
  selectSessionsState,
  (state: SessionsState) => state.sessions
);

/**
 * Select the user ID whose sessions are loaded.
 */
export const selectSessionsUserId = createSelector(
  selectSessionsState,
  (state: SessionsState) => state.userId
);

/**
 * Select the loading state indicator.
 */
export const selectSessionsLoading = createSelector(
  selectSessionsState,
  (state: SessionsState) => state.loading
);

/**
 * Select the current error message.
 */
export const selectSessionsError = createSelector(
  selectSessionsState,
  (state: SessionsState) => state.error
);

/**
 * Select only active (non-revoked) sessions.
 */
export const selectActiveSessions = createSelector(
  selectAllSessions,
  (sessions) => sessions.filter(s => !s.isRevoked)
);

/**
 * Select the total number of sessions.
 */
export const selectSessionsCount = createSelector(
  selectAllSessions,
  (sessions) => sessions.length
);
