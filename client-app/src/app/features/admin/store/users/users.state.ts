import { EntityState } from '@ngrx/entity';
import {
  IUserListItem,
  IUserDetail,
  IPaginationMeta,
  IUsersQueryParams,
  UserStatusFilter
} from '../../models/user.model';

/**
 * NgRx state interface for the admin users feature slice.
 * Uses @ngrx/entity EntityState for normalized storage of user list items.
 */
export interface UsersState extends EntityState<IUserListItem> {
  /** The currently selected user detail (loaded on detail view) */
  readonly selectedUser: IUserDetail | null;
  /** Pagination metadata from the last API response */
  readonly pagination: IPaginationMeta;
  /** Whether a users API call is in progress */
  readonly loading: boolean;
  /** The latest error message from a failed API call */
  readonly error: string | null;
  /** Current search and filter parameters */
  readonly queryParams: IUsersQueryParams;
}

/**
 * Default query parameters for users list.
 */
export const defaultUsersQueryParams: IUsersQueryParams = {
  page: 1,
  pageSize: 10,
  search: '',
  statusFilter: UserStatusFilter.All
};

/**
 * Default pagination metadata.
 */
export const defaultPagination: IPaginationMeta = {
  currentPage: 1,
  pageSize: 10,
  totalCount: 0,
  totalPages: 0
};
