/**
 * Audit entry returned from the audit trail API.
 * Represents a single audited action on an opportunity entity.
 */
export interface IAuditEntry {
  readonly id: string;
  readonly action: string;
  readonly userName: string;
  readonly timestamp: string;
  readonly changedFields: readonly string[];
  readonly entityName: string;
  readonly entityId: string;
}
