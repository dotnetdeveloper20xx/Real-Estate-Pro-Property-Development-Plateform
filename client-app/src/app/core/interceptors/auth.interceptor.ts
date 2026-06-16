import { HttpInterceptorFn, HttpErrorResponse, HttpRequest, HttpHandlerFn, HttpEvent } from '@angular/common/http';
import { inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, filter, switchMap, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { AuthActions } from '../store/auth';

/** Tracks whether a token refresh is currently in progress */
let isRefreshing = false;

/** Subject that emits the new token once refresh completes (null while refreshing) */
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

/**
 * HTTP interceptor that attaches the Bearer token to outgoing API requests.
 *
 * Behavior:
 * - Skips token attachment for /auth/login, /auth/refresh, and /auth/register endpoints
 * - Only attaches token if one exists in localStorage (allows DevAuth to work)
 * - On 401 response: attempts a token refresh; if that fails, dispatches logout
 * - Queues concurrent requests during token refresh and replays them with the new token
 *
 * IMPORTANT: This interceptor must be registered BEFORE the responseWrapperInterceptor
 * so that auth headers are set before responses are processed.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const store = inject(Store);

  // Skip auth header for authentication endpoints
  if (isAuthEndpoint(req.url)) {
    return next(req);
  }

  // Attach token if available
  const token = authService.getAccessToken();
  const authReq = token
    ? addTokenToRequest(req, token)
    : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && token && !isAuthEndpoint(req.url)) {
        return handle401Error(req, next, authService, store);
      }
      return throwError(() => error);
    })
  );
};

/**
 * Handle 401 errors by attempting token refresh.
 * If a refresh is already in progress, queue the request and replay once done.
 */
function handle401Error(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
  authService: AuthService,
  store: Store
): Observable<HttpEvent<unknown>> {
  if (!isRefreshing) {
    isRefreshing = true;
    refreshTokenSubject.next(null);

    return authService.refreshToken().pipe(
      switchMap((response) => {
        isRefreshing = false;
        refreshTokenSubject.next(response.accessToken);
        return next(addTokenToRequest(req, response.accessToken));
      }),
      catchError((refreshError) => {
        isRefreshing = false;
        refreshTokenSubject.next(null);
        // Refresh failed — dispatch logout to clear state
        store.dispatch(AuthActions.logout());
        return throwError(() => refreshError);
      })
    );
  }

  // A refresh is already in progress — queue and wait for new token
  return refreshTokenSubject.pipe(
    filter((token): token is string => token !== null),
    take(1),
    switchMap((token) => next(addTokenToRequest(req, token)))
  );
}

/**
 * Clone the request with the Authorization Bearer header attached.
 */
function addTokenToRequest(req: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
  return req.clone({
    setHeaders: { Authorization: `Bearer ${token}` }
  });
}

/**
 * Check if the URL is an authentication endpoint that should skip token attachment.
 */
function isAuthEndpoint(url: string): boolean {
  return url.includes('/auth/login') ||
    url.includes('/auth/refresh') ||
    url.includes('/auth/register');
}
