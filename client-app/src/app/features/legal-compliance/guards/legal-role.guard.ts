import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

/**
 * Valid legal-compliance roles that grant access to the Legal & Compliance module.
 * Maps to backend role names used in [Authorize(Roles = "...")] attributes.
 *
 * Requirements: 10.8, 10.9
 */
const LEGAL_ROLES: readonly string[] = [
  'Legal_Compliance_Officer',
  'Finance_Director',
  'Acquisition_Manager',
  'Admin_Support'
] as const;

/**
 * LegalRoleGuard — A functional route guard that verifies the current user
 * holds an appropriate legal role before allowing route activation.
 *
 * If the user does not have a valid legal role, they are redirected
 * to the home page (or an unauthorized page when available).
 *
 * Currently returns true as a placeholder — actual role verification
 * will be wired to the authentication/authorization service when the
 * shared auth infrastructure is integrated.
 *
 * Requirements: 10.8, 10.9
 *
 * Usage in routes:
 * ```ts
 * {
 *   path: 'dashboard',
 *   loadComponent: () => import(...),
 *   canActivate: [legalRoleGuard]
 * }
 * ```
 */
export const legalRoleGuard: CanActivateFn = () => {
  const router = inject(Router);

  // TODO: Inject AuthService or NgRx Store to retrieve current user roles
  // Example implementation when auth is integrated:
  //
  // const authService = inject(AuthService);
  // const userRoles = authService.getCurrentUserRoles();
  // const hasAccess = userRoles.some(role => LEGAL_ROLES.includes(role));
  //
  // if (!hasAccess) {
  //   return router.createUrlTree(['/']);
  // }
  //
  // return true;

  // Placeholder: Allow access until auth service is wired
  return true;
};
