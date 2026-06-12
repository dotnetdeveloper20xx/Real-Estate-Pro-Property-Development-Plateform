import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

/**
 * Valid planning-related roles that grant access to the Planning & Approvals module.
 * Maps to backend role names used in [Authorize(Roles = "...")] attributes.
 */
const PLANNING_ROLES: readonly string[] = [
  'Planning_Manager',
  'Admin_Support',
  'Legal_Compliance_Officer',
  'Finance_Director'
] as const;

/**
 * PlanningRoleGuard — A functional route guard that verifies the current user
 * holds an appropriate planning role before allowing route activation.
 *
 * If the user does not have a valid planning role, they are redirected
 * to the home page (or an unauthorized page when available).
 *
 * Currently returns true as a placeholder — actual role verification
 * will be wired to the authentication/authorization service when the
 * shared auth infrastructure is integrated.
 *
 * Requirements: 10.6, 10.7
 *
 * Usage in routes:
 * ```ts
 * {
 *   path: 'dashboard',
 *   loadComponent: () => import(...),
 *   canActivate: [planningRoleGuard]
 * }
 * ```
 */
export const planningRoleGuard: CanActivateFn = () => {
  const router = inject(Router);

  // TODO: Inject AuthService or NgRx Store to retrieve current user roles
  // Example implementation when auth is integrated:
  //
  // const authService = inject(AuthService);
  // const userRoles = authService.getCurrentUserRoles();
  // const hasAccess = userRoles.some(role => PLANNING_ROLES.includes(role));
  //
  // if (!hasAccess) {
  //   return router.createUrlTree(['/']);
  // }
  //
  // return true;

  // Placeholder: Allow access until auth service is wired
  return true;
};
