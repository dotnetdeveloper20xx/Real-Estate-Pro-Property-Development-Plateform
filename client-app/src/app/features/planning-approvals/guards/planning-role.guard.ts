import { CanActivateFn } from '@angular/router';

/**
 * PlanningRoleGuard — A functional route guard that verifies the current user
 * holds an appropriate planning role before allowing route activation.
 *
 * Valid planning roles:
 * - Planning_Manager
 * - Admin_Support
 * - Legal_Compliance_Officer
 * - Finance_Director
 *
 * Currently returns true as a placeholder — actual role verification
 * will be wired to the authentication/authorization service when the
 * shared auth infrastructure is integrated.
 *
 * Requirements: 10.6, 10.7
 */
export const planningRoleGuard: CanActivateFn = () => {
  // TODO: Inject AuthService or NgRx Store to retrieve current user roles
  // and verify against: Planning_Manager, Admin_Support,
  // Legal_Compliance_Officer, Finance_Director

  // Placeholder: Allow access until auth service is wired
  return true;
};
