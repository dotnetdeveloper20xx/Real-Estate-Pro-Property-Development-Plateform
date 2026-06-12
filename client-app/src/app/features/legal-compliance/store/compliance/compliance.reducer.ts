import { createReducer, on } from '@ngrx/store';
import { createEntityAdapter, EntityAdapter } from '@ngrx/entity';
import { IComplianceRequirement, IComplianceCheck } from '../../models';
import {
  ComplianceState,
  ComplianceRequirementState,
  ComplianceCheckState
} from './compliance.state';
import { ComplianceRequirementActions, ComplianceCheckActions } from './compliance.actions';

/**
 * Entity adapter for normalized compliance requirement state.
 * Sorted by name alphabetically for consistent display.
 */
export const requirementAdapter: EntityAdapter<IComplianceRequirement> =
  createEntityAdapter<IComplianceRequirement>({
    selectId: (requirement: IComplianceRequirement) => requirement.id,
    sortComparer: (a: IComplianceRequirement, b: IComplianceRequirement) =>
      a.name.localeCompare(b.name)
  });

/**
 * Entity adapter for normalized compliance check state.
 * Sorted by checkDate descending (newest first).
 */
export const checkAdapter: EntityAdapter<IComplianceCheck> =
  createEntityAdapter<IComplianceCheck>({
    selectId: (check: IComplianceCheck) => check.id,
    sortComparer: (a: IComplianceCheck, b: IComplianceCheck) =>
      new Date(b.checkDate).getTime() - new Date(a.checkDate).getTime()
  });

/**
 * Initial state for compliance requirements using EntityAdapter.
 */
export const initialRequirementState: ComplianceRequirementState =
  requirementAdapter.getInitialState({
    loading: false,
    error: null,
    selectedId: null,
    checklist: [],
    checklistLoading: false,
    statusSummary: [],
    statusSummaryLoading: false
  });

/**
 * Initial state for compliance checks using EntityAdapter.
 */
export const initialCheckState: ComplianceCheckState = checkAdapter.getInitialState({
  loading: false,
  error: null,
  totalCount: 0
});

/**
 * Combined initial state for the compliance feature.
 */
export const initialComplianceState: ComplianceState = {
  requirements: initialRequirementState,
  checks: initialCheckState
};

/**
 * Compliance reducer handling all compliance requirement and check actions.
 * Uses @ngrx/entity adapter methods for normalized CRUD operations.
 */
