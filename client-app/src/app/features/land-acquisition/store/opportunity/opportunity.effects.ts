import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { map, exhaustMap, catchError, tap } from 'rxjs/operators';
import { OpportunityActions } from './opportunity.actions';
import { OpportunityService } from '../../services/opportunity.service';
import { ToastService } from '@core/services/toast.service';
import { IOpportunityListItem } from '../../models/opportunity.model';

/**
 * NgRx effects for the opportunity feature.
 * Handles all side effects including API calls and toast notifications on error.
 */
@Injectable()
export class OpportunityEffects {
  private readonly actions$ = inject(Actions);
  private readonly opportunityService = inject(OpportunityService);
  private readonly toastService = inject(ToastService);

  /**
   * Load all opportunities from the API.
   */
  readonly loadOpportunities$ = createEffect(() =>
    this.actions$.pipe(
      ofType(OpportunityActions.loadOpportunities),
      exhaustMap(() =>
        this.opportunityService.getAll().pipe(
          map((response) =>
            OpportunityActions.loadOpportunitiesSuccess({
              opportunities: response.data ?? []
            })
          ),
          catchError((error: { message: string }) =>
            of(OpportunityActions.loadOpportunitiesFailure({ error: error.message }))
          )
        )
      )
    )
  );

  /**
   * Create a new opportunity via API.
   * Maps the full IOpportunity response to IOpportunityListItem for the store.
   */
  readonly createOpportunity$ = createEffect(() =>
    this.actions$.pipe(
      ofType(OpportunityActions.createOpportunity),
      exhaustMap(({ opportunity }) =>
        this.opportunityService.create(opportunity).pipe(
          map((response) => {
            const created = response.data!;
            const listItem: IOpportunityListItem = {
              id: created.id,
              name: created.name,
              location: created.location,
              landSize: created.landSize,
              status: created.status,
              source: created.source,
              expectedAcquisition: created.expectedAcquisition,
              createdAt: created.createdAt
            };
            return OpportunityActions.createOpportunitySuccess({ opportunity: listItem });
          }),
          catchError((error: { message: string }) =>
            of(OpportunityActions.createOpportunityFailure({ error: error.message }))
          )
        )
      )
    )
  );

  /**
   * Update an existing opportunity via API.
   * Maps the full IOpportunity response to IOpportunityListItem for the store.
   */
  readonly updateOpportunity$ = createEffect(() =>
    this.actions$.pipe(
      ofType(OpportunityActions.updateOpportunity),
      exhaustMap(({ id, changes }) =>
        this.opportunityService.update(id, changes).pipe(
          map((response) => {
            const updated = response.data!;
            const listItem: IOpportunityListItem = {
              id: updated.id,
              name: updated.name,
              location: updated.location,
              landSize: updated.landSize,
              status: updated.status,
              source: updated.source,
              expectedAcquisition: updated.expectedAcquisition,
              createdAt: updated.createdAt
            };
            return OpportunityActions.updateOpportunitySuccess({ opportunity: listItem });
          }),
          catchError((error: { message: string }) =>
            of(OpportunityActions.updateOpportunityFailure({ error: error.message }))
          )
        )
      )
    )
  );

  /**
   * Soft-delete an opportunity via API.
   */
  readonly deleteOpportunity$ = createEffect(() =>
    this.actions$.pipe(
      ofType(OpportunityActions.deleteOpportunity),
      exhaustMap(({ id }) =>
        this.opportunityService.delete(id).pipe(
          map(() => OpportunityActions.deleteOpportunitySuccess({ id })),
          catchError((error: { message: string }) =>
            of(OpportunityActions.deleteOpportunityFailure({ error: error.message }))
          )
        )
      )
    )
  );

  /**
   * Transition opportunity status via API.
   * Maps the full IOpportunity response to IOpportunityListItem for the store.
   */
  readonly transitionStatus$ = createEffect(() =>
    this.actions$.pipe(
      ofType(OpportunityActions.transitionStatus),
      exhaustMap(({ id, targetStatus, reason }) =>
        this.opportunityService
          .transitionStatus(id, { newStatus: targetStatus, withdrawalReason: reason })
          .pipe(
            map((response) => {
              const transitioned = response.data!;
              const listItem: IOpportunityListItem = {
                id: transitioned.id,
                name: transitioned.name,
                location: transitioned.location,
                landSize: transitioned.landSize,
                status: transitioned.status,
                source: transitioned.source,
                expectedAcquisition: transitioned.expectedAcquisition,
                createdAt: transitioned.createdAt
              };
              return OpportunityActions.transitionStatusSuccess({ opportunity: listItem });
            }),
            catchError((error: { message: string }) =>
              of(OpportunityActions.transitionStatusFailure({ error: error.message }))
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
          OpportunityActions.loadOpportunitiesFailure,
          OpportunityActions.createOpportunityFailure,
          OpportunityActions.updateOpportunityFailure,
          OpportunityActions.deleteOpportunityFailure,
          OpportunityActions.transitionStatusFailure
        ),
        tap(({ error }) => {
          this.toastService.showError(error);
        })
      ),
    { dispatch: false }
  );

  /**
   * Show toast notification on successful CRUD operations.
   */
  readonly showSuccessToast$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(
          OpportunityActions.createOpportunitySuccess,
          OpportunityActions.updateOpportunitySuccess,
          OpportunityActions.deleteOpportunitySuccess,
          OpportunityActions.transitionStatusSuccess
        ),
        tap((action) => {
          if (action.type.includes('Create')) {
            this.toastService.showSuccess('Opportunity created successfully.');
          } else if (action.type.includes('Update')) {
            this.toastService.showSuccess('Opportunity updated successfully.');
          } else if (action.type.includes('Delete')) {
            this.toastService.showSuccess('Opportunity deleted successfully.');
          } else if (action.type.includes('Transition')) {
            this.toastService.showSuccess('Status updated successfully.');
          }
        })
      ),
    { dispatch: false }
  );
}
