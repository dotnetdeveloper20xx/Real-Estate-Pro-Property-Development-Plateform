import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { of } from 'rxjs';
import { map, exhaustMap, catchError, withLatestFrom, switchMap } from 'rxjs/operators';
import { UsersActions } from './users.actions';
import { selectUsersQueryParams } from './users.selectors';
import { UsersService } from '../../services/users.service';

/**
 * NgRx effects for the admin users store.
 * Handles all API calls for user CRUD operations with error handling.
 */
@Injectable()
export class UsersEffects {
  private readonly actions$ = inject(Actions);
  private readonly store = inject(Store);
  private readonly usersService = inject(UsersService);

  /**
   * Load users effect: fetch paginated user list using current query params.
   */
  readonly loadUsers$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UsersActions.loadUsers),
      withLatestFrom(this.store.select(selectUsersQueryParams)),
      switchMap(([, queryParams]) =>
        this.usersService.getUsers(queryParams).pipe(
          map((response) => UsersActions.loadUsersSuccess({ response })),
          catchError((error: { error?: { message?: string }; message?: string }) => {
            const message = error.error?.message ?? error.message ?? 'Failed to load users.';
            return of(UsersActions.loadUsersFailure({ error: message }));
          })
        )
      )
    )
  );

  /**
   * When query params change, trigger a reload of the users list.
   */
  readonly updateQueryParams$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UsersActions.updateQueryParams),
      map(() => UsersActions.loadUsers())
    )
  );

  /**
   * Load user detail effect: fetch a single user's full information.
   */
  readonly loadUserDetail$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UsersActions.loadUserDetail),
      switchMap(({ userId }) =>
        this.usersService.getUserById(userId).pipe(
          map((user) => UsersActions.loadUserDetailSuccess({ user })),
          catchError((error: { error?: { message?: string }; message?: string }) => {
            const message = error.error?.message ?? error.message ?? 'Failed to load user details.';
            return of(UsersActions.loadUserDetailFailure({ error: message }));
          })
        )
      )
    )
  );

  /**
   * Create user effect: call API, on success dispatch success action.
   */
  readonly createUser$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UsersActions.createUser),
      exhaustMap(({ request }) =>
        this.usersService.createUser(request).pipe(
          map((user) => UsersActions.createUserSuccess({ user })),
          catchError((error: { error?: { message?: string }; message?: string }) => {
            const message = error.error?.message ?? error.message ?? 'Failed to create user.';
            return of(UsersActions.createUserFailure({ error: message }));
          })
        )
      )
    )
  );

  /**
   * Update user effect: call API, on success dispatch success action.
   */
  readonly updateUser$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UsersActions.updateUser),
      exhaustMap(({ userId, request }) =>
        this.usersService.updateUser(userId, request).pipe(
          map((user) => UsersActions.updateUserSuccess({ user })),
          catchError((error: { error?: { message?: string }; message?: string }) => {
            const message = error.error?.message ?? error.message ?? 'Failed to update user.';
            return of(UsersActions.updateUserFailure({ error: message }));
          })
        )
      )
    )
  );

  /**
   * Deactivate user effect: call API, on success dispatch success action.
   */
  readonly deactivateUser$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UsersActions.deactivateUser),
      exhaustMap(({ userId }) =>
        this.usersService.deactivateUser(userId).pipe(
          map(() => UsersActions.deactivateUserSuccess({ userId })),
          catchError((error: { error?: { message?: string }; message?: string }) => {
            const message = error.error?.message ?? error.message ?? 'Failed to deactivate user.';
            return of(UsersActions.deactivateUserFailure({ error: message }));
          })
        )
      )
    )
  );

  /**
   * Reactivate user effect: call API, on success dispatch success action.
   */
  readonly reactivateUser$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UsersActions.reactivateUser),
      exhaustMap(({ userId }) =>
        this.usersService.reactivateUser(userId).pipe(
          map(() => UsersActions.reactivateUserSuccess({ userId })),
          catchError((error: { error?: { message?: string }; message?: string }) => {
            const message = error.error?.message ?? error.message ?? 'Failed to reactivate user.';
            return of(UsersActions.reactivateUserFailure({ error: message }));
          })
        )
      )
    )
  );

  /**
   * Reset password effect: call API, on success dispatch success action.
   */
  readonly resetPassword$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UsersActions.resetPassword),
      exhaustMap(({ request }) =>
        this.usersService.resetPassword(request).pipe(
          map(() => UsersActions.resetPasswordSuccess()),
          catchError((error: { error?: { message?: string }; message?: string }) => {
            const message = error.error?.message ?? error.message ?? 'Failed to reset password.';
            return of(UsersActions.resetPasswordFailure({ error: message }));
          })
        )
      )
    )
  );

  /**
   * Bulk import effect: call API, on success dispatch success action.
   */
  readonly bulkImport$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UsersActions.bulkImport),
      exhaustMap(({ file }) =>
        this.usersService.bulkImport(file).pipe(
          map((response) => UsersActions.bulkImportSuccess({ response })),
          catchError((error: { error?: { message?: string }; message?: string }) => {
            const message = error.error?.message ?? error.message ?? 'Failed to import users.';
            return of(UsersActions.bulkImportFailure({ error: message }));
          })
        )
      )
    )
  );
}
