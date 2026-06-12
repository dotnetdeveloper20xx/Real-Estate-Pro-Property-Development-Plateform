import { createFeatureSelector, createSelector } from '@ngrx/store';
import { LegalCasesState } from './legal-cases.state';
import { legalCasesAdapter } from './legal-cases.reducer';
import {
  ILegalCaseListItem,
  ILegalCasePipeline,
  LegalCaseStatus,
  LegalCaseType,
  LegalCasePriority
} from '../../models';

/**
 * Feature selector for the legal cases state slice.
 */
export const selectLegalCasesState = createFeatureSelector<LegalCasesState>('legalCases');

/**
 * Entity adapter selectors for normalized state access.
 */
const { selectAll, selectEntities, selectTotal } = legalCasesAdapter.getSelectors();

/**
 * Select all legal cases as an array, sorted by the adapter's sortComparer.
 */
export const selectAllLegalCases = createSelector(
  selectLegalCasesState,
  selectAll
);

/**
 * Select the legal case entities dictionary (id → entity).
 */
export const selectLegalCaseEntities = createSelector(
  selectLegalCasesState,
  selectEntities
);

/**
 * Select the total count of legal cases in the store.
 */
export const selectLegalCasesTotal = createSelector(
  selectLegalCasesState,
  selectTotal
);

/**
 * Select the currently selected legal case ID.
 */
export const selectSelectedLegalCaseId = createSelector(
  selectLegalCasesState,
  (state: LegalCasesState) => state.selectedId
);

/**
 * Select the currently selected legal case entity.
 */
export const selectSelectedLegalCase = createSelector(
  selectLegalCaseEntities,
  selectSelectedLegalCaseId,
  (entities, selectedId): ILegalCaseListItem | undefined =>
    selectedId ? entities[selectedId] : undefined
);

/**
 * Select a legal case by its ID.
 */
export const selectLegalCaseById = (id: string) =>
  createSelector(
    selectLegalCaseEntities,
    (entities): ILegalCaseListItem | undefined => entities[id]
  );

/**
 * Select the loading state indicator.
 */
export const selectLegalCasesLoading = createSelector(
  selectLegalCasesState,
  (state: LegalCasesState) => state.loading
);

/**
 * Select the current error message (null if no error).
 */
export const selectLegalCasesError = createSelector(
  selectLegalCasesState,
  (state: LegalCasesState) => state.error
);

/**
 * Select the pipeline data (cases grouped by status for kanban board).
 */
export const selectLegalCasesPipeline = createSelector(
  selectLegalCasesState,
  (state: LegalCasesState) => state.pipeline
);

/**
 * Select the pipeline loading state.
 */
export const selectLegalCasesPipelineLoading = createSelector(
  selectLegalCasesState,
  (state: LegalCasesState) => state.pipelineLoading
);

/**
 * Select legal cases grouped by status from the local entity state.
 * Useful for pipeline view when local data is sufficient.
 */
export const selectLegalCasesGroupedByStatus = createSelector(
  selectAllLegalCases,
  (cases): Record<LegalCaseStatus, readonly ILegalCaseListItem[]> => {
    const grouped: Record<LegalCaseStatus, ILegalCaseListItem[]> = {
      [LegalCaseStatus.Open]: [],
      [LegalCaseStatus.InProgress]: [],
      [LegalCaseStatus.UnderReview]: [],
      [LegalCaseStatus.OnHold]: [],
      [LegalCaseStatus.Escalated]: [],
      [LegalCaseStatus.Resolved]: [],
      [LegalCaseStatus.Closed]: [],
      [LegalCaseStatus.Reopened]: []
    };

    for (const legalCase of cases) {
      if (grouped[legalCase.status]) {
        grouped[legalCase.status].push(legalCase);
      }
    }

    return grouped;
  }
);

/**
 * Select legal cases filtered by a specific status.
 */
export const selectLegalCasesByStatus = (status: LegalCaseStatus) =>
  createSelector(
    selectAllLegalCases,
    (cases): readonly ILegalCaseListItem[] =>
      cases.filter((c) => c.status === status)
  );

/**
 * Select legal cases filtered by a specific case type.
 */
export const selectLegalCasesByType = (caseType: LegalCaseType) =>
  createSelector(
    selectAllLegalCases,
    (cases): readonly ILegalCaseListItem[] =>
      cases.filter((c) => c.caseType === caseType)
  );

/**
 * Select legal cases filtered by a specific priority.
 */
export const selectLegalCasesByPriority = (priority: LegalCasePriority) =>
  createSelector(
    selectAllLegalCases,
    (cases): readonly ILegalCaseListItem[] =>
      cases.filter((c) => c.priority === priority)
  );

/**
 * Select count of open cases (status not Closed or Resolved).
 */
export const selectOpenLegalCasesCount = createSelector(
  selectAllLegalCases,
  (cases): number =>
    cases.filter(
      (c) => c.status !== LegalCaseStatus.Closed && c.status !== LegalCaseStatus.Resolved
    ).length
);

/**
 * Select count of high/critical priority cases that are not closed.
 */
export const selectHighPriorityCasesCount = createSelector(
  selectAllLegalCases,
  (cases): number =>
    cases.filter(
      (c) =>
        (c.priority === LegalCasePriority.High || c.priority === LegalCasePriority.Critical) &&
        c.status !== LegalCaseStatus.Closed &&
        c.status !== LegalCaseStatus.Resolved
    ).length
);

/**
 * Select escalated cases count.
 */
export const selectEscalatedCasesCount = createSelector(
  selectAllLegalCases,
  (cases): number =>
    cases.filter((c) => c.status === LegalCaseStatus.Escalated).length
);
