import { EntityState } from '@ngrx/entity';
import { ILegalDocumentListItem } from '../../models';

/**
 * NgRx state interface for the legal documents feature slice.
 * Uses @ngrx/entity EntityState for normalized storage of document list items.
 */
export interface DocumentsState extends EntityState<ILegalDocumentListItem> {
  /** Indicates whether an API call is in progress */
  readonly loading: boolean;
  /** Stores the latest error message from a failed API call */
  readonly error: string | null;
}
