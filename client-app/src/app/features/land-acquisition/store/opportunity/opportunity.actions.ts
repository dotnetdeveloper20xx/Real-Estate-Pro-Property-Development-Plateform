import { createActionGroup, emptyProps, props } from '@ngrx/store';
import {
  IOpportunityListItem,
  ICreateOpportunity,
  IUpdateOpportunity,
  OpportunityStatus
} from '../../models/opportunity.model';

/**
 * NgRx action group for opportunity state management.
 * Follows the [Source] Event pattern for action naming.
 */
export const OpportunityActions = createActionGroup({
  source: 'Opportunities',
  events: {
    /** Trigger loading of all opportunities */
    'Load Opportunities': emptyProps(),
    /** Successfully loaded opportunities from API */
    'Load Opportunities Success': props<{ opportunities: readonly IOpportunityListItem[] }>(),
    /** Failed to load opportunities */
    'Load Opportunities Failure': props<{ error: string }>(),

    /** Trigger creation of a new opportunity */
    'Create Opportunity': props<{ opportunity: ICreateOpportunity }>(),
    /** Successfully created an opportunity */
    'Create Opportunity Success': props<{ opportunity: IOpportunityListItem }>(),
    /** Failed to create an opportunity */
    'Create Opportunity Failure': props<{ error: string }>(),

    /** Trigger update of an existing opportunity */
    'Update Opportunity': props<{ id: string; changes: IUpdateOpportunity }>(),
    /** Successfully updated an opportunity */
    'Update Opportunity Success': props<{ opportunity: IOpportunityListItem }>(),
    /** Failed to update an opportunity */
    'Update Opportunity Failure': props<{ error: string }>(),

    /** Trigger soft deletion of an opportunity */
    'Delete Opportunity': props<{ id: string }>(),
    /** Successfully deleted an opportunity */
    'Delete Opportunity Success': props<{ id: string }>(),
    /** Failed to delete an opportunity */
    'Delete Opportunity Failure': props<{ error: string }>(),

    /** Trigger a status transition on an opportunity */
    'Transition Status': props<{ id: string; targetStatus: OpportunityStatus; reason?: string }>(),
    /** Successfully transitioned status */
    'Transition Status Success': props<{ opportunity: IOpportunityListItem }>(),
    /** Failed to transition status */
    'Transition Status Failure': props<{ error: string }>(),

    /** Select an opportunity (for detail view navigation) */
    'Select Opportunity': props<{ id: string | null }>(),
  }
});
