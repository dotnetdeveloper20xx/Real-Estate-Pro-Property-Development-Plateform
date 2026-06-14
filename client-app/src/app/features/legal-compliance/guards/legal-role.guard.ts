import { CanActivateFn } from '@angular/router';

/**
 * LegalRoleGuard — A functional route guard that verifies the current user
 * holds an appropriate legal role before allowing route activation.
 *
 * Valid legal-compliance roles:
 * - Legal_Compliance_Officer
 * - Finance_Director
 * - Acquisition_Manager
 * - Admin_Support
 *
 * Currently returns true as a placeholder — actual role verification
 * will be wired to the authentication/authorization service when the
 * shared auth infrastructure is integrated.
 *
 * Requirements: 10.8, 10.9
 */
export const legalRoleGuard: CanActivateFn = () => {
  // TODO: Inject AuthService or NgRx Store to retrieve current user roles
  // and verify against: Legal_Compliance_Officer, Finance_Director,
  // Acquisition_Manager, Admin_Support

  // Placeholder: Allow access until auth service is wired
  return true;
};
