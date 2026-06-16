import { ICurrentUser } from '../../services/auth.service';

/**
 * NgRx state interface for the authentication feature slice.
 * Manages the current user session, token, roles, permissions, and loading/error states.
 */
export interface AuthState {
  /** The currently authenticated user profile (null if not authenticated) */
  readonly currentUser: ICurrentUser | null;
  /** The current JWT access token (null if not authenticated) */
  readonly accessToken: string | null;
  /** Whether the user is currently authenticated */
  readonly isAuthenticated: boolean;
  /** Whether an auth operation (login, refresh, load user) is in progress */
  readonly isLoading: boolean;
  /** The latest auth error message (null if no error) */
  readonly error: string | null;
  /** The current user's assigned roles */
  readonly roles: readonly string[];
  /** The current user's permissions (derived from roles) */
  readonly permissions: readonly string[];
}

/**
 * Initial auth state — unauthenticated with no user data.
 */
export const initialAuthState: AuthState = {
  currentUser: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  roles: [],
  permissions: []
};
