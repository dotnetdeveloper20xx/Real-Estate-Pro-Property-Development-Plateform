import { createActionGroup, emptyProps, props } from '@ngrx/store';
import {
  IAuditRecordListItem,
  ICreateAuditRecord,
  ITransitionAuditRecordStatus
} from '../../models/audit-record.model';

/**
 * NgRx action group for audit record state management.
 * Follows the [Source] Event pattern for action naming.
 */
export const AuditRecordActions = createActionGroup({
  source: 'Audit Records',
  events: {
    /** Trigger loading of all audit records */
    'Load Audit Records': emptyProps(),
    /** Successfully loaded audit records from API */
    'Load Audit Records Success': props<{ auditRecords: readonly IAuditRecordListItem[] }>(),
    /** Failed to load audit records */
    'Load Audit Records Failure': props<{ error: string }>(),

    /** Trigger creation of a new audit record */
    'Create Audit Record': props<{ auditRecord: ICreateAuditRecord }>(),
    /** Successfully created an audit record */
    'Create Audit Record Success': props<{ auditRecord: IAuditRecordListItem }>(),
    /** Failed to create an audit record */
    'Create Audit Record Failure': props<{ error: string }>(),

    /** Trigger a status transition on an audit record */
    'Transition Status': props<{ id: string; transition: ITransitionAuditRecordStatus }>(),
    /** Successfully transitioned status */
    'Transition Status Success': props<{ auditRecord: IAuditRecordListItem }>(),
    /** Failed to transition status */
    'Transition Status Failure': props<{ error: string }>(),

    /** Select an audit record (for detail view navigation) */
    'Select Audit Record': props<{ id: string | null }>(),
  }
});
