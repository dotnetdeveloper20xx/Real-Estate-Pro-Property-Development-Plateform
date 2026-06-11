import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
  IApiResponse,
  IFeasibilityAssessment,
  ICreateFeasibility
} from '../models';

/**
 * HTTP service for managing feasibility assessments on an opportunity.
 * Wraps all API calls and returns typed Observables using the standard ApiResponse envelope.
 */
@Injectable({ providedIn: 'root' })
export class FeasibilityService {
  private readonly baseUrl = '/api/v1/opportunities';

  constructor(private readonly http: HttpClient) {}

  /** Retrieve the feasibility assessment for an opportunity. */
  getByOpportunity(opportunityId: string): Observable<IApiResponse<IFeasibilityAssessment>> {
    return this.http.get<IApiResponse<IFeasibilityAssessment>>(
      `${this.baseUrl}/${opportunityId}/feasibility`
    );
  }

  /** Create or update the feasibility assessment for an opportunity. */
  createOrUpdate(
    opportunityId: string,
    dto: ICreateFeasibility
  ): Observable<IApiResponse<IFeasibilityAssessment>> {
    return this.http.post<IApiResponse<IFeasibilityAssessment>>(
      `${this.baseUrl}/${opportunityId}/feasibility`,
      dto
    );
  }
}
