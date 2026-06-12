import { Routes } from '@angular/router';

/**
 * Root application routes.
 *
 * Each feature module is lazy-loaded via loadChildren to reduce initial bundle size.
 * The router will only download the feature code when the user navigates to that path.
 */
export const appRoutes: Routes = [
  {
    path: '',
    redirectTo: 'land-acquisition',
    pathMatch: 'full'
  },
  {
    path: 'land-acquisition',
    loadChildren: () =>
      import('./features/land-acquisition/land-acquisition.routes').then(
        m => m.landAcquisitionRoutes
      ),
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
    path: '**',
    redirectTo: 'land-acquisition'
  }
];
