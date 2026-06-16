import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { map, exhaustMap, catchError, switchMap } from 'rxjs/operators';
import { RolesActions } from './roles.actions';
import { RolesService } from '../../services/roles.service';

/**
 * NgRx effects for the admin roles store.
 * Handles all API calls for role CRUD operations and permission matrix.
 */
@Injectable()
export class RolesEffects {
  private readonly actions$ = inject(Actions);
  private readonly rolesService = inject(RolesService);

  /**
   * Load roles effect: fetch all roles.
   */
  readonly loadRoles$ = createEffect(() =>
    this.actions$.pipe(
      ofType(RolesActions.loadRoles),
      switchMap(() =>
        this.rolesService.getRoles().pipe(
          map((roles) => RolesActions.loadRolesSuccess({ roles })),
          catchError((error: { error?: { message?: string }; message?: string }) => {
            const message = error.error?.message ?? error.message ?? 'Failed to load roles.';
            return of(RolesActions.loadRolesFailure({ error: message }));
          })
        )
      )
    )
  );

  /**
   * Load role detail effect: fetch a single role with permissions.
   */
  readonly loadRoleDetail$ = createEffect(() =>
    this.actions$.pipe(
      ofType(RolesActions.loadRoleDetail),
      switchMap(({ roleId }) =>
        this.rolesService.getRoleById(roleId).pipe(
          map((role) => RolesActions.loadRoleDetailSuccess({ role })),
          catchError((error: { error?: { message?: string }; message?: string }) => {
            const message = error.error?.message ?? error.message ?? 'Failed to load role details.';
            return of(RolesActions.loadRoleDetailFailure({ error: message }));
          })
        )
      )
    )
  );

  /**
   * Create role effect: call API, on success dispatch success action.
   */
  readonly createRole$ = createEffect(() =>
    this.actions$.pipe(
      ofType(RolesActions.createRole),
      exhaustMap(({ request }) =>
        this.rolesService.createRole(request).pipe(
          map((role) => RolesActions.createRoleSuccess({ role })),
          catchError((error: { error?: { message?: string }; message?: string }) => {
            const message = error.error?.message ?? error.message ?? 'Failed to create role.';
            return of(RolesActions.createRoleFailure({ error: message }));
          })
        )
      )
    )
  );

  /**
   * Update role effect: call API, on success dispatch success action.
   */
  readonly updateRole$ = createEffect(() =>
    this.actions$.pipe(
      ofType(RolesActions.updateRole),
      exhaustMap(({ roleId, request }) =>
        this.rolesService.updateRole(roleId, request).pipe(
          map((role) => RolesActions.updateRoleSuccess({ role })),
          catchError((error: { error?: { message?: string }; message?: string }) => {
            const message = error.error?.message ?? error.message ?? 'Failed to update role.';
            return of(RolesActions.updateRoleFailure({ error: message }));
          })
        )
      )
    )
  );

  /**
   * Delete role effect: call API, on success dispatch success action.
   */
  readonly deleteRole$ = createEffect(() =>
    this.actions$.pipe(
      ofType(RolesActions.deleteRole),
      exhaustMap(({ roleId }) =>
        this.rolesService.deleteRole(roleId).pipe(
          map(() => RolesActions.deleteRoleSuccess({ roleId })),
          catchError((error: { error?: { message?: string }; message?: string }) => {
            const message = error.error?.message ?? error.message ?? 'Failed to delete role.';
            return of(RolesActions.deleteRoleFailure({ error: message }));
          })
        )
      )
    )
  );

  /**
   * Load permission matrix effect: fetch the full permission grid.
   */
  readonly loadPermissionMatrix$ = createEffect(() =>
    this.actions$.pipe(
      ofType(RolesActions.loadPermissionMatrix),
      switchMap(() =>
        this.rolesService.getPermissionMatrix().pipe(
          map((matrix) => RolesActions.loadPermissionMatrixSuccess({ matrix })),
          catchError((error: { error?: { message?: string }; message?: string }) => {
            const message = error.error?.message ?? error.message ?? 'Failed to load permission matrix.';
            return of(RolesActions.loadPermissionMatrixFailure({ error: message }));
          })
        )
      )
    )
  );

  /**
   * Toggle permission effect: call API, on success update the matrix state.
   */
  readonly togglePermission$ = createEffect(() =>
    this.actions$.pipe(
      ofType(RolesActions.togglePermission),
      exhaustMap(({ request }) =>
        this.rolesService.togglePermission(request).pipe(
          map(() => RolesActions.togglePermissionSuccess({ request })),
          catchError((error: { error?: { message?: string }; message?: string }) => {
            const message = error.error?.message ?? error.message ?? 'Failed to toggle permission.';
            return of(RolesActions.togglePermissionFailure({ error: message }));
          })
        )
      )
    )
  );
}
