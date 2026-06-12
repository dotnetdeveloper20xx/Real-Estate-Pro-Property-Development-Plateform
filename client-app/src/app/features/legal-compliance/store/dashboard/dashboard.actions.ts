import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { IDashboardData } from '../../models';

/**
 * NgRx action group for the legal compliance dashboard state management.
 * Follows the [Source] Event pattern for action naming.
 */
export const DashboardActions = createActionGroup({
  source: 'Legal Dashboard',
  events: {
    /** Trigger loading of the legal compliance dashboard KPI data */
    'Load Dashboard': emptyProps(),
    /** Successfully loaded dashboard data from API */
    'Load Dashboard Success': props<{ data: IDashboardData }>(),
    /** Failed to load dashboard data */
    'Load Dashboard Failure': props<{ error: string }>(),
  }
});
