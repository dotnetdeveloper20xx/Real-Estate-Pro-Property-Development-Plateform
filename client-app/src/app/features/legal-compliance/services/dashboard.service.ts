import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { IApiResponse, IDashboardData } from '../models';

/**
 * HTTP service for retrieving legal compliance dashboard KPI data.
 * Wraps the dashboard API endpoint and returns typed Observables using the standard ApiResponse envelope.
 */
@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly baseUrl = '/api/v1/legal-dashboard';

  constructor(private readonly http: HttpClient) {}

  /** Retrieve the full legal compliance dashboard KPI data. */
  getDashboard(): Observable<IApiResponse<IDashboardData>> {
    return this.http.get<IApiResponse<IDashboardData>>(this.baseUrl);
  }
}
