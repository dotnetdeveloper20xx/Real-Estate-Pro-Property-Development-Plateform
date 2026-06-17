import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { map, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';
import { selectUserRoles } from '../store/auth';

/**
 * Configurable role guard that reads allowed roles from route data.
 *
 * Behavior:
 * - In dev mode: allows all access (DevAuthMiddleware provides SuperAdmin)
 * - Reads required roles from route data: { roles: ['SuperAdmin', 'AcquisitionManager'] }
 * - Checks current user roles from NgRx store (union logic: ANY role matches)
 * - Shows "Access denied" toast and redirects to /home if role check fails
 *
 * Usage:
 * ```typescript
 * {
 *   path: 'opportunities',
 *   canActivate: [authGuard, roleGuard],
 *   data: { roles: ['AcquisitionManager', 'SuperAdmin'] }
 * }
 * ```
 */
export const roleGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const store = inject(Store);
  const toastService = inject(ToastService);

  // In dev mode (no explicit login), allow all access
  if (authService.isDevMode) {
    return true;
  }

  // Read allowed roles from route data
  const allowedRoles = route.data?.['roles'] as string[] | undefined;

  // If no roles specified, allow access (guard only restricts when roles defined)
  if (!allowedRoles || allowedRoles.length === 0) {
    return true;
  }

  return store.select(selectUserRoles).pipe(
    take(1),
    map((userRoles) => {
      const hasRequiredRole = allowedRoles.some(role => userRoles.includes(role));

      if (hasRequiredRole) {
        return true;
      }

      toastService.showError('Access denied. You do not have the required permissions.');
      router.navigate(['/home']);
      return false;
    })
  );
};

/**
 * Admin guard that specifically checks for SuperAdmin role.
 * Use this on all /admin routes for stronger access control.
 *
 * Behavior:
 * - In dev mode: allows all access
 * - Checks if user has SuperAdmin role
 * - Shows "Access denied" toast and redirects to /home if not SuperAdmin
 *
 * Usage:
 * ```typescript
 * {
 *   path: 'admin',
 *   canActivate: [authGuard, adminGuard],
 *   children: [...]
 * }
 * ```
 */
export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const store = inject(Store);
  const toastService = inject(ToastService);

  // In dev mode (no explicit login), allow all access
  if (authService.isDevMode) {
    return true;
  }

  return store.select(selectUserRoles).pipe(
    take(1),
    map((userRoles) => {
      if (userRoles.includes('SuperAdmin')) {
        return true;
      }

      toastService.showError('Access denied. Administrator privileges required.');
      router.navigate(['/home']);
      return false;
    })
  );
};
