import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { DashboardService } from '../../services/dashboard.service';
import { DashboardActions } from './dashboard.actions';

/**
 * NgRx effects for the dashboard feature.
 * Handles the single API call that retrieves all dashboard data.
 */
@Injectable()
export class DashboardEffects {
  private readonly actions$ = inject(Actions);
  private readonly dashboardService = inject(DashboardService);

  /**
   * Effect: Load full dashboard data from the API.
   */
  readonly loadMetrics$ = createEffect(() =>
    this.actions$.pipe(
      ofType(DashboardActions.loadMetrics),
      switchMap(() =>
        this.dashboardService.getMetrics().pipe(
          map((response) => DashboardActions.loadMetricsSuccess({ metrics: response.data! })),
          catchError((error: { message: string }) =>
            of(DashboardActions.loadMetricsFailure({ error: error.message }))
          )
        )
      )
    )
  );
}
