import { createFeatureSelector, createSelector } from '@ngrx/store';
import { OpportunityState } from './opportunity.state';
import { opportunityAdapter } from './opportunity.reducer';
import { IOpportunityListItem, OpportunityStatus } from '../../models/opportunity.model';

/**
 * Feature selector for the opportunity state slice.
 */
export const selectOpportunityState = createFeatureSelector<OpportunityState>('opportunities');

/**
 * Entity adapter selectors for normalized state access.
 */
const { selectAll, selectEntities } = opportunityAdapter.getSelectors();

/**
 * Select all opportunities as an array, sorted by the adapter's sortComparer.
 */
export const selectAllOpportunities = createSelector(
  selectOpportunityState,
  selectAll
);

/**
 * Select the opportunity entities dictionary (id → entity).
 */
export const selectOpportunityEntities = createSelector(
  selectOpportunityState,
  selectEntities
);

/**
 * Select the currently selected opportunity ID.
 */
export const selectSelectedOpportunityId = createSelector(
  selectOpportunityState,
  (state: OpportunityState) => state.selectedId
);

/**
 * Select the currently selected opportunity entity.
 */
export const selectSelectedOpportunity = createSelector(
  selectOpportunityEntities,
  selectSelectedOpportunityId,
  (entities, selectedId): IOpportunityListItem | undefined =>
    selectedId ? entities[selectedId] : undefined
);

/**
 * Select an opportunity by its ID.
 */
export const selectOpportunityById = (id: string) =>
  createSelector(
    selectOpportunityEntities,
    (entities): IOpportunityListItem | undefined => entities[id]
  );

/**
 * Select opportunities grouped by status for the pipeline view.
 * Returns a record mapping each OpportunityStatus to an array of opportunities.
 */
export const selectOpportunitiesByStatus = createSelector(
  selectAllOpportunities,
  (opportunities): Record<OpportunityStatus, readonly IOpportunityListItem[]> => {
    const grouped: Record<OpportunityStatus, IOpportunityListItem[]> = {
      [OpportunityStatus.Identified]: [],
      [OpportunityStatus.InitialReview]: [],
      [OpportunityStatus.DueDiligence]: [],
      [OpportunityStatus.OfferMade]: [],
      [OpportunityStatus.UnderContract]: [],
      [OpportunityStatus.Acquired]: [],
      [OpportunityStatus.Withdrawn]: []
    };

    for (const opportunity of opportunities) {
      grouped[opportunity.status].push(opportunity);
    }

    return grouped;
  }
);

/**
 * Select the loading state indicator.
 */
export const selectOpportunityLoading = createSelector(
  selectOpportunityState,
  (state: OpportunityState) => state.loading
);

/**
 * Select the current error message (null if no error).
 */
export const selectOpportunityError = createSelector(
  selectOpportunityState,
  (state: OpportunityState) => state.error
);
