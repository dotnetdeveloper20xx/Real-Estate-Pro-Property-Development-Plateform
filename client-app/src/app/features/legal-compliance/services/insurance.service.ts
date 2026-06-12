import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
  IApiResponse,
  IPagedResult,
  IInsuranceRecord,
  IInsuranceRecordListItem,
  IInsuranceRecordDetail,
  ICreateInsuranceRecord,
  IUpdateInsuranceRecord,
  ITransitionInsuranceStatus,
  IRenewInsuranceRecord,
  InsuranceStatus,
  CoverageType
} from '../models';

/** Query parameters for listing insurance records. */
export interface IInsuranceQueryParams {
  readonly pageNumber?: number;
  readonly pageSize?: number;
  readonly status?: InsuranceStatus;
  readonly coverageType?: CoverageType;
  readonly insurer?: string;
  readonly expiryDateFrom?: string;
  readonly expiryDateTo?: string;
  readonly search?: string;
  readonly sortBy?: string;
  readonly sortDirection?: 'asc' | 'desc';
}

/**
 * HTTP service for managing insurance records.
 * Wraps all API calls and returns typed Observables using the standard ApiResponse envelope.
 */
@Injectable({ providedIn: 'root' })
export class InsuranceService {
  private readonly baseUrl = '/api/v1/insurance-records';

  constructor(private readonly http: HttpClient) {}

  /** Retrieve a paginated, filtered list of insurance records. */
  getAll(params?: IInsuranceQueryParams): Observable<IApiResponse<IPagedResult<IInsuranceRecordListItem>>> {
    let httpParams = new HttpParams();

    if (params?.pageNumber != null) {
      httpParams = httpParams.set('pageNumber', params.pageNumber.toString());
    }
    if (params?.pageSize != null) {
      httpParams = httpParams.set('pageSize', params.pageSize.toString());
    }
    if (params?.status) {
      httpParams = httpParams.set('status', params.status);
    }
    if (params?.coverageType) {
      httpParams = httpParams.set('coverageType', params.coverageType);
    }
    if (params?.insurer) {
      httpParams = httpParams.set('insurer', params.insurer);
    }
    if (params?.expiryDateFrom) {
      httpParams = httpParams.set('expiryDateFrom', params.expiryDateFrom);
    }
    if (params?.expiryDateTo) {
      httpParams = httpParams.set('expiryDateTo', params.expiryDateTo);
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

    return this.http.get<IApiResponse<IPagedResult<IInsuranceRecordListItem>>>(this.baseUrl, { params: httpParams });
  }

  /** Retrieve a single insurance record with full details. */
  getById(id: string): Observable<IApiResponse<IInsuranceRecordDetail>> {
    return this.http.get<IApiResponse<IInsuranceRecordDetail>>(`${this.baseUrl}/${id}`);
  }

  /** Create a new insurance record. */
  create(dto: ICreateInsuranceRecord): Observable<IApiResponse<IInsuranceRecord>> {
    return this.http.post<IApiResponse<IInsuranceRecord>>(this.baseUrl, dto);
  }

  /** Update an existing insurance record. */
  update(id: string, dto: IUpdateInsuranceRecord): Observable<IApiResponse<IInsuranceRecord>> {
    return this.http.put<IApiResponse<IInsuranceRecord>>(`${this.baseUrl}/${id}`, dto);
  }

  /** Transition an insurance record to a new status. */
  transitionStatus(id: string, dto: ITransitionInsuranceStatus): Observable<IApiResponse<IInsuranceRecord>> {
    return this.http.post<IApiResponse<IInsuranceRecord>>(`${this.baseUrl}/${id}/transition`, dto);
  }

  /** Renew an insurance record, creating a new policy linked to the previous one. */
  renew(id: string, dto: IRenewInsuranceRecord): Observable<IApiResponse<IInsuranceRecord>> {
    return this.http.post<IApiResponse<IInsuranceRecord>>(`${this.baseUrl}/${id}/renew`, dto);
  }
}
