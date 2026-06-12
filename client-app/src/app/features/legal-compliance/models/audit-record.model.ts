/**
 * Audit Record domain models and enums.
 */

export enum AuditType {
  Internal = 'Internal',
  External = 'External',
  Regulatory = 'Regulatory',
  SpotCheck = 'SpotCheck'
}

export enum AuditRecordStatus {
  Planned = 'Planned',
  InProgress = 'InProgress',
  FindingsRecorded = 'FindingsRecorded',
  ActionsRequired = 'ActionsRequired',
  RemediationInProgress = 'RemediationInProgress',
  Verified = 'Verified',
  Closed = 'Closed'
}

export enum RiskRating {
  Low = 'Low',
  Medium = 'Medium',
  High = 'High',
  Critical = 'Critical'
}

/** Audit record entity. */
export interface IAuditRecord {
  readonly id: string;
  readonly auditType: AuditType;
  readonly scope: string;
  readonly auditorName: string;
  readonly auditDate: string;
  readonly status: AuditRecordStatus;
  readonly findings: string | null;
  readonly riskRating: RiskRating | null;
  readonly recommendations: string | null;
  readonly actionDueDate: string | null;
  readonly isOverdue: boolean;
  readonly legalCaseId: string | null;
  readonly complianceRequirementId: string | null;
  readonly createdAt: string;
  readonly createdBy: string;
  readonly updatedAt: string | null;
  readonly updatedBy: string | null;
}

/** Lightweight list item for table views. */
export interface IAuditRecordListItem {
  readonly id: string;
  readonly auditType: AuditType;
  readonly scope: string;
  readonly auditorName: string;
  readonly auditDate: string;
  readonly status: AuditRecordStatus;
  readonly riskRating: RiskRating | null;
  readonly isOverdue: boolean;
  readonly actionDueDate: string | null;
}

/** Full audit record detail. */
export interface IAuditRecordDetail extends IAuditRecord {
  readonly caseReference: string | null;
  readonly requirementName: string | null;
}

/** Command payload for creating an audit record. */
export interface ICreateAuditRecord {
  readonly auditType: AuditType;
  readonly scope: string;
  readonly auditorName: string;
  readonly auditDate: string;
  readonly legalCaseId?: string | null;
  readonly complianceRequirementId?: string | null;
}

/** Command payload for transitioning an audit record status. */
export interface ITransitionAuditRecordStatus {
  readonly newStatus: AuditRecordStatus;
  readonly findings?: string | null;
  readonly riskRating?: RiskRating | null;
  readonly recommendations?: string | null;
  readonly actionDueDate?: string | null;
}
