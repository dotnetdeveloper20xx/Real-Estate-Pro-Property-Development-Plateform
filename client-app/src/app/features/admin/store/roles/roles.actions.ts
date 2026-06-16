import { createActionGroup, emptyProps, props } from '@ngrx/store';
import {
  IRoleListItem,
  IRoleDetail,
  ICreateRoleRequest,
  IUpdateRoleRequest,
  IPermissionMatrix,
  ITogglePermissionRequest
} from '../../models/role.model';

/**
 * NgRx action group for admin role management.
 * Follows the [Source] Event pattern for action naming.
 */
export const RolesActions = createActionGroup({
  source: 'Admin Roles',
  events: {
    // ── Load Roles ──────────────────────────────────────────────────────────
    /** Load all roles */
    'Load Roles': emptyProps(),
    /** Roles loaded successfully */
    'Load Roles Success': props<{ roles: readonly IRoleListItem[] }>(),
    /** Roles load failed */
    'Load Roles Failure': props<{ error: string }>(),

    // ── Load Role Detail ────────────────────────────────────────────────────
    /** Load a single role's full detail by ID */
    'Load Role Detail': props<{ roleId: string }>(),
    /** Role detail loaded successfully */
    'Load Role Detail Success': props<{ role: IRoleDetail }>(),
    /** Role detail load failed */
    'Load Role Detail Failure': props<{ error: string }>(),

    // ── Create Role ─────────────────────────────────────────────────────────
    /** Create a new role with permissions */
    'Create Role': props<{ request: ICreateRoleRequest }>(),
    /** Role created successfully */
    'Create Role Success': props<{ role: IRoleListItem }>(),
    /** Role creation failed */
    'Create Role Failure': props<{ error: string }>(),

    // ── Update Role ─────────────────────────────────────────────────────────
    /** Update an existing role */
    'Update Role': props<{ roleId: string; request: IUpdateRoleRequest }>(),
    /** Role updated successfully */
    'Update Role Success': props<{ role: IRoleListItem }>(),
    /** Role update failed */
    'Update Role Failure': props<{ error: string }>(),

    // ── Delete Role ─────────────────────────────────────────────────────────
    /** Delete a non-built-in role */
    'Delete Role': props<{ roleId: string }>(),
    /** Role deleted successfully */
    'Delete Role Success': props<{ roleId: string }>(),
    /** Role deletion failed */
    'Delete Role Failure': props<{ error: string }>(),

    // ── Permission Matrix ───────────────────────────────────────────────────
    /** Load the full permission matrix */
    'Load Permission Matrix': emptyProps(),
    /** Permission matrix loaded successfully */
    'Load Permission Matrix Success': props<{ matrix: IPermissionMatrix }>(),
    /** Permission matrix load failed */
    'Load Permission Matrix Failure': props<{ error: string }>(),

    // ── Toggle Permission ───────────────────────────────────────────────────
    /** Toggle a permission assignment on/off for a role */
    'Toggle Permission': props<{ request: ITogglePermissionRequest }>(),
    /** Permission toggled successfully */
    'Toggle Permission Success': props<{ request: ITogglePermissionRequest }>(),
    /** Permission toggle failed */
    'Toggle Permission Failure': props<{ error: string }>(),

    // ── Clear ───────────────────────────────────────────────────────────────
    /** Clear the selected role detail */
    'Clear Selected Role': emptyProps(),
    /** Clear any error state */
    'Clear Error': emptyProps(),
  }
});
