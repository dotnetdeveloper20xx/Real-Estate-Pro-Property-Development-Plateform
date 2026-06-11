import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
  IApiResponse,
  IDashboardMetrics,
  IRecentActivity
} from '../models';

/**
 * HTTP service for retrieving dashboard KPI metrics and activity.
 * Wraps all API calls and returns typed Observables using the standard ApiResponse envelope.
 */
@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly baseUrl = '/api/v1/dashboard';

  constructor(private readonly http: HttpClient) {}

  /** Retrieve dashboard KPI metrics. */
  getMetrics(): Observable<IApiResponse<IDashboardMetrics>> {
    return this.http.get<IApiResponse<IDashboardMetrics>>(`${this.baseUrl}/metrics`);
  }

  /** Retrieve recent activity entries for the dashboard timeline. */
  getActivity(): Observable<IApiResponse<IRecentActivity[]>> {
    return this.http.get<IApiResponse<IRecentActivity[]>>(`${this.baseUrl}/activity`);
  }
}
