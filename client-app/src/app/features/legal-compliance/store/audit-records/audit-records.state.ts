import { EntityState } from '@ngrx/entity';
import { IAuditRecordListItem } from '../../models/audit-record.model';

/**
 * NgRx state interface for the audit records feature slice.
 * Uses @ngrx/entity EntityState for normalized storage of audit record list items.
 */
export interface AuditRecordState extends EntityState<IAuditRecordListItem> {
  /** Indicates whether an API call is in progress */
  readonly loading: boolean;
  /** Stores the latest error message from a failed API call */
  readonly error: string | null;
  /** The currently selected audit record ID (for detail views) */
  readonly selectedId: string | null;
}
