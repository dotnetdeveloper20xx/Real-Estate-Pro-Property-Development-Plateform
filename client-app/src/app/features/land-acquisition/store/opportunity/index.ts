export { OpportunityState } from './opportunity.state';
export { OpportunityActions } from './opportunity.actions';
export { opportunityReducer, opportunityAdapter, initialOpportunityState } from './opportunity.reducer';
export { OpportunityEffects } from './opportunity.effects';
export {
  selectOpportunityState,
  selectAllOpportunities,
  selectOpportunityEntities,
  selectSelectedOpportunityId,
  selectSelectedOpportunity,
  selectOpportunityById,
  selectOpportunitiesByStatus,
  selectOpportunityLoading,
  selectOpportunityError
} from './opportunity.selectors';
