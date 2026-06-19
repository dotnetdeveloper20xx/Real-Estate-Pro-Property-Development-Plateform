import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
  IApiResponse,
  ILandOwner,
  ICreateLandOwner,
  IUpdateLandOwner
} from '../models';

/**
 * HTTP service for managing land owners on an opportunity.
 * Wraps all API calls and returns typed Observables using the standard ApiResponse envelope.
 */
@Injectable({ providedIn: 'root' })
export class LandOwnerService {
  private readonly baseUrl = '/api/v1/opportunities';

  constructor(private readonly http: HttpClient) {}

  /** Retrieve all land owners for an opportunity. */
  getByOpportunity(opportunityId: string): Observable<IApiResponse<ILandOwner[]>> {
    return this.http.get<IApiResponse<ILandOwner[]>>(
      `${this.baseUrl}/${opportunityId}/owners`
    );
  }

  /** Create a new land owner for an opportunity. */
  create(opportunityId: string, dto: ICreateLandOwner): Observable<IApiResponse<ILandOwner>> {
    return this.http.post<IApiResponse<ILandOwner>>(
      `${this.baseUrl}/${opportunityId}/owners`,
      dto
    );
  }

  /** Update an existing land owner. */
  update(
    opportunityId: string,
    ownerId: string,
    dto: IUpdateLandOwner
  ): Observable<IApiResponse<ILandOwner>> {
    return this.http.put<IApiResponse<ILandOwner>>(
      `${this.baseUrl}/${opportunityId}/owners/${ownerId}`,
      dto
    );
  }

  /** Delete a land owner. */
  delete(opportunityId: string, ownerId: string): Observable<IApiResponse<void>> {
    return this.http.delete<IApiResponse<void>>(
      `${this.baseUrl}/${opportunityId}/owners/${ownerId}`
    );
  }
}
