import { Routes } from '@angular/router';

export const propertyUnitsRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/dashboard/dashboard.component').then(
        m => m.PropertyUnitsDashboardComponent
      )
  }
];
