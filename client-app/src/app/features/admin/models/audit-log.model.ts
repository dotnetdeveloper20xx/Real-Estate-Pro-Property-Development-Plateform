import { IPaginationMeta } from './user.model';

/**
 * Audit log entry DTO for the admin audit log list.
 */
export interface IAuditLogEntry {
  readonly id: string;
  readonly timestamp: string;
  readonly action: string;
  readonly performedByUserName: string;
  readonly targetUserName: string | null;
  readonly details: string | null;
  readonly ipAddress: string;
}

/**
 * Paginated audit log API response.
 */
export interface IPagedAuditLogsResponse {
  readonly items: readonly IAuditLogEntry[];
  readonly pagination: IPaginationMeta;
}

/**
 * Query parameters for the audit logs API endpoint.
 */
export interface IAuditLogsQueryParams {
  readonly page: number;
  readonly pageSize: number;
  readonly action: string;
  readonly userId: string;
  readonly startDate: string;
  readonly endDate: string;
}
