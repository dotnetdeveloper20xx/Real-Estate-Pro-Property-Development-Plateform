import { EntityState } from '@ngrx/entity';
import { IInsuranceRecordListItem } from '../../models/insurance-record.model';

/**
 * Pagination metadata for insurance record list views.
 */
export interface InsurancePagination {
  readonly totalCount: number;
  readonly currentPage: number;
  readonly pageSize: number;
  readonly totalPages: number;
}

/**
 * NgRx state interface for the insurance feature slice.
 * Uses @ngrx/entity EntityState for normalized storage of insurance record list items.
 */
export interface InsuranceState extends EntityState<IInsuranceRecordListItem> {
  /** Indicates whether an API call is in progress */
  readonly loading: boolean;
  /** Stores the latest error message from a failed API call */
  readonly error: string | null;
  /** The currently selected insurance record ID (for detail views) */
  readonly selectedId: string | null;
  /** Pagination metadata from the latest load operation */
  readonly pagination: InsurancePagination;
}
