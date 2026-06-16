import { createReducer, on } from '@ngrx/store';
import { createEntityAdapter, EntityAdapter } from '@ngrx/entity';
import { IRoleListItem } from '../../models/role.model';
import { RolesState } from './roles.state';
import { RolesActions } from './roles.actions';

/**
 * Entity adapter for normalized admin role state management.
 * Uses 'id' as the primary key and sorts alphabetically by name.
 */
export const rolesAdapter: EntityAdapter<IRoleListItem> = createEntityAdapter<IRoleListItem>({
  selectId: (role: IRoleListItem) => role.id,
  sortComparer: (a: IRoleListItem, b: IRoleListItem) => a.name.localeCompare(b.name)
});

/**
 * Initial state for the admin roles store.
 */
export const initialRolesState: RolesState = rolesAdapter.getInitialState({
  selectedRole: null,
  permissionMatrix: null,
  loading: false,
  error: null
});

/**
 * Admin roles reducer handling all role management actions.
 * Uses @ngrx/entity adapter methods for normalized CRUD operations.
 */
export const rolesReducer = createReducer(
  initialRolesState,

  // ── Load Roles ──────────────────────────────────────────────────────────────
  on(RolesActions.loadRoles, (state): RolesState => ({
    ...state,
    loading: true,
    error: null
  })),

  on(RolesActions.loadRolesSuccess, (state, { roles }): RolesState =>
    rolesAdapter.setAll([...roles], {
      ...state,
      loading: false,
      error: null
    })
  ),

  on(RolesActions.loadRolesFailure, (state, { error }): RolesState => ({
    ...state,
    loading: false,
    error
  })),

  // ── Load Role Detail ────────────────────────────────────────────────────────
  on(RolesActions.loadRoleDetail, (state): RolesState => ({
    ...state,
    loading: true,
    error: null
  })),

  on(RolesActions.loadRoleDetailSuccess, (state, { role }): RolesState => ({
    ...state,
    selectedRole: role,
    loading: false,
    error: null
  })),

  on(RolesActions.loadRoleDetailFailure, (state, { error }): RolesState => ({
    ...state,
    selectedRole: null,
    loading: false,
    error
  })),

  // ── Create Role ─────────────────────────────────────────────────────────────
  on(RolesActions.createRole, (state): RolesState => ({
    ...state,
    loading: true,
    error: null
  })),

  on(RolesActions.createRoleSuccess, (state, { role }): RolesState =>
    rolesAdapter.addOne(role, {
      ...state,
      loading: false,
      error: null
    })
  ),

  on(RolesActions.createRoleFailure, (state, { error }): RolesState => ({
    ...state,
    loading: false,
    error
  })),

  // ── Update Role ─────────────────────────────────────────────────────────────
  on(RolesActions.updateRole, (state): RolesState => ({
    ...state,
    loading: true,
    error: null
  })),

  on(RolesActions.updateRoleSuccess, (state, { role }): RolesState =>
    rolesAdapter.upsertOne(role, {
      ...state,
      loading: false,
      error: null
    })
  ),

  on(RolesActions.updateRoleFailure, (state, { error }): RolesState => ({
    ...state,
    loading: false,
    error
  })),

  // ── Delete Role ─────────────────────────────────────────────────────────────
  on(RolesActions.deleteRole, (state): RolesState => ({
    ...state,
    loading: true,
    error: null
  })),

  on(RolesActions.deleteRoleSuccess, (state, { roleId }): RolesState =>
    rolesAdapter.removeOne(roleId, {
      ...state,
      loading: false,
      error: null
    })
  ),

  on(RolesActions.deleteRoleFailure, (state, { error }): RolesState => ({
    ...state,
    loading: false,
    error
  })),

  // ── Permission Matrix ───────────────────────────────────────────────────────
  on(RolesActions.loadPermissionMatrix, (state): RolesState => ({
    ...state,
    loading: true,
    error: null
  })),

  on(RolesActions.loadPermissionMatrixSuccess, (state, { matrix }): RolesState => ({
    ...state,
    permissionMatrix: matrix,
    loading: false,
    error: null
  })),

  on(RolesActions.loadPermissionMatrixFailure, (state, { error }): RolesState => ({
    ...state,
    loading: false,
    error
  })),

  // ── Toggle Permission ───────────────────────────────────────────────────────
  on(RolesActions.togglePermission, (state): RolesState => ({
    ...state,
    loading: true,
    error: null
  })),

  on(RolesActions.togglePermissionSuccess, (state, { request }): RolesState => {
    if (!state.permissionMatrix) {
      return { ...state, loading: false, error: null };
    }

    const updatedAssignments = state.permissionMatrix.assignments.map(cell =>
      cell.roleId === request.roleId && cell.permissionId === request.permissionId
        ? { ...cell, isGranted: request.isGranted }
        : cell
    );

    // If the assignment didn't exist before, add it
    const exists = state.permissionMatrix.assignments.some(
      cell => cell.roleId === request.roleId && cell.permissionId === request.permissionId
    );

    const finalAssignments = exists
      ? updatedAssignments
      : [...updatedAssignments, { roleId: request.roleId, permissionId: request.permissionId, isGranted: request.isGranted }];

    return {
      ...state,
      permissionMatrix: {
        ...state.permissionMatrix,
        assignments: finalAssignments
      },
      loading: false,
      error: null
    };
  }),

  on(RolesActions.togglePermissionFailure, (state, { error }): RolesState => ({
    ...state,
    loading: false,
    error
  })),

  // ── Clear ───────────────────────────────────────────────────────────────────
  on(RolesActions.clearSelectedRole, (state): RolesState => ({
    ...state,
    selectedRole: null
  })),

  on(RolesActions.clearError, (state): RolesState => ({
    ...state,
    error: null
  }))
);
