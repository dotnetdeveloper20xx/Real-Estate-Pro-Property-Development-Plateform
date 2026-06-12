import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { map, exhaustMap, catchError, tap } from 'rxjs/operators';
import { InsuranceActions } from './insurance.actions';
import { InsuranceService } from '../../services/insurance.service';
import { ToastService } from '@core/services/toast.service';
import { IInsuranceRecordListItem } from '../../models/insurance-record.model';

/**
 * NgRx effects for the insurance feature.
 * Handles all side effects including API calls and toast notifications on error.
 */
@Injectable()
export class InsuranceEffects {
  private readonly actions$ = inject(Actions);
  private readonly insuranceService = inject(InsuranceService);
  private readonly toastService = inject(ToastService);

  /**
   * Load all insurance records from the API.
   */
  readonly loadInsuranceRecords$ = createEffect(() =>
    this.actions$.pipe(
      ofType(InsuranceActions.loadInsuranceRecords),
      exhaustMap(({ params }) =>
        this.insuranceService.getAll(params).pipe(
          map((response) => {
            const pagedResult = response.data;
            const records = pagedResult?.items ?? [];
            const pagination = {
              totalCount: pagedResult?.totalCount ?? 0,
              currentPage: pagedResult?.page ?? 1,
              pageSize: pagedResult?.pageSize ?? 10,
              totalPages: pagedResult?.totalPages ?? 0
            };
            return InsuranceActions.loadInsuranceRecordsSuccess({ records, pagination });
          }),
          catchError((error: { message: string }) =>
            of(InsuranceActions.loadInsuranceRecordsFailure({ error: error.message }))
          )
        )
      )
    )
  );

  /**
   * Create a new insurance record via API.
   * Maps the full IInsuranceRecord response to IInsuranceRecordListItem for the store.
   */
  readonly createInsuranceRecord$ = createEffect(() =>
    this.actions$.pipe(
      ofType(InsuranceActions.createInsuranceRecord),
      exhaustMap(({ record }) =>
        this.insuranceService.create(record).pipe(
          map((response) => {
            const created = response.data!;
            const listItem: IInsuranceRecordListItem = {
              id: created.id,
              policyNumber: created.policyNumber,
              insurer: created.insurer,
              coverageType: created.coverageType,
              coverAmount: created.coverAmount,
              premium: created.premium,
              currency: created.currency,
              startDate: created.startDate,
              expiryDate: created.expiryDate,
              status: created.status,
              legalCaseId: created.legalCaseId
            };
            return InsuranceActions.createInsuranceRecordSuccess({ record: listItem });
          }),
          catchError((error: { message: string }) =>
            of(InsuranceActions.createInsuranceRecordFailure({ error: error.message }))
          )
        )
      )
    )
  );

  /**
   * Update an existing insurance record via API.
   * Maps the full IInsuranceRecord response to IInsuranceRecordListItem for the store.
   */
  readonly updateInsuranceRecord$ = createEffect(() =>
    this.actions$.pipe(
      ofType(InsuranceActions.updateInsuranceRecord),
      exhaustMap(({ id, changes }) =>
        this.insuranceService.update(id, changes).pipe(
          map((response) => {
            const updated = response.data!;
            const listItem: IInsuranceRecordListItem = {
              id: updated.id,
              policyNumber: updated.policyNumber,
              insurer: updated.insurer,
              coverageType: updated.coverageType,
              coverAmount: updated.coverAmount,
              premium: updated.premium,
              currency: updated.currency,
              startDate: updated.startDate,
              expiryDate: updated.expiryDate,
              status: updated.status,
              legalCaseId: updated.legalCaseId
            };
            return InsuranceActions.updateInsuranceRecordSuccess({ record: listItem });
          }),
          catchError((error: { message: string }) =>
            of(InsuranceActions.updateInsuranceRecordFailure({ error: error.message }))
          )
        )
      )
    )
  );

  /**
   * Transition insurance record status via API.
   * Maps the full IInsuranceRecord response to IInsuranceRecordListItem for the store.
   */
  readonly transitionInsuranceStatus$ = createEffect(() =>
    this.actions$.pipe(
      ofType(InsuranceActions.transitionInsuranceStatus),
      exhaustMap(({ id, payload }) =>
        this.insuranceService.transitionStatus(id, payload).pipe(
          map((response) => {
            const transitioned = response.data!;
            const listItem: IInsuranceRecordListItem = {
              id: transitioned.id,
              policyNumber: transitioned.policyNumber,
              insurer: transitioned.insurer,
              coverageType: transitioned.coverageType,
              coverAmount: transitioned.coverAmount,
              premium: transitioned.premium,
              currency: transitioned.currency,
              startDate: transitioned.startDate,
              expiryDate: transitioned.expiryDate,
              status: transitioned.status,
              legalCaseId: transitioned.legalCaseId
            };
            return InsuranceActions.transitionInsuranceStatusSuccess({ record: listItem });
          }),
          catchError((error: { message: string }) =>
            of(InsuranceActions.transitionInsuranceStatusFailure({ error: error.message }))
          )
        )
      )
    )
  );

  /**
   * Renew an insurance record via API.
   * The API returns the newly created renewal record which is added to the store.
   */
  readonly renewInsuranceRecord$ = createEffect(() =>
    this.actions$.pipe(
      ofType(InsuranceActions.renewInsuranceRecord),
      exhaustMap(({ id, payload }) =>
        this.insuranceService.renew(id, payload).pipe(
          map((response) => {
            const renewed = response.data!;
            const listItem: IInsuranceRecordListItem = {
              id: renewed.id,
              policyNumber: renewed.policyNumber,
              insurer: renewed.insurer,
              coverageType: renewed.coverageType,
              coverAmount: renewed.coverAmount,
              premium: renewed.premium,
              currency: renewed.currency,
              startDate: renewed.startDate,
              expiryDate: renewed.expiryDate,
              status: renewed.status,
              legalCaseId: renewed.legalCaseId
            };
            return InsuranceActions.renewInsuranceRecordSuccess({ record: listItem });
          }),
          catchError((error: { message: string }) =>
            of(InsuranceActions.renewInsuranceRecordFailure({ error: error.message }))
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
          InsuranceActions.loadInsuranceRecordsFailure,
          InsuranceActions.createInsuranceRecordFailure,
          InsuranceActions.updateInsuranceRecordFailure,
          InsuranceActions.transitionInsuranceStatusFailure,
          InsuranceActions.renewInsuranceRecordFailure
        ),
        tap(({ error }) => {
          this.toastService.showError(error);
        })
      ),
    { dispatch: false }
  );
}
