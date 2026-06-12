import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { PlanningDashboardService } from '../../services/planning-dashboard.service';
import { DashboardActions } from './dashboard.actions';

/**
 * NgRx effects for the planning dashboard feature.
 * Handles the API call for loading combined dashboard data.
 */
@Injectable()
export class DashboardEffects {
  private readonly actions$ = inject(Actions);
  private readonly dashboardService = inject(PlanningDashboardService);

  /**
   * Effect: Load planning dashboard metrics from the API.
   * Uses switchMap since only the latest request matters (navigating back to dashboard).
   */
  readonly loadDashboard$ = createEffect(() =>
    this.actions$.pipe(
      ofType(DashboardActions.loadDashboard),
      switchMap(() =>
        this.dashboardService.getDashboard().pipe(
          map((metrics) => DashboardActions.loadDashboardSuccess({ metrics })),
          catchError((error: { message: string }) =>
            of(DashboardActions.loadDashboardFailure({
              error: error.message ?? 'Failed to load dashboard data'
            }))
          )
        )
      )
    )
  );
}
