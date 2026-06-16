import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IAuditLogsQueryParams, IPagedAuditLogsResponse } from '../models/audit-log.model';

/**
 * Admin Audit Logs API service.
 * Provides typed HTTP methods for querying the immutable audit log.
 */
@Injectable({ providedIn: 'root' })
export class AuditLogsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/v1/audit-logs';

  /**
   * Get paginated audit log entries with filters.
   */
  getAuditLogs(params: IAuditLogsQueryParams): Observable<IPagedAuditLogsResponse> {
    let httpParams = new HttpParams()
      .set('page', params.page.toString())
      .set('pageSize', params.pageSize.toString());

    if (params.action) {
      httpParams = httpParams.set('action', params.action);
    }

    if (params.userId) {
      httpParams = httpParams.set('userId', params.userId);
    }

    if (params.startDate) {
      httpParams = httpParams.set('startDate', params.startDate);
    }

    if (params.endDate) {
      httpParams = httpParams.set('endDate', params.endDate);
    }

    return this.http.get<IPagedAuditLogsResponse>(this.baseUrl, { params: httpParams });
  }
}
