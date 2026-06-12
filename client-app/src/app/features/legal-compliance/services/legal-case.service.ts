import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
  IApiResponse,
  IPagedResult,
  ILegalCase,
  ILegalCaseListItem,
  ILegalCaseDetail,
  ILegalCasePipeline,
  ILegalCaseSummary,
  ICreateLegalCase,
  IUpdateLegalCase,
  ITransitionLegalCaseStatus,
  LegalCaseStatus,
  LegalCaseType,
  LegalCasePriority
} from '../models';

/** Query parameters for listing legal cases. */
export interface ILegalCaseQueryParams {
  readonly pageNumber?: number;
  readonly pageSize?: number;
  readonly status?: LegalCaseStatus;
  readonly caseType?: LegalCaseType;
  readonly priority?: LegalCasePriority;
  readonly search?: string;
  readonly sortBy?: string;
  readonly sortDirection?: 'asc' | 'desc';
}

/**
 * HTTP service for managing legal cases.
 * Wraps all API calls and returns typed Observables using the standard ApiResponse envelope.
 */
@Injectable({ providedIn: 'root' })
export class LegalCaseService {
  private readonly baseUrl = '/api/v1/legal-cases';

  constructor(private readonly http: HttpClient) {}

  /** Retrieve a paginated, filtered list of legal cases. */
  getAll(params?: ILegalCaseQueryParams): Observable<IApiResponse<IPagedResult<ILegalCaseListItem>>> {
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
    if (params?.caseType) {
      httpParams = httpParams.set('caseType', params.caseType);
    }
    if (params?.priority) {
      httpParams = httpParams.set('priority', params.priority);
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

    return this.http.get<IApiResponse<IPagedResult<ILegalCaseListItem>>>(this.baseUrl, { params: httpParams });
  }

  /** Retrieve a single legal case with full details. */
  getById(id: string): Observable<IApiResponse<ILegalCaseDetail>> {
    return this.http.get<IApiResponse<ILegalCaseDetail>>(`${this.baseUrl}/${id}`);
  }

  /** Create a new legal case. */
  create(dto: ICreateLegalCase): Observable<IApiResponse<ILegalCase>> {
    return this.http.post<IApiResponse<ILegalCase>>(this.baseUrl, dto);
  }

  /** Update an existing legal case. */
  update(id: string, dto: IUpdateLegalCase): Observable<IApiResponse<ILegalCase>> {
    return this.http.put<IApiResponse<ILegalCase>>(`${this.baseUrl}/${id}`, dto);
  }

  /** Transition a legal case to a new status. */
  transitionStatus(id: string, dto: ITransitionLegalCaseStatus): Observable<IApiResponse<ILegalCase>> {
    return this.http.post<IApiResponse<ILegalCase>>(`${this.baseUrl}/${id}/transition`, dto);
  }

  /** Retrieve the pipeline view (cases grouped by status). */
  getPipeline(): Observable<IApiResponse<ILegalCasePipeline[]>> {
    return this.http.get<IApiResponse<ILegalCasePipeline[]>>(`${this.baseUrl}/pipeline`);
  }

  /** Retrieve legal case summaries for a specific opportunity. */
  getSummaryByOpportunity(opportunityId: string): Observable<IApiResponse<ILegalCaseSummary[]>> {
    return this.http.get<IApiResponse<ILegalCaseSummary[]>>(
      `${this.baseUrl}/summary/opportunity/${opportunityId}`
    );
  }

  /** Retrieve legal case summaries for a specific planning application. */
  getSummaryByPlanningApplication(planningApplicationId: string): Observable<IApiResponse<ILegalCaseSummary[]>> {
    return this.http.get<IApiResponse<ILegalCaseSummary[]>>(
      `${this.baseUrl}/summary/planning/${planningApplicationId}`
    );
  }
}
