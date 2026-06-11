import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
  IApiResponse,
  IDocument,
  DocumentType
} from '../models';

/**
 * HTTP service for managing documents attached to an opportunity.
 * Wraps all API calls and returns typed Observables using the standard ApiResponse envelope.
 */
@Injectable({ providedIn: 'root' })
export class DocumentService {
  private readonly baseUrl = '/api/v1/opportunities';

  constructor(private readonly http: HttpClient) {}

  /** Retrieve documents for an opportunity, optionally filtered by document type. */
  getByOpportunity(
    opportunityId: string,
    docType?: DocumentType
  ): Observable<IApiResponse<IDocument[]>> {
    let params = new HttpParams();

    if (docType) {
      params = params.set('docType', docType);
    }

    return this.http.get<IApiResponse<IDocument[]>>(
      `${this.baseUrl}/${opportunityId}/documents`,
      { params }
    );
  }

  /** Upload a document for an opportunity. */
  upload(
    opportunityId: string,
    file: File,
    docType: DocumentType
  ): Observable<IApiResponse<IDocument>> {
    const formData = new FormData();
    formData.append('file', file, file.name);
    formData.append('docType', docType);

    return this.http.post<IApiResponse<IDocument>>(
      `${this.baseUrl}/${opportunityId}/documents`,
      formData
    );
  }

  /** Download a document (returns a Blob). */
  download(opportunityId: string, docId: string): Observable<Blob> {
    return this.http.get(
      `${this.baseUrl}/${opportunityId}/documents/${docId}/download`,
      { responseType: 'blob' }
    );
  }

  /** Delete a document from an opportunity. */
  delete(opportunityId: string, docId: string): Observable<IApiResponse<null>> {
    return this.http.delete<IApiResponse<null>>(
      `${this.baseUrl}/${opportunityId}/documents/${docId}`
    );
  }
}
