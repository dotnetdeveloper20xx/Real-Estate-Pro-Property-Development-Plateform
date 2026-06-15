import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
  IApiResponse,
  IOpportunity,
  IOpportunityDetail,
  IOpportunityListItem,
  ICreateOpportunity,
  IUpdateOpportunity,
  OpportunityStatus
} from '../models';

/** Query parameters for listing opportunities. */
export interface IOpportunityQueryParams {
  readonly pageNumber?: number;
  readonly pageSize?: number;
  readonly status?: OpportunityStatus;
  readonly search?: string;
  readonly sortBy?: string;
  readonly sortDirection?: 'asc' | 'desc';
}

/** Payload for transitioning an opportunity to a new status. */
export interface ITransitionOpportunityStatus {
  readonly targetStatus: OpportunityStatus;
  readonly withdrawalReason?: string | null;
}

/**
 * HTTP service for managing land acquisition opportunities.
 * Wraps all API calls and returns typed Observables using the standard ApiResponse envelope.
 */
@Injectable({ providedIn: 'root' })
export class OpportunityService {
  private readonly baseUrl = '/api/v1/opportunities';

  constructor(private readonly http: HttpClient) {}

  /** Retrieve a paginated, filtered list of opportunities. */
  getAll(params?: IOpportunityQueryParams): Observable<IApiResponse<IOpportunityListItem[]>> {
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
    if (params?.search) {
      httpParams = httpParams.set('search', params.search);
    }
    if (params?.sortBy) {
      httpParams = httpParams.set('sortBy', params.sortBy);
    }
    if (params?.sortDirection) {
      httpParams = httpParams.set('sortDirection', params.sortDirection);
    }

    return this.http.get<IApiResponse<IOpportunityListItem[]>>(this.baseUrl, { params: httpParams });
  }

  /** Retrieve a single opportunity with all related entities. */
  getById(id: string): Observable<IApiResponse<IOpportunityDetail>> {
    return this.http.get<IApiResponse<IOpportunityDetail>>(`${this.baseUrl}/${id}`);
  }

  /** Create a new opportunity. */
  create(dto: ICreateOpportunity): Observable<IApiResponse<IOpportunity>> {
    return this.http.post<IApiResponse<IOpportunity>>(this.baseUrl, dto);
  }

  /** Update an existing opportunity. */
  update(id: string, dto: IUpdateOpportunity): Observable<IApiResponse<IOpportunity>> {
    return this.http.put<IApiResponse<IOpportunity>>(`${this.baseUrl}/${id}`, { id, ...dto });
  }

  /** Soft-delete an opportunity. */
  delete(id: string): Observable<IApiResponse<null>> {
    return this.http.delete<IApiResponse<null>>(`${this.baseUrl}/${id}`);
  }

  /** Transition an opportunity to a new status. */
  transitionStatus(id: string, dto: ITransitionOpportunityStatus): Observable<IApiResponse<IOpportunity>> {
    return this.http.patch<IApiResponse<IOpportunity>>(`${this.baseUrl}/${id}/status`, { opportunityId: id, ...dto });
  }
}
