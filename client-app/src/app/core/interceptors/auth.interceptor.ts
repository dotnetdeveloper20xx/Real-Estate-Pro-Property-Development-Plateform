import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

/**
 * HTTP interceptor that attaches the Bearer token to outgoing API requests.
 *
 * Behavior:
 * - Skips token attachment for /auth/login and /auth/refresh endpoints
 * - Only attaches token if one exists in localStorage (allows DevAuth to work)
 * - On 401 response: attempts a token refresh; if that fails, clears session and redirects to /login
 *
 * IMPORTANT: This interceptor must be registered BEFORE the responseWrapperInterceptor
 * so that auth headers are set before responses are processed.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  // Skip auth header for login and refresh endpoints
  const isAuthEndpoint = req.url.includes('/auth/login') || req.url.includes('/auth/refresh');
  if (isAuthEndpoint) {
    return next(req);
  }

  // Only attach token if one exists — allows DevAuthMiddleware to work when no token is present
  const token = authService.getAccessToken();
  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && token && !req.url.includes('/auth/')) {
        // Attempt token refresh
        return authService.refreshToken().pipe(
          switchMap((refreshResponse) => {
            // Retry original request with new token
            const retryReq = req.clone({
              setHeaders: { Authorization: `Bearer ${refreshResponse.accessToken}` }
            });
            return next(retryReq);
          }),
          catchError(() => {
            // Refresh failed — clear session and redirect to login
            authService.logout();
            return throwError(() => error);
          })
        );
      }
      return throwError(() => error);
    })
  );
};
