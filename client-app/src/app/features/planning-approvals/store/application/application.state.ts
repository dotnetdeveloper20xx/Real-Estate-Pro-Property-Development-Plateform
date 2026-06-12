import { EntityState } from '@ngrx/entity';
import { IApplicationListItem } from '../../models/planning-application.model';

/**
 * NgRx state interface for the planning applications feature slice.
 * Uses @ngrx/entity EntityState for normalized storage of application list items.
 */
export interface ApplicationState extends EntityState<IApplicationListItem> {
  /** Indicates whether an API call is in progress */
  readonly loading: boolean;
  /** Stores the latest error message from a failed API call */
  readonly error: string | null;
  /** The currently selected application ID (for detail views) */
  readonly selectedId: string | null;
}
