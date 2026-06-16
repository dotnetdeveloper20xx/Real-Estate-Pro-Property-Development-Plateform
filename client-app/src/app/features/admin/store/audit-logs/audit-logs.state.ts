import { IAuditLogEntry, IAuditLogsQueryParams } from '../../models/audit-log.model';
import { IPaginationMeta } from '../../models/user.model';

/**
 * NgRx state interface for the admin audit logs feature slice.
 */
export interface AuditLogsState {
  /** List of audit log entries for the current page */
  readonly entries: readonly IAuditLogEntry[];
  /** Pagination metadata from the last API response */
  readonly pagination: IPaginationMeta;
  /** Current query/filter parameters */
  readonly queryParams: IAuditLogsQueryParams;
  /** Whether an audit logs API call is in progress */
  readonly loading: boolean;
  /** The latest error message from a failed API call */
  readonly error: string | null;
}

/**
 * Default query parameters for audit logs.
 */
export const defaultAuditLogsQueryParams: IAuditLogsQueryParams = {
  page: 1,
  pageSize: 25,
  action: '',
  userId: '',
  startDate: '',
  endDate: ''
};

/**
 * Default pagination metadata.
 */
export const defaultAuditLogsPagination: IPaginationMeta = {
  currentPage: 1,
  pageSize: 25,
  totalCount: 0,
  totalPages: 0
};

/**
 * Initial state for the admin audit logs store.
 */
export const initialAuditLogsState: AuditLogsState = {
  entries: [],
  pagination: defaultAuditLogsPagination,
  queryParams: defaultAuditLogsQueryParams,
  loading: false,
  error: null
};
