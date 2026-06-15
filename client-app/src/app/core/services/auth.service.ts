import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap, catchError, of } from 'rxjs';

/**
 * Represents the authenticated user's profile.
 */
export interface ICurrentUser {
  readonly id: string;
  readonly email: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly roles: string[];
}

/**
 * Response payload from the login endpoint.
 */
export interface ILoginResponse {
  readonly accessToken: string;
  readonly refreshToken: string;
  readonly user: ICurrentUser;
}

/** LocalStorage keys for token persistence. */
const TOKEN_KEYS = {
  ACCESS: 'be_access_token',
  REFRESH: 'be_refresh_token',
  USER: 'be_current_user'
} as const;

/**
 * Core authentication service for BuildEstate Pro.
 *
 * Responsibilities:
 * - Login / logout / token refresh
 * - Token storage in localStorage
 * - Current user state management via BehaviorSubject
 * - Role-based access checks
 * - Session restoration on app init via loadUserProfile()
 *
 * Dev mode behavior:
 * - When no token exists and isDevMode is true, the app still functions
 *   because the backend DevAuthMiddleware injects dev claims.
 * - Once a user explicitly logs in, isDevMode switches to false.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly currentUserSubject = new BehaviorSubject<ICurrentUser | null>(
    this.loadStoredUser()
  );

  /** Observable stream of the current authenticated user (null if not authenticated). */
  readonly currentUser$ = this.currentUserSubject.asObservable();

  /**
   * Dev mode flag — defaults to true.
   * When a user explicitly logs in, this switches to false (real auth mode).
   * In dev mode, the auth guard allows all navigation.
   */
  private _isDevMode = !this.getAccessToken();

  get isDevMode(): boolean {
    return this._isDevMode;
  }

  /**
   * Authenticate a user with email and password.
   * On success: stores tokens, sets current user, disables dev mode.
   */
  login(email: string, password: string): Observable<ILoginResponse> {
    return this.http.post<ILoginResponse>('/api/v1/auth/login', { email, password }).pipe(
      tap((response) => {
        this.storeTokens(response.accessToken, response.refreshToken);
        this.storeUser(response.user);
        this.currentUserSubject.next(response.user);
        this._isDevMode = false;
      })
    );
  }

  /**
   * Log out the current user.
   * Clears local storage, notifies backend, and redirects to login.
   */
  logout(): void {
    const token = this.getAccessToken();

    // Clear local state immediately
    this.clearStorage();
    this.currentUserSubject.next(null);
    this._isDevMode = true;

    // Notify backend (fire-and-forget)
    if (token) {
      this.http.post('/api/v1/auth/logout', {}).pipe(
        catchError(() => of(null))
      ).subscribe();
    }

    this.router.navigate(['/login']);
  }

  /**
   * Refresh the access token using the stored refresh token.
   */
  refreshToken(): Observable<{ accessToken: string; refreshToken: string }> {
    const refreshToken = this.getRefreshToken();
    return this.http.post<{ accessToken: string; refreshToken: string }>(
      '/api/v1/auth/refresh',
      { refreshToken }
    ).pipe(
      tap((response) => {
        this.storeTokens(response.accessToken, response.refreshToken);
      })
    );
  }

  /**
   * Get the current access token from localStorage.
   */
  getAccessToken(): string | null {
    return localStorage.getItem(TOKEN_KEYS.ACCESS);
  }

  /**
   * Get the current refresh token from localStorage.
   */
  getRefreshToken(): string | null {
    return localStorage.getItem(TOKEN_KEYS.REFRESH);
  }

  /**
   * Check if the user is authenticated.
   * Returns true if a token exists OR if running in dev mode.
   */
  isAuthenticated(): boolean {
    if (this._isDevMode) {
      return true;
    }
    return !!this.getAccessToken();
  }

  /**
   * Get the current user synchronously.
   */
  getCurrentUser(): ICurrentUser | null {
    return this.currentUserSubject.getValue();
  }

  /**
   * Check if the current user has a specific role.
   */
  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    if (!user) return this._isDevMode;
    return user.roles.includes(role);
  }

  /**
   * Check if the current user has any of the specified roles.
   */
  hasAnyRole(roles: string[]): boolean {
    const user = this.getCurrentUser();
    if (!user) return this._isDevMode;
    return roles.some(role => user.roles.includes(role));
  }

  /**
   * Load the user profile from the backend on app initialization.
   * If a token exists, calls GET /auth/me to restore the session.
   */
  loadUserProfile(): void {
    const token = this.getAccessToken();
    if (!token) {
      return;
    }

    this._isDevMode = false;
    this.http.get<ICurrentUser>('/api/v1/auth/me').pipe(
      catchError(() => {
        // Token might be expired — clear and switch to dev mode
        this.clearStorage();
        this._isDevMode = true;
        return of(null);
      })
    ).subscribe((user) => {
      if (user) {
        this.storeUser(user);
        this.currentUserSubject.next(user);
      }
    });
  }

  // ── Private helpers ─────────────────────────────────────────────────────────

  private storeTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem(TOKEN_KEYS.ACCESS, accessToken);
    localStorage.setItem(TOKEN_KEYS.REFRESH, refreshToken);
  }

  private storeUser(user: ICurrentUser): void {
    localStorage.setItem(TOKEN_KEYS.USER, JSON.stringify(user));
  }

  private clearStorage(): void {
    localStorage.removeItem(TOKEN_KEYS.ACCESS);
    localStorage.removeItem(TOKEN_KEYS.REFRESH);
    localStorage.removeItem(TOKEN_KEYS.USER);
  }

  private loadStoredUser(): ICurrentUser | null {
    const stored = localStorage.getItem(TOKEN_KEYS.USER);
    if (!stored) return null;
    try {
      return JSON.parse(stored) as ICurrentUser;
    } catch {
      return null;
    }
  }
}
