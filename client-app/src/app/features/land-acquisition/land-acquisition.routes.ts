import { Routes } from '@angular/router';
import { roleGuard } from './guards/role.guard';
import { unsavedChangesGuard } from './guards/unsaved-changes.guard';

/**
 * Land Acquisition feature routes with lazy-loaded standalone components.
 *
 * Route structure:
 *   /land-acquisition                → redirects to dashboard
 *   /land-acquisition/dashboard      → Dashboard overview (KPIs, pipeline summary, activity)
 *   /land-acquisition/pipeline       → Pipeline board (opportunities grouped by status)
 *   /land-acquisition/opportunities/new       → Create opportunity (guarded)
 *   /land-acquisition/opportunities/:id       → Opportunity detail view
 *   /land-acquisition/opportunities/:id/edit  → Edit opportunity (guarded)
 *
 * Write routes (create, edit) are protected by the roleGuard which
 * enforces AcquisitionManager or AdminSupport access.
 */
export const landAcquisitionRoutes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./containers/dashboard-page/dashboard-page.component').then(
        m => m.DashboardPageComponent
      ),
    data: { breadcrumb: 'Dashboard' }
  },
  {
    path: 'pipeline',
    loadComponent: () =>
      import('./containers/pipeline-page/pipeline-page.component').then(
        m => m.PipelinePageComponent
      ),
    data: { breadcrumb: 'Pipeline' }
  },
  {
    path: 'opportunities/new',
    loadComponent: () =>
      import('./containers/opportunity-create-page/opportunity-create-page.component').then(
        m => m.OpportunityCreatePageComponent
      ),
    canActivate: [roleGuard],
    canDeactivate: [unsavedChangesGuard],
    data: { breadcrumb: 'Create Opportunity' }
  },
  {
    path: 'opportunities/:id',
    loadComponent: () =>
      import('./containers/opportunity-detail-page/opportunity-detail-page.component').then(
        m => m.OpportunityDetailPageComponent
      ),
    data: { breadcrumb: 'Opportunity Detail' }
  },
  {
    path: 'opportunities/:id/edit',
    loadComponent: () =>
      import('./containers/opportunity-edit-page/opportunity-edit-page.component').then(
        m => m.OpportunityEditPageComponent
      ),
    canActivate: [roleGuard],
    canDeactivate: [unsavedChangesGuard],
    data: { breadcrumb: 'Edit Opportunity' }
  }
];
