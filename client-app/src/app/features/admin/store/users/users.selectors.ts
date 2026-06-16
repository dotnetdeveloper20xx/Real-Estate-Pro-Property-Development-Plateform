import { createFeatureSelector, createSelector } from '@ngrx/store';
import { UsersState } from './users.state';
import { usersAdapter } from './users.reducer';

/**
 * Feature selector for the admin users state slice.
 */
export const selectUsersState = createFeatureSelector<UsersState>('adminUsers');

/**
 * Entity adapter selectors for normalized state access.
 */
const { selectAll, selectEntities, selectTotal } = usersAdapter.getSelectors();

/**
 * Select all users as an array.
 */
export const selectAllUsers = createSelector(
  selectUsersState,
  selectAll
);

/**
 * Select the users entities dictionary (id → entity).
 */
export const selectUserEntities = createSelector(
  selectUsersState,
  selectEntities
);

/**
 * Select total number of users in the store.
 */
export const selectUsersTotal = createSelector(
  selectUsersState,
  selectTotal
);

/**
 * Select the currently selected user detail.
 */
export const selectSelectedUser = createSelector(
  selectUsersState,
  (state: UsersState) => state.selectedUser
);

/**
 * Select the pagination metadata.
 */
export const selectUsersPagination = createSelector(
  selectUsersState,
  (state: UsersState) => state.pagination
);

/**
 * Select the loading state indicator.
 */
export const selectUsersLoading = createSelector(
  selectUsersState,
  (state: UsersState) => state.loading
);

/**
 * Select the current error message.
 */
export const selectUsersError = createSelector(
  selectUsersState,
  (state: UsersState) => state.error
);

/**
 * Select the current query parameters (page, search, filter).
 */
export const selectUsersQueryParams = createSelector(
  selectUsersState,
  (state: UsersState) => state.queryParams
);

/**
 * Select a user by their ID from the entity dictionary.
 */
export const selectUserById = (id: string) =>
  createSelector(
    selectUserEntities,
    (entities) => entities[id] ?? null
  );

/**
 * Select only active users.
 */
export const selectActiveUsers = createSelector(
  selectAllUsers,
  (users) => users.filter(u => u.isActive)
);

/**
 * Select only inactive users.
 */
export const selectInactiveUsers = createSelector(
  selectAllUsers,
  (users) => users.filter(u => !u.isActive)
);
