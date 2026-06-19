import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

/**
 * Root application routes.
 *
 * Each feature module is lazy-loaded via loadChildren to reduce initial bundle size.
 * The router will only download the feature code when the user navigates to that path.
 *
 * Profile and Settings are top-level utility pages accessible from the user dropdown menu.
 * Admin routes are protected by authGuard with SuperAdmin role requirement.
 */
export const appRoutes: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login.component').then(
        m => m.LoginComponent
      ),
    data: { breadcrumb: 'Login', icon: 'login' }
  },
  {
    path: 'home',
    loadComponent: () =>
      import('./features/home/home.component').then(
        m => m.HomeComponent
      ),
    data: { breadcrumb: 'Home', icon: 'home' }
  },
  {
    path: 'profile',
    loadComponent: () =>
      import('./features/profile/profile.component').then(
        m => m.ProfileComponent
      ),
    data: { breadcrumb: 'Profile', icon: 'person' }
  },
  {
    path: 'settings',
    loadComponent: () =>
      import('./features/settings/settings.component').then(
        m => m.SettingsComponent
      ),
    data: { breadcrumb: 'Settings', icon: 'settings' }
  },
  {
    path: 'land-acquisition',
    loadChildren: () =>
      import('./features/land-acquisition/land-acquisition.routes').then(
        m => m.landAcquisitionRoutes
      ),
    canActivate: [authGuard],
    data: { breadcrumb: 'Land Acquisition', icon: 'terrain' }
  },
  {
    path: 'planning-approvals',
    loadChildren: () =>
      import('./features/planning-approvals/planning-approvals.routes').then(
        m => m.planningApprovalsRoutes
      ),
    data: { breadcrumb: 'Planning & Approvals', icon: 'assignment' }
  },
  {
    path: 'legal-compliance',
    loadChildren: () =>
      import('./features/legal-compliance/legal-compliance.routes').then(
        m => m.legalComplianceRoutes
      ),
    data: { breadcrumb: 'Legal & Compliance', icon: 'gavel' }
  },
  {
    path: 'project-management',
    loadChildren: () =>
      import('./features/project-management/project-management.routes').then(
        m => m.projectManagementRoutes
      ),
    data: { breadcrumb: 'Project Management', icon: 'engineering' }
  },
  {
    path: 'construction',
    loadChildren: () =>
      import('./features/construction/construction.routes').then(
        m => m.constructionRoutes
      ),
    data: { breadcrumb: 'Construction', icon: 'construction' }
  },
  {
    path: 'finance',
    loadChildren: () =>
      import('./features/finance/finance.routes').then(
        m => m.financeRoutes
      ),
    data: { breadcrumb: 'Finance & Budget', icon: 'account_balance' }
  },
  {
    path: 'property-units',
    loadChildren: () =>
      import('./features/property-units/property-units.routes').then(
        m => m.propertyUnitsRoutes
      ),
    data: { breadcrumb: 'Property Units', icon: 'apartment' }
  },
  {
    path: 'sales',
    loadChildren: () =>
      import('./features/sales/sales.routes').then(
        m => m.salesRoutes
      ),
    data: { breadcrumb: 'Sales & Marketing', icon: 'storefront' }
  },
  {
    path: 'documents',
    loadChildren: () =>
      import('./features/documents/documents.routes').then(
        m => m.documentsRoutes
      ),
    data: { breadcrumb: 'Documents', icon: 'folder_open' }
  },
  {
    path: 'reports',
    loadChildren: () =>
      import('./features/reports/reports.routes').then(
        m => m.reportsRoutes
      ),
    data: { breadcrumb: 'Reports', icon: 'analytics' }
  },
  {
    path: 'admin',
    loadChildren: () =>
      import('./features/admin/admin.routes').then(
        m => m.adminRoutes
      ),
    canActivate: [authGuard],
    data: { breadcrumb: 'Administration', icon: 'admin_panel_settings', roles: ['SuperAdmin'] }
  },
  {
    path: '**',
    redirectTo: 'home'
  }
];
