import { createFeatureSelector, createSelector } from '@ngrx/store';
import { AuditRecordState } from './audit-records.state';
import { auditRecordAdapter } from './audit-records.reducer';
import { IAuditRecordListItem, AuditRecordStatus } from '../../models/audit-record.model';

/**
 * Feature selector for the audit record state slice.
 */
export const selectAuditRecordState = createFeatureSelector<AuditRecordState>('auditRecords');

/**
 * Entity adapter selectors for normalized state access.
 */
const { selectAll, selectEntities } = auditRecordAdapter.getSelectors();

/**
 * Select all audit records as an array, sorted by the adapter's sortComparer.
 */
export const selectAllAuditRecords = createSelector(
  selectAuditRecordState,
  selectAll
);

/**
 * Select the audit record entities dictionary (id → entity).
 */
export const selectAuditRecordEntities = createSelector(
  selectAuditRecordState,
  selectEntities
);

/**
 * Select the currently selected audit record ID.
 */
export const selectSelectedAuditRecordId = createSelector(
  selectAuditRecordState,
  (state: AuditRecordState) => state.selectedId
);

/**
 * Select the currently selected audit record entity.
 */
export const selectSelectedAuditRecord = createSelector(
  selectAuditRecordEntities,
  selectSelectedAuditRecordId,
  (entities, selectedId): IAuditRecordListItem | undefined =>
    selectedId ? entities[selectedId] : undefined
);

/**
 * Select an audit record by its ID.
 */
export const selectAuditRecordById = (id: string) =>
  createSelector(
    selectAuditRecordEntities,
    (entities): IAuditRecordListItem | undefined => entities[id]
  );

/**
 * Select audit records grouped by status.
 * Returns a record mapping each AuditRecordStatus to an array of audit records.
 */
export const selectAuditRecordsByStatus = createSelector(
  selectAllAuditRecords,
  (auditRecords): Record<AuditRecordStatus, readonly IAuditRecordListItem[]> => {
    const grouped: Record<AuditRecordStatus, IAuditRecordListItem[]> = {
      [AuditRecordStatus.Planned]: [],
      [AuditRecordStatus.InProgress]: [],
      [AuditRecordStatus.FindingsRecorded]: [],
      [AuditRecordStatus.ActionsRequired]: [],
      [AuditRecordStatus.RemediationInProgress]: [],
      [AuditRecordStatus.Verified]: [],
      [AuditRecordStatus.Closed]: []
    };

    for (const record of auditRecords) {
      grouped[record.status].push(record);
    }

    return grouped;
  }
);

/**
 * Select only overdue audit records.
 */
export const selectOverdueAuditRecords = createSelector(
  selectAllAuditRecords,
  (auditRecords): readonly IAuditRecordListItem[] =>
    auditRecords.filter((record) => record.isOverdue)
);

/**
 * Select count of overdue audit records.
 */
export const selectOverdueAuditRecordCount = createSelector(
  selectOverdueAuditRecords,
  (overdueRecords): number => overdueRecords.length
);

/**
 * Select the loading state indicator.
 */
export const selectAuditRecordLoading = createSelector(
  selectAuditRecordState,
  (state: AuditRecordState) => state.loading
);

/**
 * Select the current error message (null if no error).
 */
export const selectAuditRecordError = createSelector(
  selectAuditRecordState,
  (state: AuditRecordState) => state.error
);
