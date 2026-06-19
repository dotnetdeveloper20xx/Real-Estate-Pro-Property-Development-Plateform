import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
  IApiResponse,
  IOffer,
  ICreateOffer,
  OfferStatus
} from '../models';

/** Payload for transitioning an offer to a new status. */
export interface ITransitionOfferStatus {
  readonly targetStatus: OfferStatus;
  readonly counterOfferAmount?: number | null;
}

/**
 * HTTP service for managing offers on an opportunity.
 * Wraps all API calls and returns typed Observables using the standard ApiResponse envelope.
 */
@Injectable({ providedIn: 'root' })
export class OfferService {
  private readonly baseUrl = '/api/v1/opportunities';

  constructor(private readonly http: HttpClient) {}

  /** Retrieve all offers for an opportunity. */
  getByOpportunity(opportunityId: string): Observable<IApiResponse<IOffer[]>> {
    return this.http.get<IApiResponse<IOffer[]>>(
      `${this.baseUrl}/${opportunityId}/offers`
    );
  }

  /** Create a new offer for an opportunity. */
  create(opportunityId: string, dto: ICreateOffer): Observable<IApiResponse<IOffer>> {
    return this.http.post<IApiResponse<IOffer>>(
      `${this.baseUrl}/${opportunityId}/offers`,
      dto
    );
  }

  /** Transition an offer to a new status. */
  transitionStatus(
    opportunityId: string,
    offerId: string,
    dto: ITransitionOfferStatus
  ): Observable<IApiResponse<IOffer>> {
    return this.http.patch<IApiResponse<IOffer>>(
      `${this.baseUrl}/${opportunityId}/offers/${offerId}/status`,
      dto
    );
  }
}
