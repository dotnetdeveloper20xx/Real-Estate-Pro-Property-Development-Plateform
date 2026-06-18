import { createReducer, on } from '@ngrx/store';
import { AuthState, initialAuthState } from './auth.state';
import { AuthActions } from './auth.actions';

/**
 * Authentication reducer handling all auth-related actions.
 * Manages user session state, token, roles, and loading/error states.
 */
export const authReducer = createReducer(
  initialAuthState,

  // ── Login ───────────────────────────────────────────────────────────────────
  on(AuthActions.login, (state): AuthState => ({
    ...state,
    isLoading: true,
    error: null
  })),

  on(AuthActions.loginSuccess, (state, { response }): AuthState => ({
    ...state,
    currentUser: response.user,
    accessToken: response.accessToken,
    isAuthenticated: true,
    isLoading: false,
    error: null,
    roles: response.user.roles,
    permissions: response.user.permissions ?? []
  })),

  on(AuthActions.loginFailure, (state, { error }): AuthState => ({
    ...state,
    currentUser: null,
    accessToken: null,
    isAuthenticated: false,
    isLoading: false,
    error,
    roles: [],
    permissions: []
  })),

  // ── Logout ──────────────────────────────────────────────────────────────────
  on(AuthActions.logout, (state): AuthState => ({
    ...state,
    isLoading: true
  })),

  on(AuthActions.logoutComplete, (): AuthState => ({
    ...initialAuthState
  })),

  // ── Refresh Token ───────────────────────────────────────────────────────────
  on(AuthActions.refreshToken, (state): AuthState => ({
    ...state,
    error: null
  })),

  on(AuthActions.refreshTokenSuccess, (state, { accessToken }): AuthState => ({
    ...state,
    accessToken,
    error: null
  })),

  on(AuthActions.refreshTokenFailure, (_state, { error }): AuthState => ({
    ...initialAuthState,
    error
  })),

  // ── Load Current User ───────────────────────────────────────────────────────
  on(AuthActions.loadCurrentUser, (state): AuthState => ({
    ...state,
    isLoading: true,
    error: null
  })),

  on(AuthActions.loadCurrentUserSuccess, (state, { user }): AuthState => ({
    ...state,
    currentUser: user,
    isAuthenticated: true,
    isLoading: false,
    error: null,
    roles: user.roles,
    permissions: user.permissions ?? []
  })),

  on(AuthActions.loadCurrentUserFailure, (state, { error }): AuthState => ({
    ...state,
    currentUser: null,
    accessToken: null,
    isAuthenticated: false,
    isLoading: false,
    error,
    roles: [],
    permissions: []
  })),

  // ── Clear Error ─────────────────────────────────────────────────────────────
  on(AuthActions.clearError, (state): AuthState => ({
    ...state,
    error: null
  }))
);
