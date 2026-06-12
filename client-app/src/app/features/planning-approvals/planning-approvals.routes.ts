import { Routes } from '@angular/router';
import { planningRoleGuard } from './guards/planning-role.guard';
import { unsavedChangesGuard } from './guards/unsaved-changes.guard';

/**
 * Planning & Approvals feature routes with lazy-loaded standalone components.
 *
 * Route structure:
 *   /planning-approvals                        → redirects to dashboard
 *   /planning-approvals/dashboard              → Dashboard overview (KPIs, pipeline summary, activity)
 *   /planning-approvals/pipeline               → Pipeline board (applications grouped by status)
 *   /planning-approvals/applications/create    → Create application (guarded)
 *   /planning-approvals/applications/:id       → Application detail view
 *   /planning-approvals/applications/:id/edit  → Edit application (guarded)
 *
 * All routes are protected by PlanningRoleGuard which enforces that the user
 * holds an appropriate planning role (Planning_Manager, Admin_Support,
 * Legal_Compliance_Officer, or Finance_Director).
 *
 * Write routes (create, edit) additionally use the unsavedChangesGuard
 * to prevent accidental navigation away from unsaved form data.
 *
 * Requirements: 10.5, 10.6, 10.7
 */
export const planningApprovalsRoutes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./containers/planning-dashboard/planning-dashboard.component').then(
        m => m.PlanningDashboardComponent
      ),
    canActivate: [planningRoleGuard],
    data: { breadcrumb: 'Dashboard' }
  },
  {
    path: 'pipeline',
    loadComponent: () =>
      import('./containers/planning-pipeline/planning-pipeline.component').then(
        m => m.PlanningPipelineComponent
      ),
    canActivate: [planningRoleGuard],
    data: { breadcrumb: 'Pipeline' }
  },
  {
    path: 'applications/create',
    loadComponent: () =>
      import('./containers/application-create/application-create.container').then(
        m => m.ApplicationCreateContainer
      ),
    canActivate: [planningRoleGuard],
    canDeactivate: [unsavedChangesGuard],
    data: { breadcrumb: 'Create Application' }
  },
  {
    path: 'applications/:id',
    loadComponent: () =>
      import('./containers/application-detail/application-detail.container').then(
        m => m.ApplicationDetailContainer
      ),
    canActivate: [planningRoleGuard],
    data: { breadcrumb: 'Application Detail' }
  },
  {
    path: 'applications/:id/edit',
    loadComponent: () =>
      import('./containers/application-create/application-create.container').then(
        m => m.ApplicationCreateContainer
      ),
    canActivate: [planningRoleGuard],
    canDeactivate: [unsavedChangesGuard],
    data: { breadcrumb: 'Edit Application', editMode: true }
  }
];
