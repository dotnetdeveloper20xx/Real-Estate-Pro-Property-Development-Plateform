/**
 * Condition type values mirroring the backend ConditionType enum.
 */
export enum ConditionType {
  PreCommencement = 'PreCommencement',
  PreOccupation = 'PreOccupation',
  DuringConstruction = 'DuringConstruction',
  Compliance = 'Compliance'
}

/**
 * Condition status values mirroring the backend ConditionStatus enum.
 */
export enum ConditionStatus {
  Outstanding = 'Outstanding',
  SubmittedForDischarge = 'SubmittedForDischarge',
  Discharged = 'Discharged',
  Rejected = 'Rejected'
}

/**
 * Full planning condition entity returned from the API.
 */
export interface IPlanningCondition {
  readonly id: string;
  readonly applicationId: string;
  readonly conditionNumber: number;
  readonly description: string;
  readonly conditionType: string;
  readonly status: string;
  readonly dischargeDate: string | null;
  readonly dischargeReference: string | null;
  readonly dueDate: string | null;
  readonly createdAt: string;
}

/**
 * Payload for creating a new planning condition.
 */
export interface ICreateCondition {
  readonly conditionNumber: number;
  readonly description: string;
  readonly conditionType: string;
  readonly dueDate?: string | null;
}

/**
 * Payload for transitioning a condition status.
 */
export interface ITransitionConditionStatus {
  readonly newStatus: string;
  readonly dischargeDate?: string | null;
  readonly dischargeReference?: string | null;
}
