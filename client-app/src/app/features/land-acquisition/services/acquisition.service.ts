import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { ILandAcquisitionRecord, ICreateAcquisition } from '../models/acquisition.model';
import { IApiResponse } from '../models';

/**
 * HTTP service for managing land acquisition records.
 * Handles CRUD operations and status transitions for acquisition entries
 * linked to a specific opportunity.
 */
@Injectable({ providedIn: 'root' })
export class AcquisitionService {
  private readonly baseUrl = '/api/v1/opportunities';

  constructor(private readonly http: HttpClient) {}

  /** Retrieve all acquisition records for a given opportunity. */
  getByOpportunity(opportunityId: string): Observable<IApiResponse<ILandAcquisitionRecord[]>> {
    return this.http.get<IApiResponse<ILandAcquisitionRecord[]>>(
      `${this.baseUrl}/${opportunityId}/acquisitions`
    );
  }

  /** Create a new acquisition record under the specified opportunity. */
  create(opportunityId: string, dto: ICreateAcquisition): Observable<IApiResponse<ILandAcquisitionRecord>> {
    return this.http.post<IApiResponse<ILandAcquisitionRecord>>(
      `${this.baseUrl}/${opportunityId}/acquisitions`,
      { opportunityId, ...dto }
    );
  }

  /** Update the status of an existing acquisition record (e.g., mark as Registered). */
  updateStatus(
    opportunityId: string,
    acquisitionId: string,
    targetStatus: string
  ): Observable<IApiResponse<ILandAcquisitionRecord>> {
    return this.http.patch<IApiResponse<ILandAcquisitionRecord>>(
      `${this.baseUrl}/${opportunityId}/acquisitions/${acquisitionId}/status`,
      { targetStatus }
    );
  }
}
