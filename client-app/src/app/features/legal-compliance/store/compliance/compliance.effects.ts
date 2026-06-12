import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { map, exhaustMap, catchError, tap } from 'rxjs/operators';
import { ComplianceRequirementActions, ComplianceCheckActions } from './compliance.actions';
import { ComplianceService } from '../../services/compliance.service';
import { ToastService } from '@core/services/toast.service';

/**
 * NgRx effects for the compliance feature.
 * Handles all side effects including API calls and toast notifications on error.
 */
@Injectable()
export class ComplianceEffects {
  private readonly actions$ = inject(Actions);
  private readonly complianceService = inject(ComplianceService);
  private readonly toastService = inject(ToastService);

  // ──────────────────────────────────────────────
  // Requirements Effects
  // ──────────────────────────────────────────────

  /**
   * Load compliance requirements (paginated/filtered) from the API.
   */
  readonly loadRequirements$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ComplianceRequirementActions.loadRequirements),
      exhaustMap(({ params }) =>
        this.complianceService.getRequirements(params).pipe(
          map((response) =>
            ComplianceRequirementActions.loadRequirementsSuccess({
              requirements: response.data?.items ?? []
            })
          ),
          catchError((error: { message: string }) =>
            of(ComplianceRequirementActions.loadRequirementsFailure({ error: error.message }))
          )
        )
      )
    )
  );

  /**
   * Load the compliance checklist view from the API.
   */
  readonly loadChecklist$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ComplianceRequirementActions.loadChecklist),
      exhaustMap(() =>
        this.complianceService.getChecklist().pipe(
          map((response) =>
            ComplianceRequirementActions.loadChecklistSuccess({
              checklist: response.data ?? []
            })
          ),
          catchError((error: { message: string }) =>
            of(ComplianceRequirementActions.loadChecklistFailure({ error: error.message }))
          )
        )
      )
    )
  );

  /**
   * Load the compliance status summary from the API.
   */
  readonly loadStatusSummary$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ComplianceRequirementActions.loadStatusSummary),
      exhaustMap(() =>
        this.complianceService.getStatusSummary().pipe(
          map((response) =>
            ComplianceRequirementActions.loadStatusSummarySuccess({
              summary: response.data ?? []
            })
          ),
          catchError((error: { message: string }) =>
            of(ComplianceRequirementActions.loadStatusSummaryFailure({ error: error.message }))
          )
        )
      )
    )
  );

  /**
   * Create a new compliance requirement via API.
   */
  readonly createRequirement$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ComplianceRequirementActions.createRequirement),
      exhaustMap(({ requirement }) =>
        this.complianceService.createRequirement(requirement).pipe(
          map((response) =>
            ComplianceRequirementActions.createRequirementSuccess({
              requirement: response.data!
            })
          ),
          catchError((error: { message: string }) =>
            of(ComplianceRequirementActions.createRequirementFailure({ error: error.message }))
          )
        )
      )
    )
  );

  /**
   * Update an existing compliance requirement via API.
   */
  readonly updateRequirement$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ComplianceRequirementActions.updateRequirement),
      exhaustMap(({ id, changes }) =>
        this.complianceService.updateRequirement(id, changes).pipe(
          map((response) =>
            ComplianceRequirementActions.updateRequirementSuccess({
              requirement: response.data!
            })
          ),
          catchError((error: { message: string }) =>
            of(ComplianceRequirementActions.updateRequirementFailure({ error: error.message }))
          )
        )
      )
    )
  );

  /**
   * Retire a compliance requirement via API.
   */
  readonly retireRequirement$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ComplianceRequirementActions.retireRequirement),
      exhaustMap(({ id, payload }) =>
        this.complianceService.retireRequirement(id, payload).pipe(
          map((response) =>
            ComplianceRequirementActions.retireRequirementSuccess({
              requirement: response.data!
            })
          ),
          catchError((error: { message: string }) =>
            of(ComplianceRequirementActions.retireRequirementFailure({ error: error.message }))
          )
        )
      )
    )
  );

  // ──────────────────────────────────────────────
  // Checks Effects
  // ──────────────────────────────────────────────

  /**
   * Load compliance checks for a specific requirement from the API.
   */
  readonly loadChecks$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ComplianceCheckActions.loadChecks),
      exhaustMap(({ requirementId, params }) =>
        this.complianceService.getChecks(requirementId, params).pipe(
          map((response) =>
            ComplianceCheckActions.loadChecksSuccess({
              checks: response.data?.items ?? [],
              totalCount: response.data?.totalCount ?? 0
            })
          ),
          catchError((error: { message: string }) =>
            of(ComplianceCheckActions.loadChecksFailure({ error: error.message }))
          )
        )
      )
    )
  );

  /**
   * Create a new compliance check via API.
   */
  readonly createCheck$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ComplianceCheckActions.createCheck),
      exhaustMap(({ check }) =>
        this.complianceService.createCheck(check).pipe(
          map((response) =>
            ComplianceCheckActions.createCheckSuccess({
              check: response.data!
            })
          ),
          catchError((error: { message: string }) =>
            of(ComplianceCheckActions.createCheckFailure({ error: error.message }))
          )
        )
      )
    )
  );

  // ──────────────────────────────────────────────
  // Error Toast Effect
  // ──────────────────────────────────────────────

  /**
   * Show toast notification on any failure action.
   */
  readonly showErrorToast$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(
          ComplianceRequirementActions.loadRequirementsFailure,
          ComplianceRequirementActions.loadChecklistFailure,
          ComplianceRequirementActions.loadStatusSummaryFailure,
          ComplianceRequirementActions.createRequirementFailure,
          ComplianceRequirementActions.updateRequirementFailure,
          ComplianceRequirementActions.retireRequirementFailure,
          ComplianceCheckActions.loadChecksFailure,
          ComplianceCheckActions.createCheckFailure
        ),
        tap(({ error }) => {
          this.toastService.showError(error);
        })
      ),
    { dispatch: false }
  );
}
