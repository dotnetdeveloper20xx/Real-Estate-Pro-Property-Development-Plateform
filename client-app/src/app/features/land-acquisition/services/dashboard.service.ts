import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { IApiResponse, IDashboardMetrics } from '../models';

/**
 * HTTP service for retrieving comprehensive dashboard data.
 * Single endpoint returns all KPIs, alerts, activity, and chart data.
 */
@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly baseUrl = '/api/v1/dashboard';

  constructor(private readonly http: HttpClient) {}

  /** Retrieve full dashboard data including metrics, alerts, and activity. */
  getMetrics(): Observable<IApiResponse<IDashboardMetrics>> {
    return this.http.get<IApiResponse<IDashboardMetrics>>(`${this.baseUrl}/metrics`);
  }
}
