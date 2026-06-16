import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { ISessionItem } from '../../models/user.model';

/**
 * NgRx action group for admin session management.
 */
export const SessionsActions = createActionGroup({
  source: 'Admin Sessions',
  events: {
    // ── Load Sessions ───────────────────────────────────────────────────────
    /** Load all sessions for a specific user */
    'Load User Sessions': props<{ userId: string }>(),
    /** Sessions loaded successfully */
    'Load User Sessions Success': props<{ sessions: readonly ISessionItem[] }>(),
    /** Sessions load failed */
    'Load User Sessions Failure': props<{ error: string }>(),

    // ── Revoke Session ──────────────────────────────────────────────────────
    /** Revoke a single session */
    'Revoke Session': props<{ sessionId: string }>(),
    /** Session revoked successfully */
    'Revoke Session Success': props<{ sessionId: string }>(),
    /** Session revocation failed */
    'Revoke Session Failure': props<{ error: string }>(),

    // ── Revoke All Sessions ─────────────────────────────────────────────────
    /** Revoke all sessions for the current user */
    'Revoke All Sessions': props<{ userId: string }>(),
    /** All sessions revoked successfully */
    'Revoke All Sessions Success': emptyProps(),
    /** Revoke all sessions failed */
    'Revoke All Sessions Failure': props<{ error: string }>(),

    // ── Clear ───────────────────────────────────────────────────────────────
    /** Clear sessions state */
    'Clear Sessions': emptyProps(),
    /** Clear any error state */
    'Clear Error': emptyProps(),
  }
});
