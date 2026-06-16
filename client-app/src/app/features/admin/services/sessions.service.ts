import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ISessionItem } from '../models/user.model';

/**
 * Admin Sessions API service.
 * Provides typed HTTP methods for session listing and revocation.
 */
@Injectable({ providedIn: 'root' })
export class SessionsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/v1/sessions';

  /**
   * Get all active sessions for a specific user.
   */
  getUserSessions(userId: string): Observable<readonly ISessionItem[]> {
    return this.http.get<readonly ISessionItem[]>(`${this.baseUrl}/user/${userId}`);
  }

  /**
   * Revoke a single session by session ID.
   */
  revokeSession(sessionId: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${sessionId}/revoke`, {});
  }

  /**
   * Revoke all sessions for a specific user.
   */
  revokeAllUserSessions(userId: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/user/${userId}/revoke-all`, {});
  }
}
