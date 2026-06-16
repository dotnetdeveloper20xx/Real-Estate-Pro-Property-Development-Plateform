import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { ICurrentUser, ILoginResponse } from '../../services/auth.service';

/**
 * NgRx action group for authentication state management.
 * Follows the [Source] Event pattern for action naming.
 */
export const AuthActions = createActionGroup({
  source: 'Auth',
  events: {
    /** Trigger login with email and password credentials */
    'Login': props<{ email: string; password: string; rememberMe: boolean }>(),
    /** Login succeeded — store user and token */
    'Login Success': props<{ response: ILoginResponse }>(),
    /** Login failed — store error message */
    'Login Failure': props<{ error: string }>(),

    /** Trigger logout — clear session and navigate to login */
    'Logout': emptyProps(),
    /** Logout completed (API notified, state cleared) */
    'Logout Complete': emptyProps(),

    /** Trigger silent token refresh */
    'Refresh Token': emptyProps(),
    /** Token refresh succeeded — update access token */
    'Refresh Token Success': props<{ accessToken: string }>(),
    /** Token refresh failed — session expired */
    'Refresh Token Failure': props<{ error: string }>(),

    /** Load current user profile from /auth/me on app initialization */
    'Load Current User': emptyProps(),
    /** Current user loaded successfully */
    'Load Current User Success': props<{ user: ICurrentUser }>(),
    /** Failed to load current user (token expired or invalid) */
    'Load Current User Failure': props<{ error: string }>(),

    /** Clear any auth error from state */
    'Clear Error': emptyProps(),
  }
});
