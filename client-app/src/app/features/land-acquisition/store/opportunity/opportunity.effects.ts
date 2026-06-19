import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { of, forkJoin } from 'rxjs';
import { map, exhaustMap, catchError, tap, withLatestFrom } from 'rxjs/operators';
import { OpportunityActions } from './opportunity.actions';
import { OpportunityService, IOpportunityQueryParams } from '../../services/opportunity.service';
import { ToastService } from '@core/services/toast.service';
import { IOpportunityListItem } from '../../models/opportunity.model';
import { IPaginationMeta } from './opportunity.state';
import { selectFilters } from './opportunity.selectors';

/**
 * NgRx effects for the opportunity feature.
 * Handles all side effects including API calls and toast notifications on error.
 */
@Injectable()
export class OpportunityEffects {
  private readonly actions$ = inject(Actions);
  private readonly store = inject(Store);
  private readonly opportunityService = inject(OpportunityService);
  private readonly toastService = inject(ToastService);

  /**
   * Load all opportunities from the API.
   * Extracts pagination metadata from the response envelope.
   */
  readonly loadOpportunities$ = createEffect(() =>
    this.actions$.pipe(
      ofType(OpportunityActions.loadOpportunities),
      exhaustMap(() =>
        this.opportunityService.getAll().pipe(
          map((response) => {
            const items = response.data ?? [];
            const pagination: IPaginationMeta = response.pagination ?? {
              pageNumber: 1,
              pageSize: 20,
              totalCount: items.length,
              totalPages: items.length > 0 ? 1 : 0
            };
            return OpportunityActions.loadOpportunitiesSuccess({
              opportunities: items,
              pagination
            });
          }),
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
              createdAt: created.createdAt,
              rowVersion: created.rowVersion
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
   * Handles HTTP 409 Conflict with specific concurrency error message.
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
              createdAt: updated.createdAt,
              rowVersion: updated.rowVersion
            };
            return OpportunityActions.updateOpportunitySuccess({ opportunity: listItem });
          }),
          catchError((error: { status?: number; message: string }) => {
            const errorMessage = error.status === 409
              ? 'This record was modified by another user. Please reload and try again.'
              : error.message;
            return of(OpportunityActions.updateOpportunityFailure({ error: errorMessage }));
          })
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
          .transitionStatus(id, { targetStatus, withdrawalReason: reason })
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
                createdAt: transitioned.createdAt,
                rowVersion: transitioned.rowVersion
              };
              return OpportunityActions.transitionStatusSuccess({ opportunity: listItem });
            }),
            catchError((error: { message: string; error?: { errors?: string[] } }) =>
              of(OpportunityActions.transitionStatusFailure({
                error: error.error?.errors?.[0] ?? error.message
              }))
            )
          )
      )
    )
  );

  /**
   * Load opportunities with server-side pagination, filtering, and sorting params.
   * Maps the API response to extract both items and pagination metadata.
   */
  readonly loadOpportunitiesWithParams$ = createEffect(() =>
    this.actions$.pipe(
      ofType(OpportunityActions.loadOpportunitiesWithParams),
      exhaustMap(({ params }) =>
        this.opportunityService.getAll(params).pipe(
          map((response) => {
            const items = response.data ?? [];
            const pagination: IPaginationMeta = response.pagination ?? {
              pageNumber: params.pageNumber ?? 1,
              pageSize: params.pageSize ?? 20,
              totalCount: items.length,
              totalPages: items.length > 0 ? 1 : 0
            };
            return OpportunityActions.loadOpportunitiesSuccess({
              opportunities: items,
              pagination
            });
          }),
          catchError((error: { message: string }) =>
            of(OpportunityActions.loadOpportunitiesFailure({ error: error.message }))
          )
        )
      )
    )
  );

  /**
   * Bulk delete multiple opportunities using forkJoin.
   * Calls OpportunityService.delete() for each ID and aggregates results.
   * On all success: dispatches bulkDeleteOpportunitiesSuccess.
   * On partial failure: dispatches bulkDeleteOpportunitiesFailure with failed IDs.
   */
  readonly bulkDelete$ = createEffect(() =>
    this.actions$.pipe(
      ofType(OpportunityActions.bulkDeleteOpportunities),
      exhaustMap(({ ids }) =>
        forkJoin(
          ids.map((id) =>
            this.opportunityService.delete(id).pipe(
              map(() => ({ id, success: true as const })),
              catchError(() => of({ id, success: false as const }))
            )
          )
        ).pipe(
          map((results) => {
            const failedIds = results
              .filter((r) => !r.success)
              .map((r) => r.id);

            if (failedIds.length === 0) {
              return OpportunityActions.bulkDeleteOpportunitiesSuccess({
                ids,
                count: ids.length
              });
            }

            return OpportunityActions.bulkDeleteOpportunitiesFailure({
              error: `Failed to delete ${failedIds.length} of ${ids.length} opportunities.`,
              failedIds
            });
          })
        )
      )
    )
  );

  /**
   * After a successful status transition, trigger a reload to refresh the list
   * with up-to-date data from the server.
   */
  readonly reloadAfterTransition$ = createEffect(() =>
    this.actions$.pipe(
      ofType(OpportunityActions.transitionStatusSuccess),
      map(() => OpportunityActions.reloadOpportunities())
    )
  );

  /**
   * After a successful bulk delete, trigger a reload to refresh the list
   * with accurate pagination and server state.
   */
  readonly reloadAfterBulkDelete$ = createEffect(() =>
    this.actions$.pipe(
      ofType(OpportunityActions.bulkDeleteOpportunitiesSuccess),
      map(() => OpportunityActions.reloadOpportunities())
    )
  );

  /**
   * Reload opportunities using current filters from the store.
   * Builds query params from the current filter state and dispatches loadOpportunitiesWithParams.
   */
  readonly reloadOpportunities$ = createEffect(() =>
    this.actions$.pipe(
      ofType(OpportunityActions.reloadOpportunities),
      withLatestFrom(this.store.select(selectFilters)),
      map(([, filters]) => {
        const params: IOpportunityQueryParams = {
          pageNumber: 1,
          pageSize: 20,
          status: filters.status ?? undefined,
          search: filters.search || undefined,
          sortBy: filters.sortBy || undefined,
          sortDirection: filters.sortDirection || undefined
        };
        return OpportunityActions.loadOpportunitiesWithParams({ params });
      })
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
          OpportunityActions.transitionStatusFailure,
          OpportunityActions.bulkDeleteOpportunitiesFailure
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
          OpportunityActions.transitionStatusSuccess,
          OpportunityActions.bulkDeleteOpportunitiesSuccess
        ),
        tap((action) => {
          if (action.type.includes('Create')) {
            this.toastService.showSuccess('Opportunity created successfully.');
          } else if (action.type.includes('Bulk Delete')) {
            this.toastService.showSuccess(`Successfully deleted ${(action as { count: number }).count} opportunities.`);
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
