import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
  IApiResponse,
  IPagedResult,
  ILegalDocument,
  ILegalDocumentListItem,
  LegalDocumentType,
  ConfidentialityLevel
} from '../models';

/** Query parameters for listing legal documents. */
export interface ILegalDocumentQueryParams {
  readonly pageNumber?: number;
  readonly pageSize?: number;
  readonly documentType?: LegalDocumentType;
  readonly confidentialityLevel?: ConfidentialityLevel;
  readonly legalCaseId?: string;
  readonly contractId?: string;
  readonly dateFrom?: string;
  readonly dateTo?: string;
}

/**
 * HTTP service for managing legal documents.
 * Wraps all API calls and returns typed Observables using the standard ApiResponse envelope.
 */
@Injectable({ providedIn: 'root' })
export class LegalDocumentService {
  private readonly baseUrl = '/api/v1/legal-documents';

  constructor(private readonly http: HttpClient) {}

  /** Retrieve a paginated, filtered list of legal documents. */
  getAll(params?: ILegalDocumentQueryParams): Observable<IApiResponse<IPagedResult<ILegalDocumentListItem>>> {
    let httpParams = new HttpParams();

    if (params?.pageNumber != null) {
      httpParams = httpParams.set('pageNumber', params.pageNumber.toString());
    }
    if (params?.pageSize != null) {
      httpParams = httpParams.set('pageSize', params.pageSize.toString());
    }
    if (params?.documentType) {
      httpParams = httpParams.set('documentType', params.documentType);
    }
    if (params?.confidentialityLevel) {
      httpParams = httpParams.set('confidentialityLevel', params.confidentialityLevel);
    }
    if (params?.legalCaseId) {
      httpParams = httpParams.set('legalCaseId', params.legalCaseId);
    }
    if (params?.contractId) {
      httpParams = httpParams.set('contractId', params.contractId);
    }
    if (params?.dateFrom) {
      httpParams = httpParams.set('dateFrom', params.dateFrom);
    }
    if (params?.dateTo) {
      httpParams = httpParams.set('dateTo', params.dateTo);
    }

    return this.http.get<IApiResponse<IPagedResult<ILegalDocumentListItem>>>(this.baseUrl, { params: httpParams });
  }

  /** Upload a new legal document. */
  upload(
    file: File,
    documentType: LegalDocumentType,
    confidentialityLevel: ConfidentialityLevel,
    options?: {
      readonly legalCaseId?: string;
      readonly contractId?: string;
      readonly retentionExpiryDate?: string;
    }
  ): Observable<IApiResponse<ILegalDocument>> {
    const formData = new FormData();
    formData.append('file', file, file.name);
    formData.append('documentType', documentType);
    formData.append('confidentialityLevel', confidentialityLevel);

    if (options?.legalCaseId) {
      formData.append('legalCaseId', options.legalCaseId);
    }
    if (options?.contractId) {
      formData.append('contractId', options.contractId);
    }
    if (options?.retentionExpiryDate) {
      formData.append('retentionExpiryDate', options.retentionExpiryDate);
    }

    return this.http.post<IApiResponse<ILegalDocument>>(this.baseUrl, formData);
  }

  /** Upload a new version of an existing document. */
  uploadVersion(documentId: string, file: File): Observable<IApiResponse<ILegalDocument>> {
    const formData = new FormData();
    formData.append('file', file, file.name);

    return this.http.post<IApiResponse<ILegalDocument>>(`${this.baseUrl}/${documentId}/version`, formData);
  }

  /** Soft-delete a legal document. */
  delete(documentId: string): Observable<IApiResponse<null>> {
    return this.http.delete<IApiResponse<null>>(`${this.baseUrl}/${documentId}`);
  }
}
