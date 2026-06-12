/**
 * Appeal type values mirroring the backend AppealType enum.
 */
export enum AppealType {
  WrittenRepresentations = 'WrittenRepresentations',
  Hearing = 'Hearing',
  PublicInquiry = 'PublicInquiry'
}

/**
 * Appeal status values mirroring the backend AppealStatus enum.
 */
export enum AppealStatus {
  Lodged = 'Lodged',
  UnderReview = 'UnderReview',
  HearingScheduled = 'HearingScheduled',
  Allowed = 'Allowed',
  Dismissed = 'Dismissed',
  Closed = 'Closed'
}

/**
 * Appeal outcome type values mirroring the backend AppealOutcomeType enum.
 */
export enum AppealOutcomeType {
  Approved = 'Approved',
  ApprovedWithConditions = 'ApprovedWithConditions'
}

/**
 * Full planning appeal entity returned from the API.
 */
export interface IPlanningAppeal {
  readonly id: string;
  readonly applicationId: string;
  readonly appealGrounds: string;
  readonly appealType: string;
  readonly status: string;
  readonly lodgedDate: string;
  readonly appealOutcomeType: string | null;
  readonly decisionDate: string | null;
  readonly decisionSummary: string | null;
  readonly createdAt: string;
  readonly createdBy: string;
}

/**
 * Payload for creating a new planning appeal.
 */
export interface ICreateAppeal {
  readonly appealGrounds: string;
  readonly appealType: string;
}

/**
 * Payload for transitioning an appeal status.
 */
export interface ITransitionAppealStatus {
  readonly newStatus: string;
  readonly appealOutcomeType?: string | null;
  readonly decisionDate?: string | null;
  readonly decisionSummary?: string | null;
}
