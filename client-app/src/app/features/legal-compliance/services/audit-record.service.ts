import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
  IApiResponse,
  IPagedResult,
  IAuditRecord,
  IAuditRecordListItem,
  IAuditRecordDetail,
  ICreateAuditRecord,
  ITransitionAuditRecordStatus,
  AuditType,
  AuditRecordStatus,
  RiskRating
} from '../models';

/** Query parameters for listing audit records. */
export interface IAuditRecordQueryParams {
  readonly pageNumber?: number;
  readonly pageSize?: number;
  readonly auditType?: AuditType;
  readonly status?: AuditRecordStatus;
  readonly riskRating?: RiskRating;
  readonly dateFrom?: string;
  readonly dateTo?: string;
  readonly search?: string;
  readonly sortBy?: string;
  readonly sortDirection?: 'asc' | 'desc';
}

/**
 * HTTP service for managing audit records.
 * Wraps all API calls and returns typed Observables using the standard ApiResponse envelope.
 */
@Injectable({ providedIn: 'root' })
export class AuditRecordService {
  private readonly baseUrl = '/api/v1/audit-records';

  constructor(private readonly http: HttpClient) {}

  /** Retrieve a paginated, filtered list of audit records. */
  getAll(params?: IAuditRecordQueryParams): Observable<IApiResponse<IPagedResult<IAuditRecordListItem>>> {
    let httpParams = new HttpParams();

    if (params?.pageNumber != null) {
      httpParams = httpParams.set('pageNumber', params.pageNumber.toString());
    }
    if (params?.pageSize != null) {
      httpParams = httpParams.set('pageSize', params.pageSize.toString());
    }
    if (params?.auditType) {
      httpParams = httpParams.set('auditType', params.auditType);
    }
    if (params?.status) {
      httpParams = httpParams.set('status', params.status);
    }
    if (params?.riskRating) {
      httpParams = httpParams.set('riskRating', params.riskRating);
    }
    if (params?.dateFrom) {
      httpParams = httpParams.set('dateFrom', params.dateFrom);
    }
    if (params?.dateTo) {
      httpParams = httpParams.set('dateTo', params.dateTo);
    }
    if (params?.search) {
      httpParams = httpParams.set('search', params.search);
    }
    if (params?.sortBy) {
      httpParams = httpParams.set('sortBy', params.sortBy);
    }
    if (params?.sortDirection) {
      httpParams = httpParams.set('sortDirection', params.sortDirection);
    }

    return this.http.get<IApiResponse<IPagedResult<IAuditRecordListItem>>>(this.baseUrl, { params: httpParams });
  }

  /** Retrieve a single audit record with full details. */
  getById(id: string): Observable<IApiResponse<IAuditRecordDetail>> {
    return this.http.get<IApiResponse<IAuditRecordDetail>>(`${this.baseUrl}/${id}`);
  }

  /** Create a new audit record. */
  create(dto: ICreateAuditRecord): Observable<IApiResponse<IAuditRecord>> {
    return this.http.post<IApiResponse<IAuditRecord>>(this.baseUrl, dto);
  }

  /** Transition an audit record to a new status. */
  transitionStatus(id: string, dto: ITransitionAuditRecordStatus): Observable<IApiResponse<IAuditRecord>> {
    return this.http.post<IApiResponse<IAuditRecord>>(`${this.baseUrl}/${id}/transition`, dto);
  }
}
