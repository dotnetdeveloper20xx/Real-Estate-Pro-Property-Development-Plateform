import { createFeatureSelector, createSelector } from '@ngrx/store';
import { AuthState } from './auth.state';

/**
 * Feature selector for the auth state slice.
 */
export const selectAuthState = createFeatureSelector<AuthState>('auth');

/**
 * Select the current authenticated user (null if not authenticated).
 */
export const selectCurrentUser = createSelector(
  selectAuthState,
  (state: AuthState) => state.currentUser
);

/**
 * Select whether the user is authenticated.
 */
export const selectIsAuthenticated = createSelector(
  selectAuthState,
  (state: AuthState) => state.isAuthenticated
);

/**
 * Select the current user's roles.
 */
export const selectUserRoles = createSelector(
  selectAuthState,
  (state: AuthState) => state.roles
);

/**
 * Select the current user's permissions.
 */
export const selectUserPermissions = createSelector(
  selectAuthState,
  (state: AuthState) => state.permissions
);

/**
 * Select whether an auth operation is in progress.
 */
export const selectIsLoading = createSelector(
  selectAuthState,
  (state: AuthState) => state.isLoading
);

/**
 * Select the current auth error message (null if no error).
 */
export const selectAuthError = createSelector(
  selectAuthState,
  (state: AuthState) => state.error
);

/**
 * Select the current access token.
 */
export const selectAccessToken = createSelector(
  selectAuthState,
  (state: AuthState) => state.accessToken
);

/**
 * Select whether the user has a specific role.
 */
export const selectHasRole = (role: string) =>
  createSelector(
    selectUserRoles,
    (roles): boolean => roles.includes(role)
  );

/**
 * Select whether the user has any of the specified roles.
 */
export const selectHasAnyRole = (requiredRoles: readonly string[]) =>
  createSelector(
    selectUserRoles,
    (roles): boolean => requiredRoles.some(role => roles.includes(role))
  );

/**
 * Select whether the user is a SuperAdmin.
 */
export const selectIsSuperAdmin = createSelector(
  selectUserRoles,
  (roles): boolean => roles.includes('SuperAdmin')
);

/**
 * Select whether the user has a specific permission.
 */
export const selectHasPermission = (permission: string) =>
  createSelector(
    selectUserPermissions,
    selectUserRoles,
    (permissions, roles): boolean =>
      roles.includes('SuperAdmin') || permissions.includes(permission)
  );

/**
 * Select whether the user has any of the specified permissions.
 */
export const selectHasAnyPermission = (requiredPermissions: readonly string[]) =>
  createSelector(
    selectUserPermissions,
    selectUserRoles,
    (permissions, roles): boolean =>
      roles.includes('SuperAdmin') || requiredPermissions.some(p => permissions.includes(p))
  );
