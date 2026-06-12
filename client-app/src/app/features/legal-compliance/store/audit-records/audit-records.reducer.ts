import { createReducer, on } from '@ngrx/store';
import { createEntityAdapter, EntityAdapter } from '@ngrx/entity';
import { IAuditRecordListItem } from '../../models/audit-record.model';
import { AuditRecordState } from './audit-records.state';
import { AuditRecordActions } from './audit-records.actions';

/**
 * Entity adapter for normalized audit record state management.
 * Uses 'id' as the primary key and sorts by auditDate descending (newest first).
 */
export const auditRecordAdapter: EntityAdapter<IAuditRecordListItem> = createEntityAdapter<IAuditRecordListItem>({
  selectId: (auditRecord: IAuditRecordListItem) => auditRecord.id,
  sortComparer: (a: IAuditRecordListItem, b: IAuditRecordListItem) =>
    new Date(b.auditDate).getTime() - new Date(a.auditDate).getTime()
});

/**
 * Initial state using EntityAdapter's getInitialState plus custom properties.
 */
export const initialAuditRecordState: AuditRecordState = auditRecordAdapter.getInitialState({
  loading: false,
  error: null,
  selectedId: null
});

/**
 * Audit record reducer handling all audit-record-related actions.
 * Uses @ngrx/entity adapter methods for normalized CRUD operations.
 */
export const auditRecordReducer = createReducer(
  initialAuditRecordState,

  // Load
  on(AuditRecordActions.loadAuditRecords, (state): AuditRecordState => ({
    ...state,
    loading: true,
    error: null
  })),
  on(AuditRecordActions.loadAuditRecordsSuccess, (state, { auditRecords }): AuditRecordState =>
    auditRecordAdapter.setAll([...auditRecords], {
      ...state,
      loading: false,
      error: null
    })
  ),
  on(AuditRecordActions.loadAuditRecordsFailure, (state, { error }): AuditRecordState => ({
    ...state,
    loading: false,
    error
  })),

  // Create
  on(AuditRecordActions.createAuditRecord, (state): AuditRecordState => ({
    ...state,
    loading: true,
    error: null
  })),
  on(AuditRecordActions.createAuditRecordSuccess, (state, { auditRecord }): AuditRecordState =>
    auditRecordAdapter.addOne(auditRecord, {
      ...state,
      loading: false,
      error: null
    })
  ),
  on(AuditRecordActions.createAuditRecordFailure, (state, { error }): AuditRecordState => ({
    ...state,
    loading: false,
    error
  })),

  // Transition Status
  on(AuditRecordActions.transitionStatus, (state): AuditRecordState => ({
    ...state,
    loading: true,
    error: null
  })),
  on(AuditRecordActions.transitionStatusSuccess, (state, { auditRecord }): AuditRecordState =>
    auditRecordAdapter.upsertOne(auditRecord, {
      ...state,
      loading: false,
      error: null
    })
  ),
  on(AuditRecordActions.transitionStatusFailure, (state, { error }): AuditRecordState => ({
    ...state,
    loading: false,
    error
  })),

  // Select
  on(AuditRecordActions.selectAuditRecord, (state, { id }): AuditRecordState => ({
    ...state,
    selectedId: id
  }))
);
