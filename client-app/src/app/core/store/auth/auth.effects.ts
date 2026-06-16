import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { map, exhaustMap, catchError, tap, switchMap } from 'rxjs/operators';
import { AuthActions } from './auth.actions';
import { AuthService } from '../../services/auth.service';
import { TokenRefreshService } from '../../services/token-refresh.service';
import { ToastService } from '../../services/toast.service';

/**
 * NgRx effects for authentication side effects.
 * Handles API calls for login, logout, refresh, and loading the current user.
 */
@Injectable()
export class AuthEffects {
  private readonly actions$ = inject(Actions);
  private readonly authService = inject(AuthService);
  private readonly tokenRefreshService = inject(TokenRefreshService);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);

  /**
   * Login effect: call AuthService.login, on success dispatch loginSuccess,
   * schedule token refresh, and navigate to home.
   */
  readonly login$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.login),
      exhaustMap(({ email, password }) =>
        this.authService.login(email, password).pipe(
          map((response) => AuthActions.loginSuccess({ response })),
          catchError((error: { error?: { message?: string }; message?: string }) => {
            const message = error.error?.message ?? error.message ?? 'Login failed. Please try again.';
            return of(AuthActions.loginFailure({ error: message }));
          })
        )
      )
    )
  );

  /**
   * After login success: schedule token refresh and navigate to home.
   */
  readonly loginSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.loginSuccess),
        tap(({ response }) => {
          this.tokenRefreshService.scheduleRefresh(response.accessToken);
          this.router.navigate(['/home']);
        })
      ),
    { dispatch: false }
  );

  /**
   * Logout effect: call AuthService.logout API, clear state, stop refresh timer,
   * and navigate to login.
   */
  readonly logout$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.logout),
      switchMap(() => {
        this.tokenRefreshService.stopRefresh();
        this.authService.clearSession();
        this.router.navigate(['/login']);
        return of(AuthActions.logoutComplete());
      })
    )
  );

  /**
   * Refresh token effect: call AuthService.refreshToken API,
   * update stored token and reschedule the next refresh.
   */
  readonly refreshToken$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.refreshToken),
      exhaustMap(() =>
        this.authService.refreshToken().pipe(
          map((response) => {
            this.tokenRefreshService.scheduleRefresh(response.accessToken);
            return AuthActions.refreshTokenSuccess({ accessToken: response.accessToken });
          }),
          catchError((error: { message?: string }) => {
            const message = error.message ?? 'Session expired. Please sign in again.';
            return of(AuthActions.refreshTokenFailure({ error: message }));
          })
        )
      )
    )
  );

  /**
   * On refresh token failure, navigate to login with session expired message.
   */
  readonly refreshTokenFailure$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.refreshTokenFailure),
        tap(({ error }) => {
          this.tokenRefreshService.stopRefresh();
          this.authService.clearSession();
          this.toastService.showWarning(error);
          this.router.navigate(['/login']);
        })
      ),
    { dispatch: false }
  );

  /**
   * Load current user effect: call GET /auth/me on app initialization
   * to restore the session if a valid token exists.
   */
  readonly loadCurrentUser$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.loadCurrentUser),
      exhaustMap(() => {
        const token = this.authService.getAccessToken();
        if (!token) {
          return of(AuthActions.loadCurrentUserFailure({ error: 'No token available' }));
        }

        return this.authService.getCurrentUserFromApi().pipe(
          map((user) => {
            this.tokenRefreshService.scheduleRefresh(token);
            return AuthActions.loadCurrentUserSuccess({ user });
          }),
          catchError((error: { message?: string }) => {
            const message = error.message ?? 'Failed to load user profile.';
            return of(AuthActions.loadCurrentUserFailure({ error: message }));
          })
        );
      })
    )
  );

  /**
   * Show login failure error as toast notification.
   */
  readonly loginFailure$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.loginFailure),
        tap(({ error }) => {
          this.toastService.showError(error);
        })
      ),
    { dispatch: false }
  );
}
