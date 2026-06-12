import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { IApiResponse, IDashboardMetrics } from '../models';

/**
 * HTTP service for retrieving planning dashboard KPI metrics.
 * Wraps the planning-dashboard API endpoint and returns typed Observables.
 */
@Injectable({ providedIn: 'root' })
export class PlanningDashboardService {
  private readonly baseUrl = '/api/v1/planning-dashboard';

  constructor(private readonly http: HttpClient) {}

  /**
   * Retrieve full dashboard metrics including KPIs, status counts,
   * recent activity, and approaching deadlines.
   */
  getDashboard(): Observable<IDashboardMetrics> {
    return this.http
      .get<IApiResponse<IDashboardMetrics>>(this.baseUrl)
      .pipe(map((response) => response.data!));
  }
}
