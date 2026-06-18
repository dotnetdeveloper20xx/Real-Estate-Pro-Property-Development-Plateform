import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';

/**
 * Admin feature routes.
 * All routes protected by authGuard with SuperAdmin role requirement.
 */
export const adminRoutes: Routes = [
  // ── User Management ─────────────────────────────────────────────────────────
  {
    path: 'users',
    loadComponent: () =>
      import('./users/user-list/user-list.component').then(m => m.UserListComponent),
    canActivate: [authGuard],
    data: { roles: ['SuperAdmin'], breadcrumb: 'Users' }
  },
  {
    path: 'users/create',
    loadComponent: () =>
      import('./users/user-create/user-create.component').then(m => m.UserCreateComponent),
    canActivate: [authGuard],
    data: { roles: ['SuperAdmin'], breadcrumb: 'Create User' }
  },
  {
    path: 'users/:id',
    loadComponent: () =>
      import('./users/user-detail/user-detail.component').then(m => m.UserDetailComponent),
    canActivate: [authGuard],
    data: { roles: ['SuperAdmin'], breadcrumb: 'User Detail' }
  },
  {
    path: 'users/:id/edit',
    loadComponent: () =>
      import('./users/user-create/user-create.component').then(m => m.UserCreateComponent),
    canActivate: [authGuard],
    data: { roles: ['SuperAdmin'], breadcrumb: 'Edit User' }
  },

  // ── Role Management ─────────────────────────────────────────────────────────
  {
    path: 'roles',
    loadComponent: () =>
      import('./roles/role-list/role-list.component').then(
        m => m.RoleListComponent
      ),
    canActivate: [authGuard],
    data: { roles: ['SuperAdmin'], breadcrumb: 'Roles' }
  },
  {
    path: 'roles/create',
    loadComponent: () =>
      import('./roles/role-create/role-create.component').then(
        m => m.RoleCreateComponent
      ),
    canActivate: [authGuard],
    data: { roles: ['SuperAdmin'], breadcrumb: 'Create Role' }
  },

  // ── Permission Matrix ───────────────────────────────────────────────────────
  {
    path: 'permissions',
    loadComponent: () =>
      import('./roles/permission-matrix/permission-matrix.component').then(
        m => m.PermissionMatrixComponent
      ),
    canActivate: [authGuard],
    data: { roles: ['SuperAdmin'], breadcrumb: 'Permission Matrix' }
  },

  // ── Session Management ──────────────────────────────────────────────────────
  {
    path: 'sessions',
    loadComponent: () =>
      import('./sessions/session-list/session-list.component').then(
        m => m.SessionListComponent
      ),
    canActivate: [authGuard],
    data: { roles: ['SuperAdmin'], breadcrumb: 'Sessions' }
  },

  // ── Audit Logs ──────────────────────────────────────────────────────────────
  {
    path: 'audit-logs',
    loadComponent: () =>
      import('./audit-logs/audit-log-list/audit-log-list.component').then(
        m => m.AuditLogListComponent
      ),
    canActivate: [authGuard],
    data: { roles: ['SuperAdmin'], breadcrumb: 'Audit Logs' }
  },

  // ── System Settings ─────────────────────────────────────────────────────────
  {
    path: 'settings',
    loadComponent: () =>
      import('./settings/system-settings.component').then(
        m => m.SystemSettingsComponent
      ),
    canActivate: [authGuard],
    data: { roles: ['SuperAdmin'], breadcrumb: 'System Settings' }
  }
];
