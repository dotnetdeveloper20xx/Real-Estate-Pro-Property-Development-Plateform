/**
 * Milestone type values mirroring the backend MilestoneType enum.
 */
export enum MilestoneType {
  SubmissionDate = 'SubmissionDate',
  ValidationDate = 'ValidationDate',
  ConsultationStart = 'ConsultationStart',
  ConsultationEnd = 'ConsultationEnd',
  TargetDecisionDate = 'TargetDecisionDate',
  ActualDecisionDate = 'ActualDecisionDate',
  AppealDeadline = 'AppealDeadline',
  CommitteeDate = 'CommitteeDate'
}

/**
 * Milestone status values mirroring the backend MilestoneStatus enum.
 */
export enum MilestoneStatus {
  Pending = 'Pending',
  Completed = 'Completed',
  Overdue = 'Overdue'
}

/**
 * Full planning milestone entity returned from the API.
 */
export interface IPlanningMilestone {
  readonly id: string;
  readonly applicationId: string;
  readonly milestoneType: string;
  readonly status: string;
  readonly targetDate: string;
  readonly actualDate: string | null;
  readonly varianceDays: number | null;
  readonly createdAt: string;
}

/**
 * Payload for creating a new planning milestone.
 */
export interface ICreateMilestone {
  readonly milestoneType: string;
  readonly targetDate: string;
}

/**
 * Payload for completing a milestone (recording actual date).
 */
export interface ICompleteMilestone {
  readonly actualDate: string;
}
