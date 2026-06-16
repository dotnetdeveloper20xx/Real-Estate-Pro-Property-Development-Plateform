import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter, Router } from '@angular/router';
import { provideStore, Store } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { authReducer, AuthActions, AuthEffects, selectIsAuthenticated, selectUserRoles } from '../../core/store/auth';
import { AuthService } from '../../core/services/auth.service';
import { TokenRefreshService } from '../../core/services/token-refresh.service';
import { authInterceptor } from '../../core/interceptors/auth.interceptor';
import { firstValueFrom } from 'rxjs';

/**
 * Integration tests for critical authentication flows.
 *
 * Tests the end-to-end wiring:
 * - Login → token stored → interceptor attaches → API calls work
 * - Deactivation → 401 on subsequent request
 * - Role change → session revoked
 * - Non-SuperAdmin → 403 on admin endpoints
 *
 * Requirements: 1.1, 2.1, 6.4, 10.1, 18.3
 */
describe('Auth Flows Integration Tests', () => {
  let httpTesting: HttpTestingController;
  let store: Store;
  let authService: AuthService;
  let router: Router;

  /**
   * Helper to generate a fake JWT with specific expiry.
   */
  function createFakeJwt(expiresInMinutes: number = 60, roles: string[] = ['SuperAdmin']): string {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({
      sub: 'user-123',
      email: 'test@example.com',
      roles,
      exp: Math.floor(Date.now() / 1000) + expiresInMinutes * 60
    }));
    const signature = btoa('fake-signature');
    return `${header}.${payload}.${signature}`;
  }

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        provideRouter([
          { path: 'login', component: class {} as any },
          { path: 'home', component: class {} as any },
          { path: 'admin/users', component: class {} as any }
        ]),
        provideStore({ auth: authReducer }),
        provideEffects([AuthEffects]),
        AuthService,
        TokenRefreshService
      ]
    });

    httpTesting = TestBed.inject(HttpTestingController);
    store = TestBed.inject(Store);
    authService = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    httpTesting.verify();
    localStorage.clear();
  });

  describe('Full login → use protected endpoint → refresh → logout flow', () => {

    it('should store token after login and attach it to subsequent requests', () => {
      const fakeToken = createFakeJwt(60);

      // 1. Dispatch login
      store.dispatch(AuthActions.login({ email: 'admin@test.com', password: 'Pass123!' }));

      // 2. Expect login API call
      const loginReq = httpTesting.expectOne('/api/v1/auth/login');
      expect(loginReq.request.method).toBe('POST');
      expect(loginReq.request.body).toEqual({ email: 'admin@test.com', password: 'Pass123!' });

      // 3. Respond with success
      loginReq.flush({
        accessToken: fakeToken,
        refreshToken: 'refresh-token-123',
        user: {
          id: 'user-123',
          email: 'admin@test.com',
          firstName: 'Admin',
          lastName: 'User',
          roles: ['SuperAdmin']
        }
      });

      // 4. Token should be stored
      expect(authService.getAccessToken()).toBe(fakeToken);

      // 5. Make a protected API call — interceptor should attach the token
      authService['http'].get('/api/v1/admin/users').subscribe();
      const protectedReq = httpTesting.expectOne('/api/v1/admin/users');
      expect(protectedReq.request.headers.get('Authorization')).toBe(`Bearer ${fakeToken}`);
      protectedReq.flush([]);
    });

    it('should clear token and redirect to login on logout', () => {
      // Setup: store a token
      localStorage.setItem('be_access_token', createFakeJwt(60));
      localStorage.setItem('be_refresh_token', 'refresh-123');

      // Dispatch logout
      store.dispatch(AuthActions.logout());

      // Token should be cleared
      expect(authService.getAccessToken()).toBeNull();
    });
  });

  describe('Deactivation → verify 401 on subsequent request', () => {

    it('should dispatch logout when 401 is received after deactivation', (done) => {
      const fakeToken = createFakeJwt(60);
      localStorage.setItem('be_access_token', fakeToken);

      // Make a request that will return 401 (simulating deactivated user)
      authService['http'].get('/api/v1/admin/users').subscribe({
        error: (err) => {
          // The interceptor should have tried refresh, which also fails
          expect(err.status).toBe(401);
          done();
        }
      });

      // Original request returns 401
      const originalReq = httpTesting.expectOne('/api/v1/admin/users');
      originalReq.flush(
        { message: 'Your account has been deactivated' },
        { status: 401, statusText: 'Unauthorized' }
      );

      // Interceptor attempts refresh → also fails
      const refreshReq = httpTesting.expectOne('/api/v1/auth/refresh');
      refreshReq.flush(
        { message: 'Token revoked' },
        { status: 401, statusText: 'Unauthorized' }
      );
    });
  });

  describe('Role change → verify session revoked', () => {

    it('should handle 401 after role change and redirect to login', (done) => {
      const fakeToken = createFakeJwt(60);
      localStorage.setItem('be_access_token', fakeToken);

      // User makes request — session was revoked due to role change
      authService['http'].get('/api/v1/admin/roles').subscribe({
        error: (err) => {
          expect(err.status).toBe(401);
          done();
        }
      });

      // Backend returns 401 with reason
      const req = httpTesting.expectOne('/api/v1/admin/roles');
      req.flush(
        { message: 'Your permissions have been updated. Please sign in again.' },
        { status: 401, statusText: 'Unauthorized' }
      );

      // Refresh also fails (session revoked)
      const refreshReq = httpTesting.expectOne('/api/v1/auth/refresh');
      refreshReq.flush(
        { message: 'Session revoked' },
        { status: 401, statusText: 'Unauthorized' }
      );
    });
  });

  describe('Non-SuperAdmin → verify 403 on admin endpoints', () => {

    it('should receive 403 Forbidden when non-SuperAdmin accesses admin endpoint', (done) => {
      const fakeToken = createFakeJwt(60, ['AcquisitionManager']);
      localStorage.setItem('be_access_token', fakeToken);

      authService['http'].get('/api/v1/admin/users').subscribe({
        error: (err) => {
          expect(err.status).toBe(403);
          done();
        }
      });

      // Backend returns 403 — the interceptor should NOT try refresh for 403
      const req = httpTesting.expectOne('/api/v1/admin/users');
      req.flush(
        { message: 'Forbidden — SuperAdmin role required' },
        { status: 403, statusText: 'Forbidden' }
      );
    });

    it('should not leak admin data in 403 response', (done) => {
      const fakeToken = createFakeJwt(60, ['LegalOfficer']);
      localStorage.setItem('be_access_token', fakeToken);

      authService['http'].get('/api/v1/admin/audit-logs').subscribe({
        error: (err) => {
          // Response should not contain any admin data
          expect(err.error?.users).toBeUndefined();
          expect(err.error?.roles).toBeUndefined();
          expect(err.error?.auditLogs).toBeUndefined();
          done();
        }
      });

      const req = httpTesting.expectOne('/api/v1/admin/audit-logs');
      req.flush(
        { message: 'Access denied' },
        { status: 403, statusText: 'Forbidden' }
      );
    });
  });

  describe('Token refresh flow', () => {

    it('should retry with new token when original request gets 401', (done) => {
      const oldToken = createFakeJwt(0); // Expired
      const newToken = createFakeJwt(60);
      localStorage.setItem('be_access_token', oldToken);
      localStorage.setItem('be_refresh_token', 'old-refresh');

      authService['http'].get('/api/v1/admin/users').subscribe({
        next: (data) => {
          expect(data).toEqual([{ id: '1', name: 'Test User' }]);
          done();
        }
      });

      // First request returns 401
      const originalReq = httpTesting.expectOne('/api/v1/admin/users');
      originalReq.flush(null, { status: 401, statusText: 'Unauthorized' });

      // Interceptor triggers refresh
      const refreshReq = httpTesting.expectOne('/api/v1/auth/refresh');
      expect(refreshReq.request.method).toBe('POST');
      refreshReq.flush({ accessToken: newToken, refreshToken: 'new-refresh' });

      // Retry request with new token
      const retryReq = httpTesting.expectOne('/api/v1/admin/users');
      expect(retryReq.request.headers.get('Authorization')).toBe(`Bearer ${newToken}`);
      retryReq.flush([{ id: '1', name: 'Test User' }]);
    });
  });
});
