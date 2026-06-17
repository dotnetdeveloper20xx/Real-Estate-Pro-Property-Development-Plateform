import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  IRoleListItem,
  IRoleDetail,
  ICreateRoleRequest,
  IUpdateRoleRequest,
  IPermissionMatrix,
  ITogglePermissionRequest
} from '../models/role.model';

/**
 * Admin Roles API service.
 * Provides typed HTTP methods for role management and permission matrix endpoints.
 */
@Injectable({ providedIn: 'root' })
export class RolesService {
  private readonly http = inject(HttpClient);
  private readonly rolesUrl = '/api/v1/roles';
  private readonly permissionsUrl = '/api/v1/permissions';

  /**
   * Get all roles.
   */
  getRoles(): Observable<readonly IRoleListItem[]> {
    return this.http.get<readonly IRoleListItem[]>(this.rolesUrl);
  }

  /**
   * Get a single role's full detail by ID, including permissions.
   */
  getRoleById(id: string): Observable<IRoleDetail> {
    return this.http.get<IRoleDetail>(`${this.rolesUrl}/${id}`);
  }

  /**
   * Create a new role with permissions.
   */
  createRole(request: ICreateRoleRequest): Observable<IRoleListItem> {
    return this.http.post<IRoleListItem>(this.rolesUrl, request);
  }

  /**
   * Update an existing role.
   */
  updateRole(id: string, request: IUpdateRoleRequest): Observable<IRoleListItem> {
    return this.http.put<IRoleListItem>(`${this.rolesUrl}/${id}`, request);
  }

  /**
   * Delete a role. Only non-built-in roles can be deleted.
   */
  deleteRole(id: string): Observable<void> {
    return this.http.delete<void>(`${this.rolesUrl}/${id}`);
  }

  /**
   * Get the full permission matrix (roles × permissions with assignment state).
   */
  getPermissionMatrix(): Observable<IPermissionMatrix> {
    return this.http.get<IPermissionMatrix>(`${this.permissionsUrl}/matrix`);
  }

  /**
   * Toggle a permission assignment on/off for a specific role.
   * Triggers session revocation for affected users.
   */
  togglePermission(request: ITogglePermissionRequest): Observable<void> {
    return this.http.put<void>(`${this.permissionsUrl}/toggle`, request);
  }
}
