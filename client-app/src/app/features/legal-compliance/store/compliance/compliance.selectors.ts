import { createFeatureSelector, createSelector } from '@ngrx/store';
import { ComplianceState } from './compliance.state';
import { requirementAdapter, checkAdapter } from './compliance.reducer';
import {
  IComplianceRequirement,
  IComplianceChecklistItem,
  IComplianceStatusSummary,
  ComplianceCategory,
  ComplianceRequirementStatus
} from '../../models';
import { ComplianceCheckOutcome } from '../../models';

/**
 * Compliance status color indicator for UI rendering.
 * Maps to Tailwind/DaisyUI color classes in the component layer.
 */
export type ComplianceStatusColor = 'green' | 'amber' | 'red' | 'grey';

/**
 * Checklist item enriched with a computed color indicator.
 */
export interface IColorCodedChecklistItem extends IComplianceChecklistItem {
  readonly statusColor: ComplianceStatusColor;
}

/**
 * Feature selector for the compliance state slice.
 */
export const selectComplianceState = createFeatureSelector<ComplianceState>('compliance');

// ──────────────────────────────────────────────
// Requirements Selectors
// ──────────────────────────────────────────────

/**
 * Select the requirements sub-state.
 */
export const selectRequirementState = createSelector(
  selectComplianceState,
  (state: ComplianceState) => state.requirements
);

/**
 * Entity adapter selectors for normalized requirements.
 */
const { selectAll: selectAllRequirements, selectEntities: selectRequirementEntities } =
  requirementAdapter.getSelectors();

/**
 * Select all compliance requirements as an array.
 */
export const selectAllComplianceRequirements = createSelector(
  selectRequirementState,
  selectAllRequirements
);

/**
 * Select the requirements entity dictionary.
 */
export const selectComplianceRequirementEntities = createSelector(
  selectRequirementState,
  selectRequirementEntities
);

/**
 * Select only active compliance requirements.
 */
export const selectActiveRequirements = createSelector(
  selectAllComplianceRequirements,
  (requirements: IComplianceRequirement[]) =>
    requirements.filter((r) => r.status === ComplianceRequirementStatus.Active)
);

/**
 * Select the currently selected requirement ID.
 */
export const selectSelectedRequirementId = createSelector(
  selectRequirementState,
  (state) => state.selectedId
);

/**
 * Select the currently selected requirement entity.
 */
export const selectSelectedRequirement = createSelector(
  selectComplianceRequirementEntities,
  selectSelectedRequirementId,
  (entities, selectedId): IComplianceRequirement | undefined =>
    selectedId ? entities[selectedId] : undefined
);

/**
 * Select a requirement by its ID.
 */
export const selectRequirementById = (id: string) =>
  createSelector(
    selectComplianceRequirementEntities,
    (entities): IComplianceRequirement | undefined => entities[id]
  );

/**
 * Select the requirements loading state.
 */
export const selectRequirementsLoading = createSelector(
  selectRequirementState,
  (state) => state.loading
);

/**
 * Select the requirements error message.
 */
export const selectRequirementsError = createSelector(
  selectRequirementState,
  (state) => state.error
);

// ──────────────────────────────────────────────
// Checklist Selectors
// ──────────────────────────────────────────────

/**
 * Select raw checklist items from state.
 */
export const selectChecklist = createSelector(
  selectRequirementState,
  (state) => state.checklist
);

/**
 * Select whether checklist data is loading.
 */
export const selectChecklistLoading = createSelector(
  selectRequirementState,
  (state) => state.checklistLoading
);

/**
 * Determine the compliance status color for a checklist item.
 *
 * Color logic per Requirement 20.2:
 * - green: Compliant (last check passed AND next check not due)
 * - amber: Due Soon (next check due within 7 days)
 * - red: Overdue (next check date has passed)
 * - grey: Not Yet Checked (no last check date)
 */
