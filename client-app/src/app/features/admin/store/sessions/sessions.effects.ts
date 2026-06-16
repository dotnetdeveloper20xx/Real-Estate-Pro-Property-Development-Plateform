import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { map, exhaustMap, catchError, switchMap } from 'rxjs/operators';
import { SessionsActions } from './sessions.actions';
import { SessionsService } from '../../services/sessions.service';

/**
 * NgRx effects for the admin sessions store.
 * Handles all API calls for session listing and revocation.
 */
@Injectable()
export class SessionsEffects {
  private readonly actions$ = inject(Actions);
  private readonly sessionsService = inject(SessionsService);

  /**
   * Load user sessions effect: fetch all sessions for a specific user.
   */
  readonly loadUserSessions$ = createEffect(() =>
    this.actions$.pipe(
      ofType(SessionsActions.loadUserSessions),
      switchMap(({ userId }) =>
        this.sessionsService.getUserSessions(userId).pipe(
          map((sessions) => SessionsActions.loadUserSessionsSuccess({ sessions })),
          catchError((error: { error?: { message?: string }; message?: string }) => {
            const message = error.error?.message ?? error.message ?? 'Failed to load sessions.';
            return of(SessionsActions.loadUserSessionsFailure({ error: message }));
          })
        )
      )
    )
  );

  /**
   * Revoke session effect: revoke a single session by ID.
   */
  readonly revokeSession$ = createEffect(() =>
    this.actions$.pipe(
      ofType(SessionsActions.revokeSession),
      exhaustMap(({ sessionId }) =>
        this.sessionsService.revokeSession(sessionId).pipe(
          map(() => SessionsActions.revokeSessionSuccess({ sessionId })),
          catchError((error: { error?: { message?: string }; message?: string }) => {
            const message = error.error?.message ?? error.message ?? 'Failed to revoke session.';
            return of(SessionsActions.revokeSessionFailure({ error: message }));
          })
        )
      )
    )
  );

  /**
   * Revoke all sessions effect: revoke all sessions for a user.
   */
  readonly revokeAllSessions$ = createEffect(() =>
    this.actions$.pipe(
      ofType(SessionsActions.revokeAllSessions),
      exhaustMap(({ userId }) =>
        this.sessionsService.revokeAllUserSessions(userId).pipe(
          map(() => SessionsActions.revokeAllSessionsSuccess()),
          catchError((error: { error?: { message?: string }; message?: string }) => {
            const message = error.error?.message ?? error.message ?? 'Failed to revoke all sessions.';
            return of(SessionsActions.revokeAllSessionsFailure({ error: message }));
          })
        )
      )
    )
  );
}
