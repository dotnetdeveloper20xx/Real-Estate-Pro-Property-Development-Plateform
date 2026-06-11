import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { DashboardService } from '../../services/dashboard.service';
import { DashboardActions } from './dashboard.actions';

/**
 * NgRx effects for the dashboard feature.
 * Handles API calls for loading KPI metrics and recent activity.
 */
@Injectable()
export class DashboardEffects {
  private readonly actions$ = inject(Actions);
  private readonly dashboardService = inject(DashboardService);

  /**
   * Effect: Load dashboard KPI metrics from the API.
   * Uses switchMap since only the latest request matters (navigating back to dashboard).
   */
  readonly loadMetrics$ = createEffect(() =>
    this.actions$.pipe(
      ofType(DashboardActions.loadMetrics),
      switchMap(() =>
        this.dashboardService.getMetrics().pipe(
          map((metrics) => DashboardActions.loadMetricsSuccess({ metrics })),
          catchError((error: { message: string }) =>
            of(DashboardActions.loadMetricsFailure({ error: error.message }))
          )
        )
      )
    )
  );

  /**
   * Effect: Load recent activity feed from the API.
   * Uses switchMap to cancel stale requests on repeated navigation.
   */
  readonly loadActivity$ = createEffect(() =>
    this.actions$.pipe(
      ofType(DashboardActions.loadActivity),
      switchMap(() =>
        this.dashboardService.getRecentActivity().pipe(
          map((activity) => DashboardActions.loadActivitySuccess({ activity })),
          catchError((error: { message: string }) =>
            of(DashboardActions.loadActivityFailure({ error: error.message }))
          )
        )
      )
    )
  );
}
