import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
  IApiResponse,
  IPagedResult,
  IPlanningMilestone,
  ICreateMilestone,
  ICompleteMilestone
} from '../models';

/** Query parameters for listing planning milestones. */
export interface IMilestoneQueryParams {
  readonly pageNumber?: number;
  readonly pageSize?: number;
}

/**
 * HTTP service for managing planning milestones.
 * Wraps all API calls and returns typed Observables using the standard ApiResponse envelope.
 */
@Injectable({ providedIn: 'root' })
export class PlanningMilestoneService {
  private readonly applicationsUrl = '/api/v1/planning-applications';
  private readonly milestonesUrl = '/api/v1/planning-milestones';

  constructor(private readonly http: HttpClient) {}

  /** Retrieve milestones for a planning application ordered by target date ascending. */
  getByApplication(
    applicationId: string,
    params?: IMilestoneQueryParams
  ): Observable<IApiResponse<IPagedResult<IPlanningMilestone>>> {
    let httpParams = new HttpParams();

    if (params?.pageNumber != null) {
      httpParams = httpParams.set('pageNumber', params.pageNumber.toString());
    }
    if (params?.pageSize != null) {
      httpParams = httpParams.set('pageSize', params.pageSize.toString());
    }

    return this.http.get<IApiResponse<IPagedResult<IPlanningMilestone>>>(
      `${this.applicationsUrl}/${applicationId}/milestones`,
      { params: httpParams }
    );
  }

  /** Create a new milestone for a planning application. */
  create(applicationId: string, dto: ICreateMilestone): Observable<IApiResponse<IPlanningMilestone>> {
    return this.http.post<IApiResponse<IPlanningMilestone>>(
      `${this.applicationsUrl}/${applicationId}/milestones`,
      dto
    );
  }

  /** Record completion of a milestone with actual date. */
  complete(milestoneId: string, dto: ICompleteMilestone): Observable<IApiResponse<IPlanningMilestone>> {
    return this.http.put<IApiResponse<IPlanningMilestone>>(
      `${this.milestonesUrl}/${milestoneId}/complete`,
      dto
    );
  }
}
