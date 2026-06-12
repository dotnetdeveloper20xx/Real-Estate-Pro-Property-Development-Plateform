import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { map, exhaustMap, catchError, tap } from 'rxjs/operators';
import { ApplicationActions } from './application.actions';
import { PlanningApplicationService } from '../../services/planning-application.service';
import { ToastService } from '@core/services/toast.service';
import { IApplicationListItem } from '../../models/planning-application.model';

/**
 * NgRx effects for the planning applications feature.
 * Handles all side effects including API calls and toast notifications on error.
 */
@Injectable()
export class ApplicationEffects {
  private readonly actions$ = inject(Actions);
  private readonly applicationService = inject(PlanningApplicationService);
  private readonly toastService = inject(ToastService);

  /**
   * Load all planning applications from the API.
   */
  readonly loadApplications$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ApplicationActions.loadApplications),
      exhaustMap(() =>
        this.applicationService.getAll().pipe(
          map((response) =>
            ApplicationActions.loadApplicationsSuccess({
              applications: response.data?.items ?? []
            })
          ),
          catchError((error: { message: string }) =>
            of(ApplicationActions.loadApplicationsFailure({ error: error.message }))
          )
        )
      )
    )
  );

  /**
   * Create a new planning application via API.
   * Maps the full IPlanningApplication response to IApplicationListItem for the store.
   */
  readonly createApplication$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ApplicationActions.createApplication),
      exhaustMap(({ application }) =>
        this.applicationService.create(application).pipe(
          map((response) => {
            const created = response.data!;
            const listItem: IApplicationListItem = {
              id: created.id,
              opportunityId: created.opportunityId,
              description: created.description,
              applicationType: created.applicationType,
              status: created.status,
              applicationReference: created.applicationReference,
              councilName: created.councilName,
              landOpportunityName: null,
              submissionDate: created.submissionDate,
              targetDecisionDate: created.targetDecisionDate,
              createdAt: created.createdAt
            };
            return ApplicationActions.createApplicationSuccess({ application: listItem });
          }),
          catchError((error: { message: string }) =>
            of(ApplicationActions.createApplicationFailure({ error: error.message }))
          )
        )
      )
    )
  );

  /**
   * Update an existing planning application via API.
   * Maps the full IPlanningApplication response to IApplicationListItem for the store.
   */
  readonly updateApplication$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ApplicationActions.updateApplication),
      exhaustMap(({ id, changes }) =>
        this.applicationService.update(id, changes).pipe(
          map((response) => {
            const updated = response.data!;
            const listItem: IApplicationListItem = {
              id: updated.id,
              opportunityId: updated.opportunityId,
              description: updated.description,
              applicationType: updated.applicationType,
              status: updated.status,
              applicationReference: updated.applicationReference,
              councilName: updated.councilName,
              landOpportunityName: null,
              submissionDate: updated.submissionDate,
              targetDecisionDate: updated.targetDecisionDate,
              createdAt: updated.createdAt
            };
            return ApplicationActions.updateApplicationSuccess({ application: listItem });
          }),
          catchError((error: { message: string }) =>
            of(ApplicationActions.updateApplicationFailure({ error: error.message }))
          )
        )
      )
    )
  );

  /**
   * Soft-delete a planning application via API.
   */
  readonly deleteApplication$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ApplicationActions.deleteApplication),
      exhaustMap(({ id }) =>
        this.applicationService.update(id, {} as never).pipe(
          map(() => ApplicationActions.deleteApplicationSuccess({ id })),
          catchError((error: { message: string }) =>
            of(ApplicationActions.deleteApplicationFailure({ error: error.message }))
          )
        )
      )
    )
  );

  /**
   * Transition planning application status via API.
   * Maps the full IPlanningApplication response to IApplicationListItem for the store.
   */
  readonly transitionStatus$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ApplicationActions.transitionStatus),
      exhaustMap(({ id, payload }) =>
        this.applicationService.transitionStatus(id, payload).pipe(
          map((response) => {
            const transitioned = response.data!;
            const listItem: IApplicationListItem = {
              id: transitioned.id,
              opportunityId: transitioned.opportunityId,
              description: transitioned.description,
              applicationType: transitioned.applicationType,
              status: transitioned.status,
              applicationReference: transitioned.applicationReference,
              councilName: transitioned.councilName,
              landOpportunityName: null,
              submissionDate: transitioned.submissionDate,
              targetDecisionDate: transitioned.targetDecisionDate,
              createdAt: transitioned.createdAt
            };
            return ApplicationActions.transitionStatusSuccess({ application: listItem });
          }),
          catchError((error: { message: string }) =>
            of(ApplicationActions.transitionStatusFailure({ error: error.message }))
          )
        )
      )
    )
  );

  /**
   * Show toast notification on any failure action.
   */
  readonly showErrorToast$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(
          ApplicationActions.loadApplicationsFailure,
          ApplicationActions.createApplicationFailure,
          ApplicationActions.updateApplicationFailure,
          ApplicationActions.deleteApplicationFailure,
          ApplicationActions.transitionStatusFailure
        ),
        tap(({ error }) => {
          this.toastService.showError(error);
        })
      ),
    { dispatch: false }
  );
}
