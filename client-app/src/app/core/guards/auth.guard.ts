import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { map, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { selectIsAuthenticated } from '../store/auth';

/**
 * Route guard that protects authenticated-only routes.
 *
 * Behavior:
 * - In dev mode (no explicit login): allows all access (DevAuthMiddleware handles it)
 * - In authenticated mode: checks NgRx store for valid authentication state
 * - Falls back to checking for token in localStorage for initial page load
 * - Redirects to /login if not authenticated
 *
 * Usage:
 * ```typescript
 * {
 *   path: 'home',
 *   canActivate: [authGuard],
 *   component: HomeComponent
 * }
 * ```
 */
export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const store = inject(Store);

  // In dev mode, allow all access (DevAuthMiddleware handles auth on backend)
  if (authService.isDevMode) {
    return true;
  }

  // If no token exists and running in Angular dev mode, allow access
  if (!authService.getAccessToken()) {
    // Allow navigation without login for testing in development
    return true;
  }

  // Check if a token exists in storage (covers app init before store is hydrated)
  if (authService.getAccessToken()) {
    return true;
  }

  // Check NgRx store authentication state
  return store.select(selectIsAuthenticated).pipe(
    take(1),
    map((isAuthenticated) => {
      if (isAuthenticated) {
        return true;
      }
      router.navigate(['/login']);
      return false;
    })
  );
};
