import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { map, exhaustMap, catchError, tap } from 'rxjs/operators';
import { ContractActions } from './contracts.actions';
import { ContractService } from '../../services/contract.service';
import { ToastService } from '@core/services/toast.service';
import { IContractListItem } from '../../models/contract.model';

/**
 * NgRx effects for the contracts feature.
 * Handles all side effects including API calls and toast notifications on error.
 */
@Injectable()
export class ContractsEffects {
  private readonly actions$ = inject(Actions);
  private readonly contractService = inject(ContractService);
  private readonly toastService = inject(ToastService);

  /**
   * Load contracts from the API with optional query parameters.
   */
  readonly loadContracts$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ContractActions.loadContracts),
      exhaustMap(({ params }) =>
        this.contractService.getAll(params).pipe(
          map((response) => {
            const pagedResult = response.data;
            return ContractActions.loadContractsSuccess({
              contracts: pagedResult?.items ?? [],
              totalCount: pagedResult?.totalCount ?? 0,
              page: pagedResult?.page ?? 1,
              pageSize: pagedResult?.pageSize ?? 10
            });
          }),
          catchError((error: { message: string }) =>
            of(ContractActions.loadContractsFailure({ error: error.message }))
          )
        )
      )
    )
  );

  /**
   * Load contract register view from the API.
   */
  readonly loadRegister$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ContractActions.loadRegister),
      exhaustMap(({ params }) =>
        this.contractService.getRegister(params).pipe(
          map((response) => {
            const pagedResult = response.data;
            // Map register items to list items for unified entity state
            const contracts: IContractListItem[] = (pagedResult?.items ?? []).map((item) => ({
              id: item.id,
              contractReference: item.contractReference,
              title: item.title,
              contractType: item.contractType,
              status: item.status,
              counterpartyName: item.counterpartyName,
              contractValue: item.contractValue,
              currency: item.currency,
              startDate: item.startDate,
              endDate: item.endDate,
              legalCaseId: '', // Not available in register view
              caseReference: item.caseReference,
              createdAt: item.startDate // Use start date as proxy for register view
            }));
            return ContractActions.loadRegisterSuccess({
              contracts,
              totalCount: pagedResult?.totalCount ?? 0,
              page: pagedResult?.page ?? 1,
              pageSize: pagedResult?.pageSize ?? 10
            });
          }),
          catchError((error: { message: string }) =>
            of(ContractActions.loadRegisterFailure({ error: error.message }))
          )
        )
      )
    )
  );

  /**
   * Create a new contract via API.
   * Maps the full IContract response to IContractListItem for the store.
   */
  readonly createContract$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ContractActions.createContract),
      exhaustMap(({ contract }) =>
        this.contractService.create(contract).pipe(
          map((response) => {
            const created = response.data!;
            const listItem: IContractListItem = {
              id: created.id,
              contractReference: created.contractReference,
              title: created.title,
              contractType: created.contractType,
              status: created.status,
              counterpartyName: created.counterpartyName,
              contractValue: created.contractValue,
              currency: created.currency,
              startDate: created.startDate,
              endDate: created.endDate,
              legalCaseId: created.legalCaseId,
              caseReference: '', // Will be populated on next load
              createdAt: created.createdAt
            };
            return ContractActions.createContractSuccess({ contract: listItem });
          }),
          catchError((error: { message: string }) =>
            of(ContractActions.createContractFailure({ error: error.message }))
          )
        )
      )
    )
  );

  /**
   * Update an existing contract via API.
   * Maps the full IContract response to IContractListItem for the store.
   */
  readonly updateContract$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ContractActions.updateContract),
      exhaustMap(({ id, changes }) =>
        this.contractService.update(id, changes).pipe(
          map((response) => {
            const updated = response.data!;
            const listItem: IContractListItem = {
              id: updated.id,
              contractReference: updated.contractReference,
              title: updated.title,
              contractType: updated.contractType,
              status: updated.status,
              counterpartyName: updated.counterpartyName,
              contractValue: updated.contractValue,
              currency: updated.currency,
              startDate: updated.startDate,
              endDate: updated.endDate,
              legalCaseId: updated.legalCaseId,
              caseReference: '', // Will be populated on next load
              createdAt: updated.createdAt
            };
            return ContractActions.updateContractSuccess({ contract: listItem });
          }),
          catchError((error: { message: string }) =>
            of(ContractActions.updateContractFailure({ error: error.message }))
          )
        )
      )
    )
  );

  /**
   * Transition contract status via API.
   * Maps the full IContract response to IContractListItem for the store.
   */
  readonly transitionStatus$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ContractActions.transitionStatus),
      exhaustMap(({ id, transition }) =>
        this.contractService.transitionStatus(id, transition).pipe(
          map((response) => {
            const transitioned = response.data!;
            const listItem: IContractListItem = {
              id: transitioned.id,
              contractReference: transitioned.contractReference,
              title: transitioned.title,
              contractType: transitioned.contractType,
              status: transitioned.status,
              counterpartyName: transitioned.counterpartyName,
              contractValue: transitioned.contractValue,
              currency: transitioned.currency,
              startDate: transitioned.startDate,
              endDate: transitioned.endDate,
              legalCaseId: transitioned.legalCaseId,
              caseReference: '', // Will be populated on next load
              createdAt: transitioned.createdAt
            };
            return ContractActions.transitionStatusSuccess({ contract: listItem });
          }),
          catchError((error: { message: string }) =>
            of(ContractActions.transitionStatusFailure({ error: error.message }))
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
          ContractActions.loadContractsFailure,
          ContractActions.loadRegisterFailure,
          ContractActions.createContractFailure,
          ContractActions.updateContractFailure,
          ContractActions.transitionStatusFailure
        ),
        tap(({ error }) => {
          this.toastService.showError(error);
        })
      ),
    { dispatch: false }
  );
}
