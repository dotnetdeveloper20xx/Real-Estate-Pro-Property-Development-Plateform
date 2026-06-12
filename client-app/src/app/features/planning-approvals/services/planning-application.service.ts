import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
  IApiResponse,
  IPagedResult,
  IPlanningApplication,
  IApplicationDetail,
  IApplicationListItem,
  IApplicationSummary,
  ICreateApplication,
  IUpdateApplication,
  ITransitionApplicationStatus,
  PlanningApplicationStatus,
  PlanningApplicationType
} from '../models';

/** Query parameters for listing planning applications. */
export interface IApplicationQueryParams {
  readonly pageNumber?: number;
  readonly pageSize?: number;
  readonly status?: PlanningApplicationStatus;
  readonly applicationType?: PlanningApplicationType;
  readonly councilName?: string;
  readonly submissionDateFrom?: string;
  readonly submissionDateTo?: string;
  readonly search?: string;
  readonly sortBy?: string;
  readonly sortDirection?: 'asc' | 'desc';
}

/**
 * HTTP service for managing planning applications.
 * Wraps all API calls and returns typed Observables using the standard ApiResponse envelope.
 */
@Injectable({ providedIn: 'root' })
export class PlanningApplicationService {
  private readonly baseUrl = '/api/v1/planning-applications';

  constructor(private readonly http: HttpClient) {}

  /** Retrieve a paginated, filtered list of planning applications. */
  getAll(params?: IApplicationQueryParams): Observable<IApiResponse<IPagedResult<IApplicationListItem>>> {
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
    if (params?.applicationType) {
      httpParams = httpParams.set('applicationType', params.applicationType);
    }
    if (params?.councilName) {
      httpParams = httpParams.set('councilName', params.councilName);
    }
    if (params?.submissionDateFrom) {
      httpParams = httpParams.set('submissionDateFrom', params.submissionDateFrom);
    }
    if (params?.submissionDateTo) {
      httpParams = httpParams.set('submissionDateTo', params.submissionDateTo);
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

    return this.http.get<IApiResponse<IPagedResult<IApplicationListItem>>>(this.baseUrl, { params: httpParams });
  }

  /** Retrieve a single planning application with all related entities. */
  getById(id: string): Observable<IApiResponse<IApplicationDetail>> {
    return this.http.get<IApiResponse<IApplicationDetail>>(`${this.baseUrl}/${id}`);
  }

  /** Create a new planning application. */
  create(dto: ICreateApplication): Observable<IApiResponse<IPlanningApplication>> {
    return this.http.post<IApiResponse<IPlanningApplication>>(this.baseUrl, dto);
  }

  /** Update an existing planning application. */
  update(id: string, dto: IUpdateApplication): Observable<IApiResponse<IPlanningApplication>> {
    return this.http.put<IApiResponse<IPlanningApplication>>(`${this.baseUrl}/${id}`, dto);
  }

  /** Transition a planning application to a new status. */
  transitionStatus(id: string, dto: ITransitionApplicationStatus): Observable<IApiResponse<IPlanningApplication>> {
    return this.http.put<IApiResponse<IPlanningApplication>>(`${this.baseUrl}/${id}/status`, dto);
  }

  /** Retrieve planning application summaries for a specific land opportunity. */
  getByOpportunity(opportunityId: string): Observable<IApiResponse<IApplicationSummary[]>> {
    return this.http.get<IApiResponse<IApplicationSummary[]>>(
      `${this.baseUrl}/by-opportunity/${opportunityId}`
    );
  }
}
