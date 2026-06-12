import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
  IApiResponse,
  IPagedResult,
  IPlanningDocument,
  PlanningDocumentType
} from '../models';

/** Query parameters for listing planning documents. */
export interface IDocumentQueryParams {
  readonly pageNumber?: number;
  readonly pageSize?: number;
  readonly documentType?: PlanningDocumentType;
}

/**
 * HTTP service for managing planning documents.
 * Wraps all API calls and returns typed Observables using the standard ApiResponse envelope.
 */
@Injectable({ providedIn: 'root' })
export class PlanningDocumentService {
  private readonly applicationsUrl = '/api/v1/planning-applications';
  private readonly documentsUrl = '/api/v1/planning-documents';

  constructor(private readonly http: HttpClient) {}

  /** Retrieve documents for a planning application, optionally filtered by document type. */
  getByApplication(
    applicationId: string,
    params?: IDocumentQueryParams
  ): Observable<IApiResponse<IPagedResult<IPlanningDocument>>> {
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

    return this.http.get<IApiResponse<IPagedResult<IPlanningDocument>>>(
      `${this.applicationsUrl}/${applicationId}/documents`,
      { params: httpParams }
    );
  }

  /** Upload a document for a planning application. */
  upload(
    applicationId: string,
    file: File,
    documentType: PlanningDocumentType
  ): Observable<IApiResponse<IPlanningDocument>> {
    const formData = new FormData();
    formData.append('file', file, file.name);
    formData.append('documentType', documentType);

    return this.http.post<IApiResponse<IPlanningDocument>>(
      `${this.applicationsUrl}/${applicationId}/documents`,
      formData
    );
  }

  /** Download a document (returns a Blob). */
  download(documentId: string): Observable<Blob> {
    return this.http.get(
      `${this.documentsUrl}/${documentId}/download`,
      { responseType: 'blob' }
    );
  }

  /** Soft-delete a document. */
  delete(documentId: string): Observable<IApiResponse<null>> {
    return this.http.delete<IApiResponse<null>>(
      `${this.documentsUrl}/${documentId}`
    );
  }
}
