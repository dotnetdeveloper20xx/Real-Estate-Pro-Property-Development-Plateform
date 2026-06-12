import { EntityState } from '@ngrx/entity';
import { IContractListItem } from '../../models/contract.model';

/**
 * NgRx state interface for the contracts feature slice.
 * Uses @ngrx/entity EntityState for normalized storage of contract list items.
 */
export interface ContractsState extends EntityState<IContractListItem> {
  /** Indicates whether an API call is in progress */
  readonly loading: boolean;
  /** Stores the latest error message from a failed API call */
  readonly error: string | null;
  /** The currently selected contract ID (for detail views) */
  readonly selectedId: string | null;
  /** Total count from paginated API response */
  readonly totalCount: number;
  /** Current page number */
  readonly currentPage: number;
  /** Current page size */
  readonly pageSize: number;
}
