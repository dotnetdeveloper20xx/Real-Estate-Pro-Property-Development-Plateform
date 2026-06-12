import { createReducer, on } from '@ngrx/store';
import { createEntityAdapter, EntityAdapter } from '@ngrx/entity';
import { ILegalCaseListItem } from '../../models';
import { LegalCasesState } from './legal-cases.state';
import { LegalCasesActions } from './legal-cases.actions';

/**
 * Entity adapter for normalized legal cases state management.
 * Uses 'id' as the primary key and sorts by createdAt descending (newest first).
 */
export const legalCasesAdapter: EntityAdapter<ILegalCaseListItem> = createEntityAdapter<ILegalCaseListItem>({
  selectId: (legalCase: ILegalCaseListItem) => legalCase.id,
  sortComparer: (a: ILegalCaseListItem, b: ILegalCaseListItem) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
});

/**
 * Initial state using EntityAdapter's getInitialState plus custom properties.
 */
export const initialLegalCasesState: LegalCasesState = legalCasesAdapter.getInitialState({
  loading: false,
  error: null,
  selectedId: null,
  pipeline: null,
  pipelineLoading: false
});

/**
 * Legal Cases reducer handling all legal case-related actions.
 * Uses @ngrx/entity adapter methods for normalized CRUD operations.
 */
export const legalCasesReducer = createReducer(
  initialLegalCasesState,

  // Load Legal Cases
  on(LegalCasesActions.loadLegalCases, (state): LegalCasesState => ({
    ...state,
    loading: true,
    error: null
  })),
  on(LegalCasesActions.loadLegalCasesSuccess, (state, { cases }): LegalCasesState =>
    legalCasesAdapter.setAll([...cases], {
      ...state,
      loading: false,
      error: null
    })
  ),
  on(LegalCasesActions.loadLegalCasesFailure, (state, { error }): LegalCasesState => ({
    ...state,
    loading: false,
    error
  })),

  // Create Legal Case
  on(LegalCasesActions.createLegalCase, (state): LegalCasesState => ({
    ...state,
    loading: true,
    error: null
  })),
  on(LegalCasesActions.createLegalCaseSuccess, (state, { legalCase }): LegalCasesState =>
    legalCasesAdapter.addOne(legalCase, {
      ...state,
      loading: false,
      error: null
    })
  ),
  on(LegalCasesActions.createLegalCaseFailure, (state, { error }): LegalCasesState => ({
    ...state,
    loading: false,
    error
  })),

  // Update Legal Case
  on(LegalCasesActions.updateLegalCase, (state): LegalCasesState => ({
    ...state,
    loading: true,
    error: null
  })),
  on(LegalCasesActions.updateLegalCaseSuccess, (state, { legalCase }): LegalCasesState =>
    legalCasesAdapter.upsertOne(legalCase, {
      ...state,
      loading: false,
      error: null
    })
  ),
  on(LegalCasesActions.updateLegalCaseFailure, (state, { error }): LegalCasesState => ({
    ...state,
    loading: false,
    error
  })),

  // Transition Status
  on(LegalCasesActions.transitionLegalCaseStatus, (state): LegalCasesState => ({
    ...state,
    loading: true,
    error: null
  })),
  on(LegalCasesActions.transitionLegalCaseStatusSuccess, (state, { legalCase }): LegalCasesState =>
    legalCasesAdapter.upsertOne(legalCase, {
      ...state,
      loading: false,
      error: null
    })
  ),
  on(LegalCasesActions.transitionLegalCaseStatusFailure, (state, { error }): LegalCasesState => ({
    ...state,
    loading: false,
    error
  })),

  // Load Pipeline
  on(LegalCasesActions.loadPipeline, (state): LegalCasesState => ({
    ...state,
    pipelineLoading: true,
    error: null
  })),
  on(LegalCasesActions.loadPipelineSuccess, (state, { pipeline }): LegalCasesState => ({
    ...state,
    pipeline,
    pipelineLoading: false,
    error: null
  })),
  on(LegalCasesActions.loadPipelineFailure, (state, { error }): LegalCasesState => ({
    ...state,
    pipelineLoading: false,
    error
  })),

  // Select
  on(LegalCasesActions.selectLegalCase, (state, { id }): LegalCasesState => ({
    ...state,
    selectedId: id
  }))
);
