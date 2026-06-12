import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
  IApiResponse,
  IPagedResult,
  IPlanningCondition,
  ICreateCondition,
  ITransitionConditionStatus,
  ConditionStatus,
  ConditionType
} from '../models';

/** Query parameters for listing planning conditions. */
export interface IConditionQueryParams {
  readonly pageNumber?: number;
  readonly pageSize?: number;
  readonly status?: ConditionStatus;
  readonly conditionType?: ConditionType;
}

/**
 * HTTP service for managing planning conditions.
 * Wraps all API calls and returns typed Observables using the standard ApiResponse envelope.
 */
@Injectable({ providedIn: 'root' })
export class PlanningConditionService {
  private readonly applicationsUrl = '/api/v1/planning-applications';
  private readonly conditionsUrl = '/api/v1/planning-conditions';

  constructor(private readonly http: HttpClient) {}

  /** Retrieve conditions for a planning application, optionally filtered by status and type. */
  getByApplication(
    applicationId: string,
    params?: IConditionQueryParams
  ): Observable<IApiResponse<IPagedResult<IPlanningCondition>>> {
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
    if (params?.conditionType) {
      httpParams = httpParams.set('conditionType', params.conditionType);
    }

    return this.http.get<IApiResponse<IPagedResult<IPlanningCondition>>>(
      `${this.applicationsUrl}/${applicationId}/conditions`,
      { params: httpParams }
    );
  }

  /** Create a new condition for a planning application. */
  create(applicationId: string, dto: ICreateCondition): Observable<IApiResponse<IPlanningCondition>> {
    return this.http.post<IApiResponse<IPlanningCondition>>(
      `${this.applicationsUrl}/${applicationId}/conditions`,
      dto
    );
  }

  /** Transition a planning condition to a new status. */
  transitionStatus(conditionId: string, dto: ITransitionConditionStatus): Observable<IApiResponse<IPlanningCondition>> {
    return this.http.put<IApiResponse<IPlanningCondition>>(
      `${this.conditionsUrl}/${conditionId}/status`,
      dto
    );
  }
}
