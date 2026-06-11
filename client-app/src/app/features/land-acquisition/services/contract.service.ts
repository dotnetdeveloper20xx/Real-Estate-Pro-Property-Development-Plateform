import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { IApiResponse, IContract, ContractStatus } from '../models';

/** Payload for creating a new contract. */
export interface ICreateContract {
  readonly solicitorName?: string | null;
  readonly solicitorFirm?: string | null;
  readonly solicitorContact?: string | null;
}

/** Payload for transitioning a contract to a new status. */
export interface ITransitionContractStatus {
  readonly newStatus: ContractStatus;
  readonly depositAmount?: number | null;
}

/**
 * HTTP service for managing contracts on an opportunity.
 * Wraps all API calls and returns typed Observables using the standard ApiResponse envelope.
 */
@Injectable({ providedIn: 'root' })
export class ContractService {
  private readonly baseUrl = '/api/v1/opportunities';

  constructor(private readonly http: HttpClient) {}

  /** Retrieve the contract for an opportunity. */
  getByOpportunity(opportunityId: string): Observable<IApiResponse<IContract>> {
    return this.http.get<IApiResponse<IContract>>(
      `${this.baseUrl}/${opportunityId}/contracts`
    );
  }

  /** Create a new contract for an opportunity. */
  create(opportunityId: string, dto: ICreateContract): Observable<IApiResponse<IContract>> {
    return this.http.post<IApiResponse<IContract>>(
      `${this.baseUrl}/${opportunityId}/contracts`,
      dto
    );
  }

  /** Transition a contract to a new status. */
  transitionStatus(
    opportunityId: string,
    contractId: string,
    dto: ITransitionContractStatus
  ): Observable<IApiResponse<IContract>> {
    return this.http.patch<IApiResponse<IContract>>(
      `${this.baseUrl}/${opportunityId}/contracts/${contractId}/status`,
      dto
    );
  }
}
