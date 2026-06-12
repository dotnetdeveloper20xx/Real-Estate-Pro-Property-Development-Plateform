import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
  IApiResponse,
  IPagedResult,
  IComplianceRequirement,
  IComplianceChecklistItem,
  IComplianceStatusSummary,
  IComplianceCheck,
  ICreateComplianceRequirement,
  IUpdateComplianceRequirement,
  IRetireComplianceRequirement,
  ICreateComplianceCheck,
  ComplianceCategory,
  ComplianceFrequency,
  ComplianceRequirementStatus,
  ComplianceCheckOutcome
} from '../models';

/** Query parameters for listing compliance requirements. */
export interface IComplianceRequirementQueryParams {
  readonly pageNumber?: number;
  readonly pageSize?: number;
  readonly category?: ComplianceCategory;
  readonly frequency?: ComplianceFrequency;
  readonly status?: ComplianceRequirementStatus;
  readonly responsibleRole?: string;
  readonly search?: string;
  readonly sortBy?: string;
  readonly sortDirection?: 'asc' | 'desc';
}

/** Query parameters for listing compliance checks. */
export interface IComplianceCheckQueryParams {
  readonly pageNumber?: number;
  readonly pageSize?: number;
  readonly outcome?: ComplianceCheckOutcome;
  readonly dateFrom?: string;
  readonly dateTo?: string;
}

/**
 * HTTP service for managing compliance requirements and checks.
 * Wraps all API calls and returns typed Observables using the standard ApiResponse envelope.
 */
@Injectable({ providedIn: 'root' })
export class ComplianceService {
  private readonly requirementsUrl = '/api/v1/compliance-requirements';
  private readonly checksUrl = '/api/v1/compliance-checks';

  constructor(private readonly http: HttpClient) {}

  // ──────────────────────────────────────────────
  // Compliance Requirements
  // ──────────────────────────────────────────────

  /** Retrieve a single compliance requirement by its ID. */
  getRequirementById(id: string): Observable<IApiResponse<IComplianceRequirement>> {
    return this.http.get<IApiResponse<IComplianceRequirement>>(`${this.requirementsUrl}/${id}`);
  }

  /** Retrieve a paginated, filtered list of compliance requirements. */
  getRequirements(
    params?: IComplianceRequirementQueryParams
  ): Observable<IApiResponse<IPagedResult<IComplianceRequirement>>> {
    let httpParams = new HttpParams();

    if (params?.pageNumber != null) {
      httpParams = httpParams.set('pageNumber', params.pageNumber.toString());
    }
    if (params?.pageSize != null) {
      httpParams = httpParams.set('pageSize', params.pageSize.toString());
    }
    if (params?.category) {
      httpParams = httpParams.set('category', params.category);
    }
    if (params?.frequency) {
      httpParams = httpParams.set('frequency', params.frequency);
    }
    if (params?.status) {
      httpParams = httpParams.set('status', params.status);
    }
    if (params?.responsibleRole) {
      httpParams = httpParams.set('responsibleRole', params.responsibleRole);
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

    return this.http.get<IApiResponse<IPagedResult<IComplianceRequirement>>>(
      this.requirementsUrl,
      { params: httpParams }
    );
  }

  /** Retrieve the compliance checklist view with last check info. */
  getChecklist(): Observable<IApiResponse<IComplianceChecklistItem[]>> {
    return this.http.get<IApiResponse<IComplianceChecklistItem[]>>(`${this.requirementsUrl}/checklist`);
  }

  /** Retrieve compliance status summary grouped by category. */
  getStatusSummary(): Observable<IApiResponse<IComplianceStatusSummary[]>> {
    return this.http.get<IApiResponse<IComplianceStatusSummary[]>>(`${this.requirementsUrl}/summary`);
  }

  /** Create a new compliance requirement. */
  createRequirement(dto: ICreateComplianceRequirement): Observable<IApiResponse<IComplianceRequirement>> {
    return this.http.post<IApiResponse<IComplianceRequirement>>(this.requirementsUrl, dto);
  }

  /** Update an existing compliance requirement. */
  updateRequirement(id: string, dto: IUpdateComplianceRequirement): Observable<IApiResponse<IComplianceRequirement>> {
    return this.http.put<IApiResponse<IComplianceRequirement>>(`${this.requirementsUrl}/${id}`, dto);
  }

  /** Retire or supersede a compliance requirement. */
  retireRequirement(id: string, dto: IRetireComplianceRequirement): Observable<IApiResponse<IComplianceRequirement>> {
    return this.http.put<IApiResponse<IComplianceRequirement>>(`${this.requirementsUrl}/${id}/retire`, dto);
  }

  // ──────────────────────────────────────────────
  // Compliance Checks
  // ──────────────────────────────────────────────

  /** Retrieve compliance checks for a specific requirement. */
  getChecks(
    requirementId: string,
    params?: IComplianceCheckQueryParams
  ): Observable<IApiResponse<IPagedResult<IComplianceCheck>>> {
    let httpParams = new HttpParams();

    if (params?.pageNumber != null) {
      httpParams = httpParams.set('pageNumber', params.pageNumber.toString());
    }
    if (params?.pageSize != null) {
      httpParams = httpParams.set('pageSize', params.pageSize.toString());
    }
    if (params?.outcome) {
      httpParams = httpParams.set('outcome', params.outcome);
    }
    if (params?.dateFrom) {
      httpParams = httpParams.set('dateFrom', params.dateFrom);
    }
    if (params?.dateTo) {
      httpParams = httpParams.set('dateTo', params.dateTo);
    }

    return this.http.get<IApiResponse<IPagedResult<IComplianceCheck>>>(this.checksUrl, {
      params: httpParams.set('complianceRequirementId', requirementId)
    });
  }

  /** Record a new compliance check. */
  createCheck(dto: ICreateComplianceCheck): Observable<IApiResponse<IComplianceCheck>> {
    return this.http.post<IApiResponse<IComplianceCheck>>(this.checksUrl, dto);
  }
}
