/**
 * Shared API response and pagination types for the legal compliance module.
 */

/**
 * Standard API response envelope matching the backend ApiResponse<T> contract.
 */
export interface IApiResponse<T> {
  readonly data: T | null;
  readonly success: boolean;
  readonly errors: readonly string[];
}

/**
 * Paginated result matching the backend PagedResult<T> contract.
 */
export interface IPagedResult<T> {
  readonly items: readonly T[];
  readonly totalCount: number;
  readonly page: number;
  readonly pageSize: number;
  readonly totalPages: number;
}
