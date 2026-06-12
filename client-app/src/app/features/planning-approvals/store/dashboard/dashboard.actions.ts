import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { IDashboardMetrics } from '../../models/dashboard-metrics.model';

/**
 * NgRx action group for the planning dashboard store slice.
 * Covers loading the combined dashboard data (KPIs, pipeline, activity, deadlines).
 */
export const DashboardActions = createActionGroup({
  source: 'Planning Dashboard',
  events: {
    /** Trigger loading of all dashboard data */
    'Load Dashboard': emptyProps(),

    /** Dashboard data loaded successfully from API */
    'Load Dashboard Success': props<{ metrics: IDashboardMetrics }>(),

    /** Dashboard data loading failed */
    'Load Dashboard Failure': props<{ error: string }>(),
  }
});
