import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { map, exhaustMap, catchError, tap } from 'rxjs/operators';
import { AuditRecordActions } from './audit-records.actions';
import { AuditRecordService } from '../../services/audit-record.service';
import { ToastService } from '@core/services/toast.service';
import { IAuditRecordListItem } from '../../models/audit-record.model';

/**
 * NgRx effects for the audit record feature.
 * Handles all side effects including API calls and toast notifications on error.
 */
@Injectable()
export class AuditRecordEffects {
  private readonly actions$ = inject(Actions);
  private readonly auditRecordService = inject(AuditRecordService);
  private readonly toastService = inject(ToastService);

  /**
   * Load all audit records from the API.
   */
  readonly loadAuditRecords$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuditRecordActions.loadAuditRecords),
      exhaustMap(() =>
        this.auditRecordService.getAll().pipe(
          map((response) =>
            AuditRecordActions.loadAuditRecordsSuccess({
              auditRecords: response.data?.items ?? []
            })
          ),
          catchError((error: { message: string }) =>
            of(AuditRecordActions.loadAuditRecordsFailure({ error: error.message }))
          )
        )
      )
    )
  );

  /**
   * Create a new audit record via API.
   * Maps the full IAuditRecord response to IAuditRecordListItem for the store.
   */
  readonly createAuditRecord$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuditRecordActions.createAuditRecord),
      exhaustMap(({ auditRecord }) =>
        this.auditRecordService.create(auditRecord).pipe(
          map((response) => {
            const created = response.data!;
            const listItem: IAuditRecordListItem = {
              id: created.id,
              auditType: created.auditType,
              scope: created.scope,
              auditorName: created.auditorName,
              auditDate: created.auditDate,
              status: created.status,
              riskRating: created.riskRating,
              isOverdue: created.isOverdue,
              actionDueDate: created.actionDueDate
            };
            return AuditRecordActions.createAuditRecordSuccess({ auditRecord: listItem });
          }),
          catchError((error: { message: string }) =>
            of(AuditRecordActions.createAuditRecordFailure({ error: error.message }))
          )
        )
      )
    )
  );

  /**
   * Transition audit record status via API.
   * Maps the full IAuditRecord response to IAuditRecordListItem for the store.
   */
  readonly transitionStatus$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuditRecordActions.transitionStatus),
      exhaustMap(({ id, transition }) =>
        this.auditRecordService.transitionStatus(id, transition).pipe(
          map((response) => {
            const transitioned = response.data!;
            const listItem: IAuditRecordListItem = {
              id: transitioned.id,
              auditType: transitioned.auditType,
              scope: transitioned.scope,
              auditorName: transitioned.auditorName,
              auditDate: transitioned.auditDate,
              status: transitioned.status,
              riskRating: transitioned.riskRating,
              isOverdue: transitioned.isOverdue,
              actionDueDate: transitioned.actionDueDate
            };
            return AuditRecordActions.transitionStatusSuccess({ auditRecord: listItem });
          }),
          catchError((error: { message: string }) =>
            of(AuditRecordActions.transitionStatusFailure({ error: error.message }))
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
          AuditRecordActions.loadAuditRecordsFailure,
          AuditRecordActions.createAuditRecordFailure,
          AuditRecordActions.transitionStatusFailure
        ),
        tap(({ error }) => {
          this.toastService.showError(error);
        })
      ),
    { dispatch: false }
  );
}
