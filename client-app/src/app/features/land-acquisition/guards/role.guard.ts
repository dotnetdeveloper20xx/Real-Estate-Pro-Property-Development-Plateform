import { CanActivateFn } from '@angular/router';

/**
 * Role-based route guard for land acquisition feature.
 * Checks if the current user has the required role to access protected routes.
 *
 * Currently returns true as a placeholder — actual role verification
 * will be wired to the authentication/authorization service in a later task.
 *
 * Apply this guard to write routes (create, edit) to enforce role-based access.
 */
export const roleGuard: CanActivateFn = () => {
  // TODO: Inject AuthService or NgRx Store to verify user role
  // Required roles for write operations: AcquisitionManager, AdminSupport
  return true;
};
