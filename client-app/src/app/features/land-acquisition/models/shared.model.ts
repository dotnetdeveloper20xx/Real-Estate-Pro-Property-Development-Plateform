/**
 * Shared API response types used across all land acquisition models.
 */

export interface IApiResponse<T> {
  readonly data: T | null;
  readonly success: boolean;
  readonly errors: readonly string[];
  readonly pagination: IPaginationMeta | null;
}

export interface IPaginationMeta {
  readonly pageNumber: number;
  readonly pageSize: number;
  readonly totalCount: number;
  readonly totalPages: number;
}
