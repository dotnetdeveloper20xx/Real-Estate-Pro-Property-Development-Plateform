import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { IDashboardMetrics, IRecentActivity } from '../../models/dashboard.model';

/**
 * Actions for the Land Acquisition Dashboard store slice.
 * Covers loading KPI metrics and recent activity data.
 */
export const DashboardActions = createActionGroup({
  source: 'Dashboard',
  events: {
    /** Trigger loading of dashboard KPI metrics */
    'Load Metrics': emptyProps(),

    /** Metrics loaded successfully from API */
    'Load Metrics Success': props<{ metrics: IDashboardMetrics }>(),

    /** Metrics loading failed */
    'Load Metrics Failure': props<{ error: string }>(),

    /** Trigger loading of recent activity feed */
    'Load Activity': emptyProps(),

    /** Activity loaded successfully from API */
    'Load Activity Success': props<{ activity: readonly IRecentActivity[] }>(),

    /** Activity loading failed */
    'Load Activity Failure': props<{ error: string }>()
  }
});
