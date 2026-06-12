import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
  IApiResponse,
  IPagedResult,
  IPlanningAppeal,
  ICreateAppeal,
  ITransitionAppealStatus
} from '../models';

/** Query parameters for listing planning appeals. */
export interface IAppealQueryParams {
  readonly pageNumber?: number;
  readonly pageSize?: number;
}

/**
 * HTTP service for managing planning appeals.
 * Wraps all API calls and returns typed Observables using the standard ApiResponse envelope.
 */
@Injectable({ providedIn: 'root' })
export class PlanningAppealService {
  private readonly applicationsUrl = '/api/v1/planning-applications';
  private readonly appealsUrl = '/api/v1/planning-appeals';

  constructor(private readonly http: HttpClient) {}

  /** Retrieve appeals for a planning application. */
  getByApplication(
    applicationId: string,
    params?: IAppealQueryParams
  ): Observable<IApiResponse<IPagedResult<IPlanningAppeal>>> {
    let httpParams = new HttpParams();

    if (params?.pageNumber != null) {
      httpParams = httpParams.set('pageNumber', params.pageNumber.toString());
    }
    if (params?.pageSize != null) {
      httpParams = httpParams.set('pageSize', params.pageSize.toString());
    }

    return this.http.get<IApiResponse<IPagedResult<IPlanningAppeal>>>(
      `${this.applicationsUrl}/${applicationId}/appeals`,
      { params: httpParams }
    );
  }

  /** Create a new appeal for a planning application. */
  create(applicationId: string, dto: ICreateAppeal): Observable<IApiResponse<IPlanningAppeal>> {
    return this.http.post<IApiResponse<IPlanningAppeal>>(
      `${this.applicationsUrl}/${applicationId}/appeals`,
      dto
    );
  }

  /** Transition a planning appeal to a new status. */
  transitionStatus(appealId: string, dto: ITransitionAppealStatus): Observable<IApiResponse<IPlanningAppeal>> {
    return this.http.put<IApiResponse<IPlanningAppeal>>(
      `${this.appealsUrl}/${appealId}/status`,
      dto
    );
  }
}
