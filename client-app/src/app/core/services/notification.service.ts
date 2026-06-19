import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { INotification } from '../../features/land-acquisition/models/notification.model';
import { IApiResponse } from '../../features/land-acquisition/models/shared.model';

/**
 * Application-wide notification service for managing in-app notifications.
 * Handles fetching recent notifications, marking them as read, and retrieving unread counts.
 * Lives in core/services because notifications are a platform-wide concern, not feature-specific.
 */
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly baseUrl = '/api/v1/notifications';

  constructor(private readonly http: HttpClient) {}

  /**
   * Retrieve the most recent notifications for the current user.
   * @param limit Maximum number of notifications to retrieve (default 20)
   */
  getRecent(limit: number = 20): Observable<IApiResponse<INotification[]>> {
    const params = new HttpParams().set('limit', limit.toString());
    return this.http.get<IApiResponse<INotification[]>>(this.baseUrl, { params });
  }

  /**
   * Mark a specific notification as read.
   * @param id The notification ID to mark as read
   */
  markAsRead(id: string): Observable<IApiResponse<void>> {
    return this.http.patch<IApiResponse<void>>(`${this.baseUrl}/${id}/read`, {});
  }

  /**
   * Retrieve the count of unread notifications for the current user.
   */
  getUnreadCount(): Observable<IApiResponse<{ count: number }>> {
    return this.http.get<IApiResponse<{ count: number }>>(`${this.baseUrl}/unread-count`);
  }
}
