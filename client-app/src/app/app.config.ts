import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { provideStoreDevtools } from '@ngrx/store-devtools';

import { appRoutes } from './app.routes';
import { httpErrorInterceptor } from './core/interceptors';
import { responseWrapperInterceptor } from './core/interceptors/response-wrapper.interceptor';
import { applicationReducer, ApplicationEffects } from './features/planning-approvals/store/application';
import { dashboardReducer, DashboardEffects } from './features/planning-approvals/store/dashboard';

/**
 * Root application configuration for the BuildEstate Pro SPA.
 *
 * Registers:
 * - Zone-based change detection (event coalescing for performance)
 * - Router with component input binding for route params
 * - HTTP client with error interceptor
 * - NgRx root store with feature state slices
 * - NgRx effects for side-effect management
 * - NgRx DevTools (development only)
 */
export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(appRoutes, withComponentInputBinding()),
    provideHttpClient(withInterceptors([responseWrapperInterceptor, httpErrorInterceptor])),
    provideStore({
      planningApplications: applicationReducer,
      planningDashboard: dashboardReducer
    }),
    provideEffects([ApplicationEffects, DashboardEffects]),
    provideStoreDevtools({ maxAge: 25, logOnly: false })
  ]
};
