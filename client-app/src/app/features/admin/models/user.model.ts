/**
 * User list item DTO for the admin users table.
 * Represents a single user in paginated list views.
 */
export interface IUserListItem {
  readonly id: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly email: string;
  readonly roles: readonly string[];
  readonly isActive: boolean;
  readonly lastLoginAt: string | null;
}

/**
 * Detailed user DTO for the admin user detail view.
 * Extends list item with security and session information.
 */
export interface IUserDetail extends IUserListItem {
  readonly createdAt: string;
  readonly passwordLastChangedAt: string | null;
  readonly failedLoginAttempts: number;
  readonly lastAuditActivity: string | null;
  readonly sessions: readonly ISessionItem[];
}

/**
 * Payload for creating a new user via the admin API.
 */
export interface ICreateUserRequest {
  readonly firstName: string;
  readonly lastName: string;
  readonly email: string;
  readonly password: string;
  readonly roles: readonly string[];
}

/**
 * Payload for updating an existing user via the admin API.
 */
export interface IUpdateUserRequest {
  readonly firstName: string;
  readonly lastName: string;
  readonly email: string;
  readonly roles: readonly string[];
}

/**
 * Payload for resetting a user's password via the admin API.
 */
export interface IResetPasswordRequest {
  readonly userId: string;
  readonly newPassword: string;
}

/**
 * Payload for bulk importing users via CSV.
 */
export interface IBulkImportRequest {
  readonly file: File;
}

/**
 * Response from bulk import with row-level results.
 */
export interface IBulkImportResponse {
  readonly totalRows: number;
  readonly successCount: number;
  readonly failureCount: number;
  readonly errors: readonly IBulkImportError[];
}

/**
 * Per-row error detail from bulk import.
 */
export interface IBulkImportError {
  readonly row: number;
  readonly field: string;
  readonly message: string;
}

/**
 * Session item used in user detail views and session management.
 */
export interface ISessionItem {
  readonly id: string;
  readonly deviceInfo: string;
  readonly browser: string;
  readonly operatingSystem: string;
  readonly ipAddress: string;
  readonly city: string | null;
  readonly country: string | null;
  readonly lastActiveAt: string;
  readonly isCurrent: boolean;
  readonly isRevoked: boolean;
}

/**
 * Pagination metadata returned by paginated API endpoints.
 */
export interface IPaginationMeta {
  readonly currentPage: number;
  readonly pageSize: number;
  readonly totalCount: number;
  readonly totalPages: number;
}

/**
 * Paginated API response wrapper for user list.
 */
export interface IPagedUsersResponse {
  readonly items: readonly IUserListItem[];
  readonly pagination: IPaginationMeta;
}

/**
 * Query parameters for the users list API endpoint.
 */
export interface IUsersQueryParams {
  readonly page: number;
  readonly pageSize: number;
  readonly search: string;
  readonly statusFilter: UserStatusFilter;
}

/**
 * Status filter options for the users list.
 */
export enum UserStatusFilter {
  All = 'All',
  Active = 'Active',
  Inactive = 'Inactive'
}
