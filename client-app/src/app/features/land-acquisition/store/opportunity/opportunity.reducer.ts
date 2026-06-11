import { createReducer, on } from '@ngrx/store';
import { createEntityAdapter, EntityAdapter } from '@ngrx/entity';
import { IOpportunityListItem } from '../../models/opportunity.model';
import { OpportunityState } from './opportunity.state';
import { OpportunityActions } from './opportunity.actions';

/**
 * Entity adapter for normalized opportunity state management.
 * Uses 'id' as the primary key and sorts by createdAt descending (newest first).
 */
export const opportunityAdapter: EntityAdapter<IOpportunityListItem> = createEntityAdapter<IOpportunityListItem>({
  selectId: (opportunity: IOpportunityListItem) => opportunity.id,
  sortComparer: (a: IOpportunityListItem, b: IOpportunityListItem) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
});

/**
 * Initial state using EntityAdapter's getInitialState plus custom properties.
 */
export const initialOpportunityState: OpportunityState = opportunityAdapter.getInitialState({
  loading: false,
  error: null,
  selectedId: null
});

/**
 * Opportunity reducer handling all opportunity-related actions.
 * Uses @ngrx/entity adapter methods for normalized CRUD operations.
 */
export const opportunityReducer = createReducer(
  initialOpportunityState,

  // Load
  on(OpportunityActions.loadOpportunities, (state): OpportunityState => ({
    ...state,
    loading: true,
    error: null
  })),
  on(OpportunityActions.loadOpportunitiesSuccess, (state, { opportunities }): OpportunityState =>
    opportunityAdapter.setAll([...opportunities], {
      ...state,
      loading: false,
      error: null
    })
  ),
  on(OpportunityActions.loadOpportunitiesFailure, (state, { error }): OpportunityState => ({
    ...state,
    loading: false,
    error
  })),

  // Create
  on(OpportunityActions.createOpportunity, (state): OpportunityState => ({
    ...state,
    loading: true,
    error: null
  })),
  on(OpportunityActions.createOpportunitySuccess, (state, { opportunity }): OpportunityState =>
    opportunityAdapter.addOne(opportunity, {
      ...state,
      loading: false,
      error: null
    })
  ),
  on(OpportunityActions.createOpportunityFailure, (state, { error }): OpportunityState => ({
    ...state,
    loading: false,
    error
  })),

  // Update
  on(OpportunityActions.updateOpportunity, (state): OpportunityState => ({
    ...state,
    loading: true,
    error: null
  })),
  on(OpportunityActions.updateOpportunitySuccess, (state, { opportunity }): OpportunityState =>
    opportunityAdapter.upsertOne(opportunity, {
      ...state,
      loading: false,
      error: null
    })
  ),
  on(OpportunityActions.updateOpportunityFailure, (state, { error }): OpportunityState => ({
    ...state,
    loading: false,
    error
  })),

  // Delete
  on(OpportunityActions.deleteOpportunity, (state): OpportunityState => ({
    ...state,
    loading: true,
    error: null
  })),
  on(OpportunityActions.deleteOpportunitySuccess, (state, { id }): OpportunityState =>
    opportunityAdapter.removeOne(id, {
      ...state,
      loading: false,
      error: null
    })
  ),
  on(OpportunityActions.deleteOpportunityFailure, (state, { error }): OpportunityState => ({
    ...state,
    loading: false,
    error
  })),

  // Transition Status
  on(OpportunityActions.transitionStatus, (state): OpportunityState => ({
    ...state,
    loading: true,
    error: null
  })),
  on(OpportunityActions.transitionStatusSuccess, (state, { opportunity }): OpportunityState =>
    opportunityAdapter.upsertOne(opportunity, {
      ...state,
      loading: false,
      error: null
    })
  ),
  on(OpportunityActions.transitionStatusFailure, (state, { error }): OpportunityState => ({
    ...state,
    loading: false,
    error
  })),

  // Select
  on(OpportunityActions.selectOpportunity, (state, { id }): OpportunityState => ({
    ...state,
    selectedId: id
  }))
);
