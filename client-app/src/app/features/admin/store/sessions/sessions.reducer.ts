import { createReducer, on } from '@ngrx/store';
import { SessionsState, initialSessionsState } from './sessions.state';
import { SessionsActions } from './sessions.actions';

/**
 * Admin sessions reducer handling session listing and revocation actions.
 */
export const sessionsReducer = createReducer(
  initialSessionsState,

  // ── Load User Sessions ──────────────────────────────────────────────────────
  on(SessionsActions.loadUserSessions, (state, { userId }): SessionsState => ({
    ...state,
    userId,
    loading: true,
    error: null
  })),

  on(SessionsActions.loadUserSessionsSuccess, (state, { sessions }): SessionsState => ({
    ...state,
    sessions,
    loading: false,
    error: null
  })),

  on(SessionsActions.loadUserSessionsFailure, (state, { error }): SessionsState => ({
    ...state,
    loading: false,
    error
  })),

  // ── Revoke Session ──────────────────────────────────────────────────────────
  on(SessionsActions.revokeSession, (state): SessionsState => ({
    ...state,
    loading: true,
    error: null
  })),

  on(SessionsActions.revokeSessionSuccess, (state, { sessionId }): SessionsState => ({
    ...state,
    sessions: state.sessions.filter(s => s.id !== sessionId),
    loading: false,
    error: null
  })),

  on(SessionsActions.revokeSessionFailure, (state, { error }): SessionsState => ({
    ...state,
    loading: false,
    error
  })),

  // ── Revoke All Sessions ─────────────────────────────────────────────────────
  on(SessionsActions.revokeAllSessions, (state): SessionsState => ({
    ...state,
    loading: true,
    error: null
  })),

  on(SessionsActions.revokeAllSessionsSuccess, (state): SessionsState => ({
    ...state,
    sessions: [],
    loading: false,
    error: null
  })),

  on(SessionsActions.revokeAllSessionsFailure, (state, { error }): SessionsState => ({
    ...state,
    loading: false,
    error
  })),

  // ── Clear ───────────────────────────────────────────────────────────────────
  on(SessionsActions.clearSessions, (): SessionsState => ({
    ...initialSessionsState
  })),

  on(SessionsActions.clearError, (state): SessionsState => ({
    ...state,
    error: null
  }))
);
