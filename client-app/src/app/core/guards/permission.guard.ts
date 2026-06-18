import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { map, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';
import { selectUserPermissions, selectUserRoles } from '../store/auth';
import { combineLatest } from 'rxjs';

/**
 * Configurable permission guard that reads required permissions from route data.
 *
 * Behavior:
 * - In dev mode: allows all access (DevAuthMiddleware provides SuperAdmin)
 * - Reads required permissions from route data: { permissions: ['opportunities.create'] }
 * - SuperAdmin role bypasses all permission checks
 * - Checks current user permissions from NgRx store (union logic: ANY permission matches)
 * - Shows "Access denied" toast and redirects to /home if permission check fails
 *
 * Usage:
 * ```typescript
 * {
 *   path: 'opportunities/create',
 *   canActivate: [authGuard, permissionGuard],
 *   data: { permissions: ['opportunities.create'] }
 * }
 * ```
 */
export const permissionGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const store = inject(Store);
  const toastService = inject(ToastService);

  // In dev mode (no explicit login), allow all access
  if (authService.isDevMode) {
    return true;
  }

  // Read required permissions from route data
  const requiredPermissions = route.data?.['permissions'] as string[] | undefined;

  // If no permissions specified, allow access (guard only restricts when permissions defined)
  if (!requiredPermissions || requiredPermissions.length === 0) {
    return true;
  }

  return combineLatest([
    store.select(selectUserPermissions),
    store.select(selectUserRoles)
  ]).pipe(
    take(1),
    map(([userPermissions, userRoles]) => {
      // SuperAdmin bypasses all permission checks
      if (userRoles.includes('SuperAdmin')) {
        return true;
      }

      const hasRequiredPermission = requiredPermissions.some(
        permission => userPermissions.includes(permission)
      );

      if (hasRequiredPermission) {
        return true;
      }

      toastService.showError('Access denied. You do not have the required permissions.');
      router.navigate(['/home']);
      return false;
    })
  );
};