export const complianceReducer = createReducer(
  initialComplianceState,

  // ──────────────────────────────────────────────
  // Requirements — Load
  // ──────────────────────────────────────────────
  on(ComplianceRequirementActions.loadRequirements, (state): ComplianceState => ({
    ...state,
    requirements: {
      ...state.requirements,
      loading: true,
      error: null
    }
  })),
  on(ComplianceRequirementActions.loadRequirementsSuccess, (state, { requirements }): ComplianceState => ({
    ...state,
    requirements: requirementAdapter.setAll([...requirements], {
      ...state.requirements,
      loading: false,
      error: null
    })
  })),
  on(ComplianceRequirementActions.loadRequirementsFailure, (state, { error }): ComplianceState => ({
    ...state,
    requirements: {
      ...state.requirements,
      loading: false,
      error
    }
  })),

  // ──────────────────────────────────────────────
  // Requirements — Load Checklist
  // ──────────────────────────────────────────────
  on(ComplianceRequirementActions.loadChecklist, (state): ComplianceState => ({
    ...state,
    requirements: {
      ...state.requirements,
      checklistLoading: true,
      error: null
    }
  })),
  on(ComplianceRequirementActions.loadChecklistSuccess, (state, { checklist }): ComplianceState => ({
    ...state,
    requirements: {
      ...state.requirements,
      checklist,
      checklistLoading: false
    }
  })),
  on(ComplianceRequirementActions.loadChecklistFailure, (state, { error }): ComplianceState => ({
    ...state,
    requirements: {
      ...state.requirements,
      checklistLoading: false,
      error
    }
  })),

  // ──────────────────────────────────────────────
  // Requirements — Load Status Summary
  // ──────────────────────────────────────────────
  on(ComplianceRequirementActions.loadStatusSummary, (state): ComplianceState => ({
    ...state,
    requirements: {
      ...state.requirements,
      statusSummaryLoading: true,
      error: null
    }
  })),
  on(ComplianceRequirementActions.loadStatusSummarySuccess, (state, { summary }): ComplianceState => ({
    ...state,
    requirements: {
      ...state.requirements,
      statusSummary: summary,
      statusSummaryLoading: false
    }
  })),
  on(ComplianceRequirementActions.loadStatusSummaryFailure, (state, { error }): ComplianceState => ({
    ...state,
    requirements: {
      ...state.requirements,
      statusSummaryLoading: false,
      error
    }
  })),

  // ──────────────────────────────────────────────
  // Requirements — Create
  // ──────────────────────────────────────────────
  on(ComplianceRequirementActions.createRequirement, (state): ComplianceState => ({
    ...state,
    requirements: {
      ...state.requirements,
      loading: true,
      error: null
    }
  })),
  on(ComplianceRequirementActions.createRequirementSuccess, (state, { requirement }): ComplianceState => ({
    ...state,
    requirements: requirementAdapter.addOne(requirement, {
      ...state.requirements,
      loading: false,
      error: null
    })
  })),
  on(ComplianceRequirementActions.createRequirementFailure, (state, { error }): ComplianceState => ({
    ...state,
    requirements: {
      ...state.requirements,
      loading: false,
      error
    }
  })),

  // ──────────────────────────────────────────────
  // Requirements — Update
  // ──────────────────────────────────────────────
  on(ComplianceRequirementActions.updateRequirement, (state): ComplianceState => ({
    ...state,
    requirements: {
      ...state.requirements,
      loading: true,
      error: null
    }
  })),
  on(ComplianceRequirementActions.updateRequirementSuccess, (state, { requirement }): ComplianceState => ({
    ...state,
    requirements: requirementAdapter.upsertOne(requirement, {
      ...state.requirements,
      loading: false,
      error: null
    })
  })),
  on(ComplianceRequirementActions.updateRequirementFailure, (state, { error }): ComplianceState => ({
    ...state,
    requirements: {
      ...state.requirements,
      loading: false,
      error
    }
  })),

  // ──────────────────────────────────────────────
  // Requirements — Retire
  // ──────────────────────────────────────────────
  on(ComplianceRequirementActions.retireRequirement, (state): ComplianceState => ({
    ...state,
    requirements: {
      ...state.requirements,
      loading: true,
      error: null
    }
  })),
  on(ComplianceRequirementActions.retireRequirementSuccess, (state, { requirement }): ComplianceState => ({
    ...state,
    requirements: requirementAdapter.upsertOne(requirement, {
      ...state.requirements,
      loading: false,
      error: null
    })
  })),
  on(ComplianceRequirementActions.retireRequirementFailure, (state, { error }): ComplianceState => ({
    ...state,
    requirements: {
      ...state.requirements,
      loading: false,
      error
    }
  })),

  // ──────────────────────────────────────────────
  // Requirements — Select
  // ──────────────────────────────────────────────
  on(ComplianceRequirementActions.selectRequirement, (state, { id }): ComplianceState => ({
    ...state,
    requirements: {
      ...state.requirements,
      selectedId: id
    }
  })),

  // ──────────────────────────────────────────────
  // Checks — Load
  // ──────────────────────────────────────────────
  on(ComplianceCheckActions.loadChecks, (state): ComplianceState => ({
    ...state,
    checks: {
      ...state.checks,
      loading: true,
      error: null
    }
  })),
  on(ComplianceCheckActions.loadChecksSuccess, (state, { checks, totalCount }): ComplianceState => ({
    ...state,
    checks: checkAdapter.setAll([...checks], {
      ...state.checks,
      loading: false,
      error: null,
      totalCount
    })
  })),
  on(ComplianceCheckActions.loadChecksFailure, (state, { error }): ComplianceState => ({
    ...state,
    checks: {
      ...state.checks,
      loading: false,
      error
    }
  })),

  // ──────────────────────────────────────────────
  // Checks — Create
  // ──────────────────────────────────────────────
  on(ComplianceCheckActions.createCheck, (state): ComplianceState => ({
    ...state,
    checks: {
      ...state.checks,
      loading: true,
      error: null
    }
  })),
  on(ComplianceCheckActions.createCheckSuccess, (state, { check }): ComplianceState => ({
    ...state,
    checks: checkAdapter.addOne(check, {
      ...state.checks,
      loading: false,
      error: null,
      totalCount: state.checks.totalCount + 1
    })
  })),
  on(ComplianceCheckActions.createCheckFailure, (state, { error }): ComplianceState => ({
    ...state,
    checks: {
      ...state.checks,
      loading: false,
      error
    }
  }))
);
