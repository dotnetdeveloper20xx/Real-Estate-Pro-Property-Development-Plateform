import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { map, exhaustMap, catchError, tap } from 'rxjs/operators';
import { DashboardActions } from './dashboard.actions';
import { DashboardService } from '../../services/dashboard.service';
import { ToastService } from '@core/services/toast.service';

/**
 * NgRx effects for the legal compliance dashboard feature.
 * Handles the API call to load dashboard KPI data and error notifications.
 */
@Injectable()
export class DashboardEffects {
  private readonly actions$ = inject(Actions);
  private readonly dashboardService = inject(DashboardService);
  private readonly toastService = inject(ToastService);

  /**
   * Load the full dashboard KPI data from the API.
   */
  readonly loadDashboard$ = createEffect(() =>
    this.actions$.pipe(
      ofType(DashboardActions.loadDashboard),
      exhaustMap(() =>
        this.dashboardService.getDashboard().pipe(
          map((response) =>
            DashboardActions.loadDashboardSuccess({
              data: response.data!
            })
          ),
          catchError((error: { message: string }) =>
            of(DashboardActions.loadDashboardFailure({ error: error.message }))
          )
        )
      )
    )
  );

  /**
   * Show toast notification on dashboard load failure.
   */
  readonly showErrorToast$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(DashboardActions.loadDashboardFailure),
        tap(({ error }) => {
          this.toastService.showError(error);
        })
      ),
    { dispatch: false }
  );
}
