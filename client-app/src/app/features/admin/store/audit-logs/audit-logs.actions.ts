import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { IAuditLogsQueryParams, IPagedAuditLogsResponse } from '../../models/audit-log.model';

/**
 * NgRx action group for admin audit log management.
 */
export const AuditLogsActions = createActionGroup({
  source: 'Admin Audit Logs',
  events: {
    // ── Load Audit Logs ─────────────────────────────────────────────────────
    /** Load paginated audit log entries with current filters */
    'Load Audit Logs': emptyProps(),
    /** Audit logs loaded successfully */
    'Load Audit Logs Success': props<{ response: IPagedAuditLogsResponse }>(),
    /** Audit logs load failed */
    'Load Audit Logs Failure': props<{ error: string }>(),

    // ── Query Params ────────────────────────────────────────────────────────
    /** Update filter/pagination parameters and reload */
    'Update Query Params': props<{ params: Partial<IAuditLogsQueryParams> }>(),

    // ── Clear ───────────────────────────────────────────────────────────────
    /** Clear all audit log entries and reset filters */
    'Clear Audit Logs': emptyProps(),
    /** Clear any error state */
    'Clear Error': emptyProps(),
  }
});
