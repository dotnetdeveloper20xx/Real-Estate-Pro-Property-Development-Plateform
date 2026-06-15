import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';

/**
 * Admin feature routes.
 * All routes are protected by authGuard with SuperAdmin role requirement.
 */
export const adminRoutes: Routes = [
  {
    path: 'users',
    loadComponent: () =>
      import('./users/user-management.component').then(
        m => m.UserManagementComponent
      ),
    canActivate: [authGuard],
    data: { roles: ['SuperAdmin'], breadcrumb: 'User Management' }
  },
  {
    path: 'roles',
    loadComponent: () =>
      import('./roles/role-management.component').then(
        m => m.RoleManagementComponent
      ),
    canActivate: [authGuard],
    data: { roles: ['SuperAdmin'], breadcrumb: 'Role Management' }
  }
];
