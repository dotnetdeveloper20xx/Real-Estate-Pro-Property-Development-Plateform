import { createActionGroup, emptyProps, props } from '@ngrx/store';
import {
  IComplianceRequirement,
  IComplianceChecklistItem,
  IComplianceStatusSummary,
  ICreateComplianceRequirement,
  IUpdateComplianceRequirement,
  IRetireComplianceRequirement,
  IComplianceCheck,
  ICreateComplianceCheck
} from '../../models';
import { IComplianceRequirementQueryParams, IComplianceCheckQueryParams } from '../../services';

/**
 * NgRx action group for compliance requirement state management.
 * Follows the [Source] Event pattern for action naming.
 */
export const ComplianceRequirementActions = createActionGroup({
  source: 'Compliance Requirements',
  events: {
    /** Trigger loading of compliance requirements (paginated/filtered) */
    'Load Requirements': props<{ params?: IComplianceRequirementQueryParams }>(),
    /** Successfully loaded requirements from API */
    'Load Requirements Success': props<{ requirements: readonly IComplianceRequirement[] }>(),
    /** Failed to load requirements */
    'Load Requirements Failure': props<{ error: string }>(),

    /** Trigger loading of the compliance checklist view */
    'Load Checklist': emptyProps(),
    /** Successfully loaded checklist data */
    'Load Checklist Success': props<{ checklist: readonly IComplianceChecklistItem[] }>(),
    /** Failed to load checklist */
    'Load Checklist Failure': props<{ error: string }>(),

    /** Trigger loading of the compliance status summary */
    'Load Status Summary': emptyProps(),
    /** Successfully loaded status summary */
    'Load Status Summary Success': props<{ summary: readonly IComplianceStatusSummary[] }>(),
    /** Failed to load status summary */
    'Load Status Summary Failure': props<{ error: string }>(),

    /** Trigger creation of a new compliance requirement */
    'Create Requirement': props<{ requirement: ICreateComplianceRequirement }>(),
    /** Successfully created a requirement */
    'Create Requirement Success': props<{ requirement: IComplianceRequirement }>(),
    /** Failed to create a requirement */
    'Create Requirement Failure': props<{ error: string }>(),

    /** Trigger update of an existing compliance requirement */
    'Update Requirement': props<{ id: string; changes: IUpdateComplianceRequirement }>(),
    /** Successfully updated a requirement */
    'Update Requirement Success': props<{ requirement: IComplianceRequirement }>(),
    /** Failed to update a requirement */
    'Update Requirement Failure': props<{ error: string }>(),

    /** Trigger retirement of a compliance requirement */
    'Retire Requirement': props<{ id: string; payload: IRetireComplianceRequirement }>(),
    /** Successfully retired a requirement */
    'Retire Requirement Success': props<{ requirement: IComplianceRequirement }>(),
    /** Failed to retire a requirement */
    'Retire Requirement Failure': props<{ error: string }>(),

    /** Select a requirement (for detail view navigation) */
    'Select Requirement': props<{ id: string | null }>(),
  }
});

/**
 * NgRx action group for compliance check state management.
 * Follows the [Source] Event pattern for action naming.
 */
export const ComplianceCheckActions = createActionGroup({
  source: 'Compliance Checks',
  events: {
    /** Trigger loading of compliance checks for a specific requirement */
    'Load Checks': props<{ requirementId: string; params?: IComplianceCheckQueryParams }>(),
    /** Successfully loaded checks from API */
    'Load Checks Success': props<{ checks: readonly IComplianceCheck[]; totalCount: number }>(),
    /** Failed to load checks */
    'Load Checks Failure': props<{ error: string }>(),

    /** Trigger creation of a new compliance check */
    'Create Check': props<{ check: ICreateComplianceCheck }>(),
    /** Successfully created a check */
    'Create Check Success': props<{ check: IComplianceCheck }>(),
    /** Failed to create a check */
    'Create Check Failure': props<{ error: string }>(),
  }
});
