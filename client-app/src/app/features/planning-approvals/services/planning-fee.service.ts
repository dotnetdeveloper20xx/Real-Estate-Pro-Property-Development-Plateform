import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
  IApiResponse,
  IPagedResult,
  IPlanningFee,
  IFeeSummary,
  ICreateFee,
  ITransitionFeeStatus,
  IApproveFee,
  FeeType,
  PaymentStatus
} from '../models';

/** Query parameters for listing planning fees. */
export interface IFeeQueryParams {
  readonly pageNumber?: number;
  readonly pageSize?: number;
  readonly feeType?: FeeType;
  readonly paymentStatus?: PaymentStatus;
}

/**
 * HTTP service for managing planning fees.
 * Wraps all API calls and returns typed Observables using the standard ApiResponse envelope.
 */
@Injectable({ providedIn: 'root' })
export class PlanningFeeService {
  private readonly applicationsUrl = '/api/v1/planning-applications';
  private readonly feesUrl = '/api/v1/planning-fees';

  constructor(private readonly http: HttpClient) {}

  /** Retrieve fees for a planning application, optionally filtered by fee type and payment status. */
  getByApplication(
    applicationId: string,
    params?: IFeeQueryParams
  ): Observable<IApiResponse<IPagedResult<IPlanningFee>>> {
    let httpParams = new HttpParams();

    if (params?.pageNumber != null) {
      httpParams = httpParams.set('pageNumber', params.pageNumber.toString());
    }
    if (params?.pageSize != null) {
      httpParams = httpParams.set('pageSize', params.pageSize.toString());
    }
    if (params?.feeType) {
      httpParams = httpParams.set('feeType', params.feeType);
    }
    if (params?.paymentStatus) {
      httpParams = httpParams.set('paymentStatus', params.paymentStatus);
    }

    return this.http.get<IApiResponse<IPagedResult<IPlanningFee>>>(
      `${this.applicationsUrl}/${applicationId}/fees`,
      { params: httpParams }
    );
  }

  /** Retrieve fee summary totals for a planning application grouped by type and status. */
  getSummary(applicationId: string): Observable<IApiResponse<IFeeSummary[]>> {
    return this.http.get<IApiResponse<IFeeSummary[]>>(
      `${this.applicationsUrl}/${applicationId}/fees/summary`
    );
  }

  /** Create a new fee for a planning application. */
  create(applicationId: string, dto: ICreateFee): Observable<IApiResponse<IPlanningFee>> {
    return this.http.post<IApiResponse<IPlanningFee>>(
      `${this.applicationsUrl}/${applicationId}/fees`,
      dto
    );
  }

  /** Transition a planning fee to a new payment status. */
  transitionStatus(feeId: string, dto: ITransitionFeeStatus): Observable<IApiResponse<IPlanningFee>> {
    return this.http.put<IApiResponse<IPlanningFee>>(
      `${this.feesUrl}/${feeId}/status`,
      dto
    );
  }

  /** Approve a fee payment (Finance Director only). */
  approve(feeId: string, dto: IApproveFee): Observable<IApiResponse<IPlanningFee>> {
    return this.http.put<IApiResponse<IPlanningFee>>(
      `${this.feesUrl}/${feeId}/approve`,
      dto
    );
  }
}
