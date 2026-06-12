/**
 * Legal Case domain models and enums.
 */

export enum LegalCaseStatus {
  Open = 'Open',
  InProgress = 'InProgress',
  UnderReview = 'UnderReview',
  OnHold = 'OnHold',
  Escalated = 'Escalated',
  Resolved = 'Resolved',
  Closed = 'Closed',
  Reopened = 'Reopened'
}

export enum LegalCaseType {
  Conveyancing = 'Conveyancing',
  Dispute = 'Dispute',
  ContractReview = 'ContractReview',
  Regulatory = 'Regulatory',
  Planning = 'Planning',
  General = 'General'
}

export enum LegalCasePriority {
  Low = 'Low',
  Medium = 'Medium',
  High = 'High',
  Critical = 'Critical'
}

/** Base legal case fields shared across list and detail views. */
export interface ILegalCase {
  readonly id: string;
  readonly caseReference: string;
  readonly title: string;
  readonly description: string;
  readonly caseType: LegalCaseType;
  readonly status: LegalCaseStatus;
  readonly priority: LegalCasePriority;
  readonly assignedSolicitor: string | null;
  readonly solicitorFirm: string | null;
  readonly solicitorEmail: string | null;
  readonly solicitorPhone: string | null;
  readonly notes: string | null;
  readonly resolutionSummary: string | null;
  readonly resolutionDate: string | null;
  readonly escalationReason: string | null;
  readonly holdReason: string | null;
  readonly opportunityId: string | null;
  readonly planningApplicationId: string | null;
  readonly createdAt: string;
  readonly createdBy: string;
  readonly updatedAt: string | null;
  readonly updatedBy: string | null;
}

/** Lightweight list item for paginated table views. */
export interface ILegalCaseListItem {
  readonly id: string;
  readonly caseReference: string;
  readonly title: string;
  readonly caseType: LegalCaseType;
  readonly status: LegalCaseStatus;
  readonly priority: LegalCasePriority;
  readonly assignedSolicitor: string | null;
  readonly solicitorFirm: string | null;
  readonly opportunityId: string | null;
  readonly planningApplicationId: string | null;
  readonly createdAt: string;
}

/** Full detail view including navigation collections. */
export interface ILegalCaseDetail extends ILegalCase {
  readonly contractCount: number;
  readonly documentCount: number;
  readonly insuranceCount: number;
}

/** Pipeline DTO grouping cases by status. */
export interface ILegalCasePipeline {
  readonly status: LegalCaseStatus;
  readonly cases: readonly ILegalCaseListItem[];
  readonly count: number;
}

/** Summary DTO for cross-module integration. */
export interface ILegalCaseSummary {
  readonly id: string;
  readonly caseReference: string;
  readonly title: string;
  readonly status: LegalCaseStatus;
  readonly priority: LegalCasePriority;
  readonly caseType: LegalCaseType;
}

/** Command payload for creating a legal case. */
export interface ICreateLegalCase {
  readonly title: string;
  readonly description: string;
  readonly caseType: LegalCaseType;
  readonly priority: LegalCasePriority;
  readonly assignedSolicitor?: string | null;
  readonly solicitorFirm?: string | null;
  readonly solicitorEmail?: string | null;
  readonly solicitorPhone?: string | null;
  readonly notes?: string | null;
  readonly opportunityId?: string | null;
  readonly planningApplicationId?: string | null;
}

/** Command payload for updating a legal case. */
export interface IUpdateLegalCase {
  readonly title?: string;
  readonly description?: string;
  readonly priority?: LegalCasePriority;
  readonly assignedSolicitor?: string | null;
  readonly solicitorFirm?: string | null;
  readonly solicitorEmail?: string | null;
  readonly solicitorPhone?: string | null;
  readonly notes?: string | null;
}

/** Command payload for transitioning a legal case status. */
export interface ITransitionLegalCaseStatus {
  readonly newStatus: LegalCaseStatus;
  readonly resolutionSummary?: string | null;
  readonly resolutionDate?: string | null;
  readonly escalationReason?: string | null;
  readonly holdReason?: string | null;
}
