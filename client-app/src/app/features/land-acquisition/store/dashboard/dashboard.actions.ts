import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { IDashboardMetrics } from '../../models/dashboard.model';

/**
 * Actions for the Land Acquisition Dashboard store slice.
 * Single load action retrieves all dashboard data in one API call.
 */
export const DashboardActions = createActionGroup({
  source: 'Dashboard',
  events: {
    /** Trigger loading of full dashboard data */
    'Load Metrics': emptyProps(),

    /** Dashboard data loaded successfully from API */
    'Load Metrics Success': props<{ metrics: IDashboardMetrics }>(),

    /** Dashboard data loading failed */
    'Load Metrics Failure': props<{ error: string }>()
  }
});
