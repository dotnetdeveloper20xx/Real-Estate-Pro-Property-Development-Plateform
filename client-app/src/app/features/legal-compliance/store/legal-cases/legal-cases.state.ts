import { EntityState } from '@ngrx/entity';
import { ILegalCaseListItem, ILegalCasePipeline } from '../../models';

/**
 * NgRx state interface for the legal cases feature slice.
 * Uses @ngrx/entity EntityState for normalized storage of legal case list items.
 */
export interface LegalCasesState extends EntityState<ILegalCaseListItem> {
  /** Indicates whether an API call is in progress */
  readonly loading: boolean;
  /** Stores the latest error message from a failed API call */
  readonly error: string | null;
  /** The currently selected legal case ID (for detail views) */
  readonly selectedId: string | null;
  /** Pipeline data: cases grouped by status for kanban board */
  readonly pipeline: readonly ILegalCasePipeline[] | null;
  /** Loading state specifically for pipeline data */
  readonly pipelineLoading: boolean;
}
