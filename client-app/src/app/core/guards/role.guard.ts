import { CanActivateFn } from '@angular/router';

/**
 * Configurable role guard that reads allowed roles from route data.
 *
 * Consolidated from module-specific role guards:
 * - features/land-acquisition/guards/role.guard.ts
 * - features/planning-approvals/guards/planning-role.guard.ts
 * - features/legal-compliance/guards/legal-role.guard.ts
 *
 * Usage in route config:
 * ```typescript
 * {
 *   path: 'opportunities',
 *   component: OpportunityListComponent,
 *   canActivate: [roleGuard],
 *   data: { roles: ['AcquisitionManager', 'SuperAdmin'] }
 * }
 * ```
 *
 * When the auth service is wired in, this guard will check the current user's
 * roles against the allowed roles defined in route data.
 */
export const roleGuard: CanActivateFn = (route) => {
  // Read allowed roles from route data
  const allowedRoles = route.data?.['roles'] as string[] | undefined;

  // TODO: when auth service is wired, check user roles against allowedRoles
  // For now, log intent and allow all access
  if (allowedRoles && allowedRoles.length > 0) {
    // Future: inject AuthService and check user roles
    // const authService = inject(AuthService);
    // const userRoles = authService.getCurrentUserRoles();
    // return allowedRoles.some(role => userRoles.includes(role));
  }

  // Placeholder — allows all for now
  return true;
};
