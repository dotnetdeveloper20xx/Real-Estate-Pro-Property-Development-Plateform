import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

/**
 * Route guard that protects authenticated-only routes.
 *
 * Behavior:
 * - In dev mode (no explicit login): allows all access (DevAuthMiddleware handles it)
 * - In authenticated mode: checks for valid token
 * - Supports role-based restrictions via route data: { roles: ['SuperAdmin'] }
 * - Shows "Access denied" toast and redirects to home if role check fails
 *
 * Usage:
 * ```typescript
 * {
 *   path: 'admin/users',
 *   canActivate: [authGuard],
 *   data: { roles: ['SuperAdmin'] }
 * }
 * ```
 */
export const authGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const toast = inject(ToastService);

  // In dev mode, allow all access (DevAuthMiddleware handles auth on backend)
  if (authService.isDevMode) {
    return true;
  }

  // Check authentication
  if (!authService.isAuthenticated()) {
    router.navigate(['/login']);
    return false;
  }

  // Check role-based access if specified in route data
  const requiredRoles = route.data?.['roles'] as string[] | undefined;
  if (requiredRoles && requiredRoles.length > 0) {
    if (!authService.hasAnyRole(requiredRoles)) {
      toast.showError('Access denied. You do not have the required permissions.');
      router.navigate(['/home']);
      return false;
    }
  }

  return true;
};
