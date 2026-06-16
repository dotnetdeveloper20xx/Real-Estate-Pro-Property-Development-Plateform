import { Injectable, inject, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs';
import { AuthActions } from '../store/auth';

/** Minimum refresh delay: 45 minutes in milliseconds */
const MIN_REFRESH_OFFSET_MS = 45 * 60 * 1000;

/** Maximum refresh delay: 50 minutes in milliseconds */
const MAX_REFRESH_OFFSET_MS = 50 * 60 * 1000;

/**
 * Service responsible for scheduling silent token refresh.
 *
 * Behavior:
 * - Decodes the token expiry from the JWT
 * - Schedules a refresh between the 45-50 minute mark of the 60-minute token lifetime
 * - Dispatches AuthActions.refreshToken when the timer fires
 * - Stops any pending timer on logout or destruction
 */
@Injectable({ providedIn: 'root' })
export class TokenRefreshService implements OnDestroy {
  private readonly store = inject(Store);
  private refreshTimerSubscription: Subscription | null = null;
  private refreshTimeoutId: ReturnType<typeof setTimeout> | null = null;

  /**
   * Schedule a token refresh based on the given access token's expiry.
   * Calculates the refresh time as a random point between 45-50 minutes from now
   * (or from the token's issue time).
   */
  scheduleRefresh(accessToken: string): void {
    this.stopRefresh();

    const expiresAt = this.getTokenExpiry(accessToken);
    if (!expiresAt) {
      return;
    }

    const now = Date.now();
    const expiresIn = expiresAt - now;

    // Calculate refresh offset: random between 45 and 50 minutes
    const refreshOffset = this.randomBetween(MIN_REFRESH_OFFSET_MS, MAX_REFRESH_OFFSET_MS);

    // Time until refresh = total token lifetime minus a buffer, starting from now
    const refreshDelay = Math.max(expiresIn - (60 * 60 * 1000 - refreshOffset), 0);

    this.refreshTimeoutId = setTimeout(() => {
      this.store.dispatch(AuthActions.refreshToken());
    }, refreshDelay);
  }

  /**
   * Stop any pending refresh timer.
   * Called on logout or when the service is destroyed.
   */
  stopRefresh(): void {
    if (this.refreshTimeoutId !== null) {
      clearTimeout(this.refreshTimeoutId);
      this.refreshTimeoutId = null;
    }

    if (this.refreshTimerSubscription) {
      this.refreshTimerSubscription.unsubscribe();
      this.refreshTimerSubscription = null;
    }
  }

  ngOnDestroy(): void {
    this.stopRefresh();
  }

  /**
   * Decode the expiration timestamp from a JWT access token.
   * Returns the expiry time in milliseconds since epoch, or null if unable to decode.
   */
  private getTokenExpiry(token: string): number | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return null;
      }

      const payload = JSON.parse(atob(parts[1])) as { exp?: number };
      if (!payload.exp) {
        return null;
      }

      return payload.exp * 1000; // Convert seconds to milliseconds
    } catch {
      return null;
    }
  }

  /**
   * Generate a random integer between min and max (inclusive).
   */
  private randomBetween(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}
