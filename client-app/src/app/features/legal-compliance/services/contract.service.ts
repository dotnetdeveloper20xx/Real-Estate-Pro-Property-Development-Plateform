import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
  IApiResponse,
  IPagedResult,
  IContract,
  IContractListItem,
  IContractDetail,
  IContractRegisterItem,
  ICreateContract,
  IUpdateContract,
  ITransitionContractStatus,
  LegalContractStatus,
  LegalContractType
} from '../models';

/** Query parameters for listing contracts. */
export interface IContractQueryParams {
  readonly pageNumber?: number;
  readonly pageSize?: number;
  readonly status?: LegalContractStatus;
  readonly contractType?: LegalContractType;
  readonly counterpartyName?: string;
  readonly legalCaseId?: string;
  readonly search?: string;
  readonly sortBy?: string;
  readonly sortDirection?: 'asc' | 'desc';
}

/**
 * HTTP service for managing contracts.
 * Wraps all API calls and returns typed Observables using the standard ApiResponse envelope.
 */
@Injectable({ providedIn: 'root' })
export class ContractService {
  private readonly baseUrl = '/api/v1/contracts';

  constructor(private readonly http: HttpClient) {}

  /** Retrieve a paginated, filtered list of contracts. */
  getAll(params?: IContractQueryParams): Observable<IApiResponse<IPagedResult<IContractListItem>>> {
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
    if (params?.contractType) {
      httpParams = httpParams.set('contractType', params.contractType);
    }
    if (params?.counterpartyName) {
      httpParams = httpParams.set('counterpartyName', params.counterpartyName);
    }
    if (params?.legalCaseId) {
      httpParams = httpParams.set('legalCaseId', params.legalCaseId);
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

    return this.http.get<IApiResponse<IPagedResult<IContractListItem>>>(this.baseUrl, { params: httpParams });
  }

  /** Retrieve a single contract with full details. */
  getById(id: string): Observable<IApiResponse<IContractDetail>> {
    return this.http.get<IApiResponse<IContractDetail>>(`${this.baseUrl}/${id}`);
  }

  /** Create a new contract. */
  create(dto: ICreateContract): Observable<IApiResponse<IContract>> {
    return this.http.post<IApiResponse<IContract>>(this.baseUrl, dto);
  }

  /** Update an existing contract. */
  update(id: string, dto: IUpdateContract): Observable<IApiResponse<IContract>> {
    return this.http.put<IApiResponse<IContract>>(`${this.baseUrl}/${id}`, dto);
  }

  /** Transition a contract to a new status. */
  transitionStatus(id: string, dto: ITransitionContractStatus): Observable<IApiResponse<IContract>> {
    return this.http.post<IApiResponse<IContract>>(`${this.baseUrl}/${id}/transition`, dto);
  }

  /** Retrieve the contract register view. */
  getRegister(params?: IContractQueryParams): Observable<IApiResponse<IPagedResult<IContractRegisterItem>>> {
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
    if (params?.contractType) {
      httpParams = httpParams.set('contractType', params.contractType);
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

    return this.http.get<IApiResponse<IPagedResult<IContractRegisterItem>>>(
      `${this.baseUrl}/register`,
      { params: httpParams }
    );
  }
}
