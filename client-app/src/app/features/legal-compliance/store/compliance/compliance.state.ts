import { EntityState } from '@ngrx/entity';
import {
  IComplianceRequirement,
  IComplianceChecklistItem,
  IComplianceStatusSummary
} from '../../models';
import { IComplianceCheck } from '../../models';

/**
 * NgRx state interface for compliance requirements.
 * Uses @ngrx/entity EntityState for normalized storage.
 */
export interface ComplianceRequirementState extends EntityState<IComplianceRequirement> {
  /** Indicates whether an API call is in progress */
  readonly loading: boolean;
  /** Stores the latest error message from a failed API call */
  readonly error: string | null;
  /** The currently selected requirement ID (for detail views) */
  readonly selectedId: string | null;
  /** Checklist view data with last check info and overdue status */
  readonly checklist: readonly IComplianceChecklistItem[];
  /** Whether checklist data is currently loading */
  readonly checklistLoading: boolean;
  /** Status summary grouped by category */
  readonly statusSummary: readonly IComplianceStatusSummary[];
  /** Whether status summary is currently loading */
  readonly statusSummaryLoading: boolean;
}

/**
 * NgRx state interface for compliance checks.
 * Uses @ngrx/entity EntityState for normalized storage.
 */
export interface ComplianceCheckState extends EntityState<IComplianceCheck> {
  /** Indicates whether an API call is in progress */
  readonly loading: boolean;
  /** Stores the latest error message from a failed API call */
  readonly error: string | null;
  /** Total count for the current paginated query */
  readonly totalCount: number;
}

/**
 * Combined compliance state holding both requirements and checks.
 */
export interface ComplianceState {
  readonly requirements: ComplianceRequirementState;
  readonly checks: ComplianceCheckState;
}
