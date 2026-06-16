import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { of } from 'rxjs';
import { map, catchError, withLatestFrom, switchMap } from 'rxjs/operators';
import { AuditLogsActions } from './audit-logs.actions';
import { selectAuditLogsQueryParams } from './audit-logs.selectors';
import { AuditLogsService } from '../../services/audit-logs.service';

/**
 * NgRx effects for the admin audit logs store.
 * Handles API calls for audit log querying with filters.
 */
@Injectable()
export class AuditLogsEffects {
  private readonly actions$ = inject(Actions);
  private readonly store = inject(Store);
  private readonly auditLogsService = inject(AuditLogsService);

  /**
   * Load audit logs effect: fetch paginated entries with current query params.
   */
  readonly loadAuditLogs$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuditLogsActions.loadAuditLogs),
      withLatestFrom(this.store.select(selectAuditLogsQueryParams)),
      switchMap(([, queryParams]) =>
        this.auditLogsService.getAuditLogs(queryParams).pipe(
          map((response) => AuditLogsActions.loadAuditLogsSuccess({ response })),
          catchError((error: { error?: { message?: string }; message?: string }) => {
            const message = error.error?.message ?? error.message ?? 'Failed to load audit logs.';
            return of(AuditLogsActions.loadAuditLogsFailure({ error: message }));
          })
        )
      )
    )
  );

  /**
   * When query params change, trigger a reload of the audit logs.
   */
  readonly updateQueryParams$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuditLogsActions.updateQueryParams),
      map(() => AuditLogsActions.loadAuditLogs())
    )
  );
}
