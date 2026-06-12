import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { map, exhaustMap, catchError, tap } from 'rxjs/operators';
import { LegalCasesActions } from './legal-cases.actions';
import { LegalCaseService } from '../../services/legal-case.service';
import { ToastService } from '@core/services/toast.service';
import { ILegalCaseListItem } from '../../models';

/**
 * NgRx effects for the legal cases feature.
 * Handles all side effects including API calls and toast notifications on error.
 */
@Injectable()
export class LegalCasesEffects {
  private readonly actions$ = inject(Actions);
  private readonly legalCaseService = inject(LegalCaseService);
  private readonly toastService = inject(ToastService);

  /**
   * Load legal cases from the API with optional filtering parameters.
   */
  readonly loadLegalCases$ = createEffect(() =>
    this.actions$.pipe(
      ofType(LegalCasesActions.loadLegalCases),
      exhaustMap(({ params }) =>
        this.legalCaseService.getAll(params).pipe(
          map((response) =>
            LegalCasesActions.loadLegalCasesSuccess({
              cases: response.data?.items ?? []
            })
          ),
          catchError((error: { message: string }) =>
            of(LegalCasesActions.loadLegalCasesFailure({ error: error.message }))
          )
        )
      )
    )
  );

  /**
   * Create a new legal case via API.
   * Maps the full ILegalCase response to ILegalCaseListItem for the store.
   */
  readonly createLegalCase$ = createEffect(() =>
    this.actions$.pipe(
      ofType(LegalCasesActions.createLegalCase),
      exhaustMap(({ legalCase }) =>
        this.legalCaseService.create(legalCase).pipe(
          map((response) => {
            const created = response.data!;
            const listItem: ILegalCaseListItem = {
              id: created.id,
              caseReference: created.caseReference,
              title: created.title,
              caseType: created.caseType,
              status: created.status,
              priority: created.priority,
              assignedSolicitor: created.assignedSolicitor,
              solicitorFirm: created.solicitorFirm,
              opportunityId: created.opportunityId,
              planningApplicationId: created.planningApplicationId,
              createdAt: created.createdAt
            };
            return LegalCasesActions.createLegalCaseSuccess({ legalCase: listItem });
          }),
          catchError((error: { message: string }) =>
            of(LegalCasesActions.createLegalCaseFailure({ error: error.message }))
          )
        )
      )
    )
  );

  /**
   * Update an existing legal case via API.
   * Maps the full ILegalCase response to ILegalCaseListItem for the store.
   */
  readonly updateLegalCase$ = createEffect(() =>
    this.actions$.pipe(
      ofType(LegalCasesActions.updateLegalCase),
      exhaustMap(({ id, changes }) =>
        this.legalCaseService.update(id, changes).pipe(
          map((response) => {
            const updated = response.data!;
            const listItem: ILegalCaseListItem = {
              id: updated.id,
              caseReference: updated.caseReference,
              title: updated.title,
              caseType: updated.caseType,
              status: updated.status,
              priority: updated.priority,
              assignedSolicitor: updated.assignedSolicitor,
              solicitorFirm: updated.solicitorFirm,
              opportunityId: updated.opportunityId,
              planningApplicationId: updated.planningApplicationId,
              createdAt: updated.createdAt
            };
            return LegalCasesActions.updateLegalCaseSuccess({ legalCase: listItem });
          }),
          catchError((error: { message: string }) =>
            of(LegalCasesActions.updateLegalCaseFailure({ error: error.message }))
          )
        )
      )
    )
  );

  /**
   * Transition legal case status via API.
   * Maps the full ILegalCase response to ILegalCaseListItem for the store.
   */
  readonly transitionLegalCaseStatus$ = createEffect(() =>
    this.actions$.pipe(
      ofType(LegalCasesActions.transitionLegalCaseStatus),
      exhaustMap(({ id, transition }) =>
        this.legalCaseService.transitionStatus(id, transition).pipe(
          map((response) => {
            const transitioned = response.data!;
            const listItem: ILegalCaseListItem = {
              id: transitioned.id,
              caseReference: transitioned.caseReference,
              title: transitioned.title,
              caseType: transitioned.caseType,
              status: transitioned.status,
              priority: transitioned.priority,
              assignedSolicitor: transitioned.assignedSolicitor,
              solicitorFirm: transitioned.solicitorFirm,
              opportunityId: transitioned.opportunityId,
              planningApplicationId: transitioned.planningApplicationId,
              createdAt: transitioned.createdAt
            };
            return LegalCasesActions.transitionLegalCaseStatusSuccess({ legalCase: listItem });
          }),
          catchError((error: { message: string }) =>
            of(LegalCasesActions.transitionLegalCaseStatusFailure({ error: error.message }))
          )
        )
      )
    )
  );

  /**
   * Load the pipeline view (cases grouped by status) from API.
   */
  readonly loadPipeline$ = createEffect(() =>
    this.actions$.pipe(
      ofType(LegalCasesActions.loadPipeline),
      exhaustMap(() =>
        this.legalCaseService.getPipeline().pipe(
          map((response) =>
            LegalCasesActions.loadPipelineSuccess({
              pipeline: response.data ?? []
            })
          ),
          catchError((error: { message: string }) =>
            of(LegalCasesActions.loadPipelineFailure({ error: error.message }))
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
          LegalCasesActions.loadLegalCasesFailure,
          LegalCasesActions.createLegalCaseFailure,
          LegalCasesActions.updateLegalCaseFailure,
          LegalCasesActions.transitionLegalCaseStatusFailure,
          LegalCasesActions.loadPipelineFailure
        ),
        tap(({ error }) => {
          this.toastService.showError(error);
        })
      ),
    { dispatch: false }
  );
}
