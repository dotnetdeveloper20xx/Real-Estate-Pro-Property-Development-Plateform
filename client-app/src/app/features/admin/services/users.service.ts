import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  IUserListItem,
  IUserDetail,
  ICreateUserRequest,
  IUpdateUserRequest,
  IResetPasswordRequest,
  IBulkImportResponse,
  IPagedUsersResponse,
  IUsersQueryParams
} from '../models/user.model';

/**
 * Admin Users API service.
 * Provides typed HTTP methods for all user management admin endpoints.
 */
@Injectable({ providedIn: 'root' })
export class UsersService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/v1/admin/users';

  /**
   * Get paginated list of users with search and filter support.
   */
  getUsers(params: IUsersQueryParams): Observable<IPagedUsersResponse> {
    let httpParams = new HttpParams()
      .set('page', params.page.toString())
      .set('pageSize', params.pageSize.toString());

    if (params.search) {
      httpParams = httpParams.set('search', params.search);
    }

    if (params.statusFilter && params.statusFilter !== 'All') {
      httpParams = httpParams.set('status', params.statusFilter);
    }

    return this.http.get<IPagedUsersResponse>(this.baseUrl, { params: httpParams });
  }

  /**
   * Get a single user's full detail by ID.
   */
  getUserById(id: string): Observable<IUserDetail> {
    return this.http.get<IUserDetail>(`${this.baseUrl}/${id}`);
  }

  /**
   * Create a new user.
   */
  createUser(request: ICreateUserRequest): Observable<IUserListItem> {
    return this.http.post<IUserListItem>(this.baseUrl, request);
  }

  /**
   * Update an existing user.
   */
  updateUser(id: string, request: IUpdateUserRequest): Observable<IUserListItem> {
    return this.http.put<IUserListItem>(`${this.baseUrl}/${id}`, request);
  }

  /**
   * Deactivate a user account. Immediately revokes all sessions.
   */
  deactivateUser(id: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${id}/deactivate`, {});
  }

  /**
   * Reactivate a previously deactivated user account.
   */
  reactivateUser(id: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${id}/reactivate`, {});
  }

  /**
   * Reset a user's password. Revokes all sessions.
   */
  resetPassword(request: IResetPasswordRequest): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${request.userId}/reset-password`, {
      newPassword: request.newPassword
    });
  }

  /**
   * Bulk import users from a CSV file.
   */
  bulkImport(file: File): Observable<IBulkImportResponse> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<IBulkImportResponse>(`${this.baseUrl}/bulk-import`, formData);
  }
}
