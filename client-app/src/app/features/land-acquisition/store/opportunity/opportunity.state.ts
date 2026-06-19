import { EntityState } from '@ngrx/entity';
import { IOpportunityListItem, OpportunityStatus } from '../../models/opportunity.model';

/**
 * Pagination metadata returned from the server alongside paginated results.
 */
export interface IPaginationMeta {
  readonly pageNumber: number;
  readonly pageSize: number;
  readonly totalCount: number;
  readonly totalPages: number;
}

/**
 * Filter parameters for querying the opportunity list.
 */
export interface IOpportunityFilters {
  readonly status: OpportunityStatus | null;
  readonly search: string;
  readonly location: string;
  readonly source: string;
  readonly dateFrom: string | null;
  readonly dateTo: string | null;
  readonly sortBy: string;
  readonly sortDirection: 'asc' | 'desc';
}

/**
 * NgRx state interface for the opportunity feature slice.
 * Uses @ngrx/entity EntityState for normalized storage of opportunity list items.
 */
export interface OpportunityState extends EntityState<IOpportunityListItem> {
  /** Indicates whether an API call is in progress */
  readonly loading: boolean;
  /** Stores the latest error message from a failed API call */
  readonly error: string | null;
  /** The currently selected opportunity ID (for detail views) */
  readonly selectedId: string | null;
  /** Server-side pagination metadata */
  readonly pagination: IPaginationMeta;
  /** Current filter and sort parameters */
  readonly filters: IOpportunityFilters;
  /** Indicates whether a bulk delete operation is in progress */
  readonly bulkDeleteInProgress: boolean;
}
