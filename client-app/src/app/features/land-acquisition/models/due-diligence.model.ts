/**
 * Due diligence check type values mirroring the backend DueDiligenceType enum.
 */
export enum DueDiligenceType {
  Legal = 'Legal',
  Environmental = 'Environmental',
  Planning = 'Planning',
  Utilities = 'Utilities',
  Valuation = 'Valuation'
}

/**
 * Due diligence check status values mirroring the backend DueDiligenceStatus enum.
 */
export enum DueDiligenceStatus {
  Pending = 'Pending',
  InProgress = 'InProgress',
  Completed = 'Completed',
  Failed = 'Failed'
}

/**
 * Full due diligence entity returned from the API.
 */
export interface IDueDiligence {
  readonly id: string;
  readonly opportunityId: string;
  readonly type: DueDiligenceType;
  readonly status: DueDiligenceStatus;
  readonly findings: string | null;
  readonly reportDate: string | null;
  readonly createdAt: string;
  readonly createdBy: string;
  readonly updatedAt: string | null;
  readonly updatedBy: string | null;
}

/**
 * Payload for creating a new due diligence check.
 */
export interface ICreateDueDiligence {
  readonly type: DueDiligenceType;
  readonly findings?: string | null;
}