export function getComplianceStatusColor(item: IComplianceChecklistItem): ComplianceStatusColor {
  // No check ever performed
  if (!item.lastCheckDate) {
    return 'grey';
  }

  // Overdue takes highest priority
  if (item.isOverdue) {
    return 'red';
  }

  // Due soon: next check due within 7 days
  if (item.nextDueDate) {
    const now = new Date();
    const nextDue = new Date(item.nextDueDate);
    const daysUntilDue = Math.ceil(
      (nextDue.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysUntilDue <= 7 && daysUntilDue >= 0) {
      return 'amber';
    }
  }

  // Compliant: last check passed and not overdue/due soon
  if (item.lastCheckOutcome === ComplianceCheckOutcome.Compliant) {
    return 'green';
  }

  // Non-compliant or partially compliant but not overdue
  if (
    item.lastCheckOutcome === ComplianceCheckOutcome.NonCompliant ||
    item.lastCheckOutcome === ComplianceCheckOutcome.PartiallyCompliant
  ) {
    return 'red';
  }

  // Default (e.g., NotApplicable with a check recorded)
  return 'grey';
}

/**
 * Select checklist items enriched with color-coded status indicators.
 * Implements Requirement 20.2 color logic.
 */
export const selectColorCodedChecklist = createSelector(
  selectChecklist,
  (checklist): readonly IColorCodedChecklistItem[] =>
    checklist.map((item) => ({
      ...item,
      statusColor: getComplianceStatusColor(item)
    }))
);

/**
 * Select checklist items filtered by a specific category.
 */
export const selectChecklistByCategory = (category: ComplianceCategory) =>
  createSelector(
    selectColorCodedChecklist,
    (items): readonly IColorCodedChecklistItem[] =>
      items.filter((item) => item.category === category)
  );

// ──────────────────────────────────────────────
// Status Summary Selectors
// ──────────────────────────────────────────────

/**
 * Select the compliance status summary.
 */
export const selectStatusSummary = createSelector(
  selectRequirementState,
  (state) => state.statusSummary
);

/**
 * Select whether the status summary is loading.
 */
export const selectStatusSummaryLoading = createSelector(
  selectRequirementState,
  (state) => state.statusSummaryLoading
);

/**
 * Select total compliance requirement count across all categories.
 */
export const selectTotalRequirementCount = createSelector(
  selectStatusSummary,
  (summary: readonly IComplianceStatusSummary[]) =>
    summary.reduce((total, cat) => total + cat.total, 0)
);

/**
 * Select total compliant count across all categories.
 */
export const selectTotalCompliantCount = createSelector(
  selectStatusSummary,
  (summary: readonly IComplianceStatusSummary[]) =>
    summary.reduce((total, cat) => total + cat.compliant, 0)
);

/**
 * Select total overdue count across all categories.
 */
export const selectTotalOverdueCount = createSelector(
  selectStatusSummary,
  (summary: readonly IComplianceStatusSummary[]) =>
    summary.reduce((total, cat) => total + cat.overdue, 0)
);

/**
 * Select total due soon count across all categories.
 */
export const selectTotalDueSoonCount = createSelector(
  selectStatusSummary,
  (summary: readonly IComplianceStatusSummary[]) =>
    summary.reduce((total, cat) => total + cat.dueSoon, 0)
);

/**
 * Select the overall compliance rate as a percentage (0-100).
 * Calculated as (compliant / total) * 100.
 */
export const selectComplianceRate = createSelector(
  selectTotalRequirementCount,
  selectTotalCompliantCount,
  (total, compliant): number => (total > 0 ? Math.round((compliant / total) * 100) : 0)
);

/**
 * Select status summary for a specific category.
 */
export const selectStatusSummaryByCategory = (category: ComplianceCategory) =>
  createSelector(
    selectStatusSummary,
    (summary): IComplianceStatusSummary | undefined =>
      summary.find((s) => s.category === category)
  );

// ──────────────────────────────────────────────
// Overdue Selectors
// ──────────────────────────────────────────────

/**
 * Select checklist items that are overdue.
 */
export const selectOverdueChecklistItems = createSelector(
  selectColorCodedChecklist,
  (items): readonly IColorCodedChecklistItem[] =>
    items.filter((item) => item.statusColor === 'red')
);

/**
 * Select count of overdue checklist items.
 */
export const selectOverdueCount = createSelector(
  selectOverdueChecklistItems,
  (items): number => items.length
);

/**
 * Select checklist items that are due soon (amber).
 */
export const selectDueSoonChecklistItems = createSelector(
  selectColorCodedChecklist,
  (items): readonly IColorCodedChecklistItem[] =>
    items.filter((item) => item.statusColor === 'amber')
);

// ──────────────────────────────────────────────
// Checks Selectors
// ──────────────────────────────────────────────

/**
 * Select the checks sub-state.
 */
export const selectCheckState = createSelector(
  selectComplianceState,
  (state: ComplianceState) => state.checks
);

/**
 * Entity adapter selectors for normalized checks.
 */
const { selectAll: selectAllChecks } = checkAdapter.getSelectors();

/**
 * Select all compliance checks as an array.
 */
export const selectAllComplianceChecks = createSelector(
  selectCheckState,
  selectAllChecks
);

/**
 * Select the checks loading state.
 */
export const selectChecksLoading = createSelector(
  selectCheckState,
  (state) => state.loading
);

/**
 * Select the checks error message.
 */
export const selectChecksError = createSelector(
  selectCheckState,
  (state) => state.error
);

/**
 * Select total count of checks for pagination.
 */
export const selectChecksTotalCount = createSelector(
  selectCheckState,
  (state) => state.totalCount
);
