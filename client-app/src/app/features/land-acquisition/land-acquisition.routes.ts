import { Routes } from '@angular/router';
import { provideState } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { roleGuard } from './guards/role.guard';
import { unsavedChangesGuard } from './guards/unsaved-changes.guard';

import { opportunityReducer } from './store/opportunity';
import { dashboardReducer } from './store/dashboard';
import { OpportunityEffects } from './store/opportunity';
import { DashboardEffects } from './store/dashboard';

/**
 * Land Acquisition feature routes.
 * NgRx state is registered at each route that needs it.
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
    providers: [
      provideState('opportunities', opportunityReducer),
      provideState('dashboard', dashboardReducer),
      provideEffects([OpportunityEffects, DashboardEffects])
    ],
    data: { breadcrumb: 'Dashboard' }
  },
  {
    path: 'pipeline',
    loadComponent: () =>
      import('./containers/pipeline-page/pipeline-page.component').then(
        m => m.PipelinePageComponent
      ),
    providers: [
      provideState('opportunities', opportunityReducer),
      provideState('dashboard', dashboardReducer),
      provideEffects([OpportunityEffects, DashboardEffects])
    ],
    data: { breadcrumb: 'Pipeline' }
  },
  {
    path: 'opportunities',
    loadComponent: () =>
      import('./containers/opportunity-list-page/opportunity-list-page.component').then(
        m => m.OpportunityListPageComponent
      ),
    providers: [
      provideState('opportunities', opportunityReducer),
      provideEffects([OpportunityEffects])
    ],
    data: { breadcrumb: 'Opportunities' }
  },
  {
    path: 'opportunities/new',
    loadComponent: () =>
      import('./containers/opportunity-create-page/opportunity-create-page.component').then(
        m => m.OpportunityCreatePageComponent
      ),
    providers: [
      provideState('opportunities', opportunityReducer),
      provideEffects([OpportunityEffects])
    ],
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
    providers: [
      provideState('opportunities', opportunityReducer),
      provideEffects([OpportunityEffects])
    ],
    data: { breadcrumb: 'Opportunity Detail' }
  },
  {
    path: 'opportunities/:id/edit',
    loadComponent: () =>
      import('./containers/opportunity-edit-page/opportunity-edit-page.component').then(
        m => m.OpportunityEditPageComponent
      ),
    providers: [
      provideState('opportunities', opportunityReducer),
      provideEffects([OpportunityEffects])
    ],
    canActivate: [roleGuard],
    canDeactivate: [unsavedChangesGuard],
    data: { breadcrumb: 'Edit Opportunity' }
  }
];
