import { createFeatureSelector, createSelector } from '@ngrx/store';
import { AuditLogsState } from './audit-logs.state';

/**
 * Feature selector for the admin audit logs state slice.
 */
export const selectAuditLogsState = createFeatureSelector<AuditLogsState>('adminAuditLogs');

/**
 * Select all audit log entries for the current page.
 */
export const selectAuditLogEntries = createSelector(
  selectAuditLogsState,
  (state: AuditLogsState) => state.entries
);

/**
 * Select the pagination metadata.
 */
export const selectAuditLogsPagination = createSelector(
  selectAuditLogsState,
  (state: AuditLogsState) => state.pagination
);

/**
 * Select the current query/filter parameters.
 */
export const selectAuditLogsQueryParams = createSelector(
  selectAuditLogsState,
  (state: AuditLogsState) => state.queryParams
);

/**
 * Select the loading state indicator.
 */
export const selectAuditLogsLoading = createSelector(
  selectAuditLogsState,
  (state: AuditLogsState) => state.loading
);

/**
 * Select the current error message.
 */
export const selectAuditLogsError = createSelector(
  selectAuditLogsState,
  (state: AuditLogsState) => state.error
);

/**
 * Select whether the entries list is empty (for empty state display).
 */
export const selectAuditLogsEmpty = createSelector(
  selectAuditLogEntries,
  (entries) => entries.length === 0
);
