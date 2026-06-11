import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
  IApiResponse,
  IDueDiligence,
  ICreateDueDiligence,
  DueDiligenceType,
  DueDiligenceStatus
} from '../models';

/** Query parameters for filtering due diligence checks. */
export interface IDueDiligenceQueryParams {
  readonly type?: DueDiligenceType;
  readonly status?: DueDiligenceStatus;
}

/** Payload for transitioning a due diligence check to a new status. */
export interface ITransitionDueDiligenceStatus {
  readonly newStatus: DueDiligenceStatus;
  readonly findings?: string | null;
}

/**
 * HTTP service for managing due diligence checks on an opportunity.
 * Wraps all API calls and returns typed Observables using the standard ApiResponse envelope.
 */
@Injectable({ providedIn: 'root' })
export class DueDiligenceService {
  private readonly baseUrl = '/api/v1/opportunities';

  constructor(private readonly http: HttpClient) {}

  /** Retrieve due diligence checks for an opportunity, optionally filtered by type/status. */
  getByOpportunity(
    opportunityId: string,
    filters?: IDueDiligenceQueryParams
  ): Observable<IApiResponse<IDueDiligence[]>> {
    let params = new HttpParams();

    if (filters?.type) {
      params = params.set('type', filters.type);
    }
    if (filters?.status) {
      params = params.set('status', filters.status);
    }

    return this.http.get<IApiResponse<IDueDiligence[]>>(
      `${this.baseUrl}/${opportunityId}/due-diligence`,
      { params }
    );
  }

  /** Create a new due diligence check for an opportunity. */
  create(opportunityId: string, dto: ICreateDueDiligence): Observable<IApiResponse<IDueDiligence>> {
    return this.http.post<IApiResponse<IDueDiligence>>(
      `${this.baseUrl}/${opportunityId}/due-diligence`,
      dto
    );
  }

  /** Transition a due diligence check to a new status. */
  transitionStatus(
    opportunityId: string,
    ddId: string,
    dto: ITransitionDueDiligenceStatus
  ): Observable<IApiResponse<IDueDiligence>> {
    return this.http.patch<IApiResponse<IDueDiligence>>(
      `${this.baseUrl}/${opportunityId}/due-diligence/${ddId}/status`,
      dto
    );
  }
}
