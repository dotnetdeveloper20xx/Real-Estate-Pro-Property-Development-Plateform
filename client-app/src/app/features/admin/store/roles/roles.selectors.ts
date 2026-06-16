import { createFeatureSelector, createSelector } from '@ngrx/store';
import { RolesState } from './roles.state';
import { rolesAdapter } from './roles.reducer';

/**
 * Feature selector for the admin roles state slice.
 */
export const selectRolesState = createFeatureSelector<RolesState>('adminRoles');

/**
 * Entity adapter selectors for normalized state access.
 */
const { selectAll, selectEntities, selectTotal } = rolesAdapter.getSelectors();

/**
 * Select all roles as an array, sorted alphabetically.
 */
export const selectAllRoles = createSelector(
  selectRolesState,
  selectAll
);

/**
 * Select the roles entities dictionary (id → entity).
 */
export const selectRoleEntities = createSelector(
  selectRolesState,
  selectEntities
);

/**
 * Select total number of roles.
 */
export const selectRolesTotal = createSelector(
  selectRolesState,
  selectTotal
);

/**
 * Select the currently selected role detail.
 */
export const selectSelectedRole = createSelector(
  selectRolesState,
  (state: RolesState) => state.selectedRole
);

/**
 * Select the full permission matrix.
 */
export const selectPermissionMatrix = createSelector(
  selectRolesState,
  (state: RolesState) => state.permissionMatrix
);

/**
 * Select the loading state indicator.
 */
export const selectRolesLoading = createSelector(
  selectRolesState,
  (state: RolesState) => state.loading
);

/**
 * Select the current error message.
 */
export const selectRolesError = createSelector(
  selectRolesState,
  (state: RolesState) => state.error
);

/**
 * Select a role by its ID from the entity dictionary.
 */
export const selectRoleById = (id: string) =>
  createSelector(
    selectRoleEntities,
    (entities) => entities[id] ?? null
  );

/**
 * Select only built-in roles.
 */
export const selectBuiltInRoles = createSelector(
  selectAllRoles,
  (roles) => roles.filter(r => r.isBuiltIn)
);

/**
 * Select only custom (non-built-in) roles.
 */
export const selectCustomRoles = createSelector(
  selectAllRoles,
  (roles) => roles.filter(r => !r.isBuiltIn)
);
