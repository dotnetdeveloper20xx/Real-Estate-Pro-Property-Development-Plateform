import { createActionGroup, emptyProps, props } from '@ngrx/store';
import {
  IUserListItem,
  IUserDetail,
  ICreateUserRequest,
  IUpdateUserRequest,
  IResetPasswordRequest,
  IPagedUsersResponse,
  IUsersQueryParams,
  IBulkImportResponse
} from '../../models/user.model';

/**
 * NgRx action group for admin user management.
 * Follows the [Source] Event pattern for action naming.
 */
export const UsersActions = createActionGroup({
  source: 'Admin Users',
  events: {
    // ── Load Users (paginated) ──────────────────────────────────────────────
    /** Trigger loading the users list with current query params */
    'Load Users': emptyProps(),
    /** Users list loaded successfully */
    'Load Users Success': props<{ response: IPagedUsersResponse }>(),
    /** Users list load failed */
    'Load Users Failure': props<{ error: string }>(),

    // ── Load User Detail ────────────────────────────────────────────────────
    /** Load a single user's full detail by ID */
    'Load User Detail': props<{ userId: string }>(),
    /** User detail loaded successfully */
    'Load User Detail Success': props<{ user: IUserDetail }>(),
    /** User detail load failed */
    'Load User Detail Failure': props<{ error: string }>(),

    // ── Create User ─────────────────────────────────────────────────────────
    /** Create a new user */
    'Create User': props<{ request: ICreateUserRequest }>(),
    /** User created successfully */
    'Create User Success': props<{ user: IUserListItem }>(),
    /** User creation failed */
    'Create User Failure': props<{ error: string }>(),

    // ── Update User ─────────────────────────────────────────────────────────
    /** Update an existing user */
    'Update User': props<{ userId: string; request: IUpdateUserRequest }>(),
    /** User updated successfully */
    'Update User Success': props<{ user: IUserListItem }>(),
    /** User update failed */
    'Update User Failure': props<{ error: string }>(),

    // ── Deactivate User ─────────────────────────────────────────────────────
    /** Deactivate a user account */
    'Deactivate User': props<{ userId: string }>(),
    /** User deactivated successfully */
    'Deactivate User Success': props<{ userId: string }>(),
    /** User deactivation failed */
    'Deactivate User Failure': props<{ error: string }>(),

    // ── Reactivate User ─────────────────────────────────────────────────────
    /** Reactivate a deactivated user account */
    'Reactivate User': props<{ userId: string }>(),
    /** User reactivated successfully */
    'Reactivate User Success': props<{ userId: string }>(),
    /** User reactivation failed */
    'Reactivate User Failure': props<{ error: string }>(),

    // ── Reset Password ──────────────────────────────────────────────────────
    /** Reset a user's password */
    'Reset Password': props<{ request: IResetPasswordRequest }>(),
    /** Password reset successfully */
    'Reset Password Success': emptyProps(),
    /** Password reset failed */
    'Reset Password Failure': props<{ error: string }>(),

    // ── Bulk Import ─────────────────────────────────────────────────────────
    /** Bulk import users from a CSV file */
    'Bulk Import': props<{ file: File }>(),
    /** Bulk import completed */
    'Bulk Import Success': props<{ response: IBulkImportResponse }>(),
    /** Bulk import failed */
    'Bulk Import Failure': props<{ error: string }>(),

    // ── Query Params ────────────────────────────────────────────────────────
    /** Update search/filter/pagination parameters and reload */
    'Update Query Params': props<{ params: Partial<IUsersQueryParams> }>(),

    // ── Clear ───────────────────────────────────────────────────────────────
    /** Clear the selected user detail */
    'Clear Selected User': emptyProps(),
    /** Clear any error state */
    'Clear Error': emptyProps(),
  }
});
