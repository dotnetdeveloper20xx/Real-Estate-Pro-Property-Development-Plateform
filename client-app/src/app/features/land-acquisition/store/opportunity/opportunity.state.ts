import { EntityState } from '@ngrx/entity';
import { IOpportunityListItem } from '../../models/opportunity.model';

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
}
