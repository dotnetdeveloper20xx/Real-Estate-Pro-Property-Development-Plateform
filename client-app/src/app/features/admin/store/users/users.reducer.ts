import { createReducer, on } from '@ngrx/store';
import { createEntityAdapter, EntityAdapter } from '@ngrx/entity';
import { IUserListItem } from '../../models/user.model';
import { UsersState, defaultUsersQueryParams, defaultPagination } from './users.state';
import { UsersActions } from './users.actions';

/**
 * Entity adapter for normalized admin user state management.
 * Uses 'id' as the primary key.
 */
export const usersAdapter: EntityAdapter<IUserListItem> = createEntityAdapter<IUserListItem>({
  selectId: (user: IUserListItem) => user.id
});

/**
 * Initial state for the admin users store.
 */
export const initialUsersState: UsersState = usersAdapter.getInitialState({
  selectedUser: null,
  pagination: defaultPagination,
  loading: false,
  error: null,
  queryParams: defaultUsersQueryParams
});

/**
 * Admin users reducer handling all user management actions.
 * Uses @ngrx/entity adapter methods for normalized CRUD operations.
 */
export const usersReducer = createReducer(
  initialUsersState,

  // ── Load Users ──────────────────────────────────────────────────────────────
  on(UsersActions.loadUsers, (state): UsersState => ({
    ...state,
    loading: true,
    error: null
  })),

  on(UsersActions.loadUsersSuccess, (state, { response }): UsersState =>
    usersAdapter.setAll([...response.items], {
      ...state,
      pagination: response.pagination,
      loading: false,
      error: null
    })
  ),

  on(UsersActions.loadUsersFailure, (state, { error }): UsersState => ({
    ...state,
    loading: false,
    error
  })),

  // ── Load User Detail ────────────────────────────────────────────────────────
  on(UsersActions.loadUserDetail, (state): UsersState => ({
    ...state,
    loading: true,
    error: null
  })),

  on(UsersActions.loadUserDetailSuccess, (state, { user }): UsersState => ({
    ...state,
    selectedUser: user,
    loading: false,
    error: null
  })),

  on(UsersActions.loadUserDetailFailure, (state, { error }): UsersState => ({
    ...state,
    selectedUser: null,
    loading: false,
    error
  })),

  // ── Create User ─────────────────────────────────────────────────────────────
  on(UsersActions.createUser, (state): UsersState => ({
    ...state,
    loading: true,
    error: null
  })),

  on(UsersActions.createUserSuccess, (state, { user }): UsersState =>
    usersAdapter.addOne(user, {
      ...state,
      loading: false,
      error: null
    })
  ),

  on(UsersActions.createUserFailure, (state, { error }): UsersState => ({
    ...state,
    loading: false,
    error
  })),

  // ── Update User ─────────────────────────────────────────────────────────────
  on(UsersActions.updateUser, (state): UsersState => ({
    ...state,
    loading: true,
    error: null
  })),

  on(UsersActions.updateUserSuccess, (state, { user }): UsersState =>
    usersAdapter.upsertOne(user, {
      ...state,
      loading: false,
      error: null
    })
  ),

  on(UsersActions.updateUserFailure, (state, { error }): UsersState => ({
    ...state,
    loading: false,
    error
  })),

  // ── Deactivate User ─────────────────────────────────────────────────────────
  on(UsersActions.deactivateUser, (state): UsersState => ({
    ...state,
    loading: true,
    error: null
  })),

  on(UsersActions.deactivateUserSuccess, (state, { userId }): UsersState =>
    usersAdapter.updateOne(
      { id: userId, changes: { isActive: false } },
      { ...state, loading: false, error: null }
    )
  ),

  on(UsersActions.deactivateUserFailure, (state, { error }): UsersState => ({
    ...state,
    loading: false,
    error
  })),

  // ── Reactivate User ─────────────────────────────────────────────────────────
  on(UsersActions.reactivateUser, (state): UsersState => ({
    ...state,
    loading: true,
    error: null
  })),

  on(UsersActions.reactivateUserSuccess, (state, { userId }): UsersState =>
    usersAdapter.updateOne(
      { id: userId, changes: { isActive: true } },
      { ...state, loading: false, error: null }
    )
  ),

  on(UsersActions.reactivateUserFailure, (state, { error }): UsersState => ({
    ...state,
    loading: false,
    error
  })),

  // ── Reset Password ──────────────────────────────────────────────────────────
  on(UsersActions.resetPassword, (state): UsersState => ({
    ...state,
    loading: true,
    error: null
  })),

  on(UsersActions.resetPasswordSuccess, (state): UsersState => ({
    ...state,
    loading: false,
    error: null
  })),

  on(UsersActions.resetPasswordFailure, (state, { error }): UsersState => ({
    ...state,
    loading: false,
    error
  })),

  // ── Bulk Import ─────────────────────────────────────────────────────────────
  on(UsersActions.bulkImport, (state): UsersState => ({
    ...state,
    loading: true,
    error: null
  })),

  on(UsersActions.bulkImportSuccess, (state): UsersState => ({
    ...state,
    loading: false,
    error: null
  })),

  on(UsersActions.bulkImportFailure, (state, { error }): UsersState => ({
    ...state,
    loading: false,
    error
  })),

  // ── Query Params ────────────────────────────────────────────────────────────
  on(UsersActions.updateQueryParams, (state, { params }): UsersState => ({
    ...state,
    queryParams: { ...state.queryParams, ...params }
  })),

  // ── Clear ───────────────────────────────────────────────────────────────────
  on(UsersActions.clearSelectedUser, (state): UsersState => ({
    ...state,
    selectedUser: null
  })),

  on(UsersActions.clearError, (state): UsersState => ({
    ...state,
    error: null
  }))
);
