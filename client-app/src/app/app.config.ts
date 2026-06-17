import { ApplicationConfig, provideZoneChangeDetection, APP_INITIALIZER, inject } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { provideStoreDevtools } from '@ngrx/store-devtools';

import { appRoutes } from './app.routes';
import { httpErrorInterceptor } from './core/interceptors';
import { responseWrapperInterceptor } from './core/interceptors/response-wrapper.interceptor';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { AuthService } from './core/services/auth.service';
import { ThemeService } from './core/services/theme.service';
import { authReducer, AuthEffects } from './core/store/auth';
import { applicationReducer, ApplicationEffects } from './features/planning-approvals/store/application';
import { dashboardReducer, DashboardEffects } from './features/planning-approvals/store/dashboard';
import { usersReducer, UsersEffects } from './features/admin/store/users';
import { rolesReducer, RolesEffects } from './features/admin/store/roles';
import { sessionsReducer, SessionsEffects } from './features/admin/store/sessions';
import { auditLogsReducer, AuditLogsEffects } from './features/admin/store/audit-logs';

/**
 * App initializer that loads the current user profile on startup
 * and initializes the theme service to apply the persisted theme.
 * If a token exists in localStorage, fetches user from /auth/me to restore session.
 */
function initializeApp(): () => void {
  const authService = inject(AuthService);
  // Inject ThemeService to trigger constructor, which applies the stored theme
  inject(ThemeService);
  return () => authService.loadUserProfile();
}

/**
 * Root application configuration for the BuildEstate Pro SPA.
 *
 * Registers:
 * - Zone-based change detection (event coalescing for performance)
 * - Router with component input binding for route params
 * - HTTP client with auth and error interceptors
 * - App initializer for auth session restoration
 * - NgRx root store with feature state slices
 * - NgRx effects for side-effect management
 * - NgRx DevTools (development only)
 */
export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(appRoutes, withComponentInputBinding()),
    provideHttpClient(withInterceptors([authInterceptor, responseWrapperInterceptor, httpErrorInterceptor])),
    {
      provide: APP_INITIALIZER,
      useFactory: initializeApp,
      multi: true
    },
    provideStore({
      auth: authReducer,
      planningApplications: applicationReducer,
      planningDashboard: dashboardReducer,
      adminUsers: usersReducer,
      adminRoles: rolesReducer,
      adminSessions: sessionsReducer,
      adminAuditLogs: auditLogsReducer
    }),
    provideEffects([AuthEffects, ApplicationEffects, DashboardEffects, UsersEffects, RolesEffects, SessionsEffects, AuditLogsEffects]),
    provideStoreDevtools({ maxAge: 25, logOnly: false })
  ]
};
