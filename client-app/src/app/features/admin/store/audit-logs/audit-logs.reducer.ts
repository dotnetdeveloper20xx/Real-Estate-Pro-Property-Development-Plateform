import { createReducer, on } from '@ngrx/store';
import { AuditLogsState, initialAuditLogsState } from './audit-logs.state';
import { AuditLogsActions } from './audit-logs.actions';

/**
 * Admin audit logs reducer handling log querying and filtering actions.
 */
export const auditLogsReducer = createReducer(
  initialAuditLogsState,

  // ── Load Audit Logs ─────────────────────────────────────────────────────────
  on(AuditLogsActions.loadAuditLogs, (state): AuditLogsState => ({
    ...state,
    loading: true,
    error: null
  })),

  on(AuditLogsActions.loadAuditLogsSuccess, (state, { response }): AuditLogsState => ({
    ...state,
    entries: response.items,
    pagination: response.pagination,
    loading: false,
    error: null
  })),

  on(AuditLogsActions.loadAuditLogsFailure, (state, { error }): AuditLogsState => ({
    ...state,
    loading: false,
    error
  })),

  // ── Query Params ────────────────────────────────────────────────────────────
  on(AuditLogsActions.updateQueryParams, (state, { params }): AuditLogsState => ({
    ...state,
    queryParams: { ...state.queryParams, ...params }
  })),

  // ── Clear ───────────────────────────────────────────────────────────────────
  on(AuditLogsActions.clearAuditLogs, (): AuditLogsState => ({
    ...initialAuditLogsState
  })),

  on(AuditLogsActions.clearError, (state): AuditLogsState => ({
    ...state,
    error: null
  }))
);
