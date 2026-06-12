import { createActionGroup, emptyProps, props } from '@ngrx/store';
import {
  IApplicationListItem,
  ICreateApplication,
  IUpdateApplication,
  ITransitionApplicationStatus
} from '../../models/planning-application.model';

/**
 * NgRx action group for planning application state management.
 * Follows the [Source] Event pattern for action naming.
 */
export const ApplicationActions = createActionGroup({
  source: 'Planning Applications',
  events: {
    /** Trigger loading of all planning applications */
    'Load Applications': emptyProps(),
    /** Successfully loaded applications from API */
    'Load Applications Success': props<{ applications: readonly IApplicationListItem[] }>(),
    /** Failed to load applications */
    'Load Applications Failure': props<{ error: string }>(),

    /** Trigger creation of a new planning application */
    'Create Application': props<{ application: ICreateApplication }>(),
    /** Successfully created a planning application */
    'Create Application Success': props<{ application: IApplicationListItem }>(),
    /** Failed to create a planning application */
    'Create Application Failure': props<{ error: string }>(),

    /** Trigger update of an existing planning application */
    'Update Application': props<{ id: string; changes: IUpdateApplication }>(),
    /** Successfully updated a planning application */
    'Update Application Success': props<{ application: IApplicationListItem }>(),
    /** Failed to update a planning application */
    'Update Application Failure': props<{ error: string }>(),

    /** Trigger soft deletion of a planning application */
    'Delete Application': props<{ id: string }>(),
    /** Successfully deleted a planning application */
    'Delete Application Success': props<{ id: string }>(),
    /** Failed to delete a planning application */
    'Delete Application Failure': props<{ error: string }>(),

    /** Trigger a status transition on a planning application */
    'Transition Status': props<{ id: string; payload: ITransitionApplicationStatus }>(),
    /** Successfully transitioned status */
    'Transition Status Success': props<{ application: IApplicationListItem }>(),
    /** Failed to transition status */
    'Transition Status Failure': props<{ error: string }>(),

    /** Select a planning application (for detail view navigation) */
    'Select Application': props<{ id: string | null }>(),
  }
});
