import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { IAuditEntry } from '../models/audit.model';
import { IApiResponse } from '../models';

/**
 * HTTP service for retrieving audit trail entries.
 * Provides read access to the chronological history of actions
 * performed on opportunity entities.
 */
@Injectable({ providedIn: 'root' })
export class AuditService {
  private readonly baseUrl = '/api/v1/opportunities';

  constructor(private readonly http: HttpClient) {}

  /** Retrieve all audit entries for a given opportunity. */
  getByOpportunity(opportunityId: string): Observable<IApiResponse<IAuditEntry[]>> {
    return this.http.get<IApiResponse<IAuditEntry[]>>(
      `${this.baseUrl}/${opportunityId}/audit`
    );
  }
}
