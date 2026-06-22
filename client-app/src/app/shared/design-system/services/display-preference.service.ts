import { Injectable, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

import { ThemeEngineService } from './theme-engine.service';
import { FontScaleService } from './font-scale.service';
import { IUserPreferences, DEFAULT_USER_PREFERENCES } from './state/preferences.state';

/**
 * DisplayPreference Service
 *
 * Orchestrates user display preferences:
 *   - Loads preferences from the backend API (GET /api/v1/user-preferences)
 *   - Persists preferences to the backend API (PUT /api/v1/user-preferences)
 *   - Applies theme via ThemeEngineService
 *   - Applies font scale via FontScaleService
 *   - Applies display density via `data-density` attribute on `<html>`
 *   - Falls back to defaults (Light theme, Regular scale) on API failure
 *
 * Requirements: 13.2, 13.3, 13.6, 14.1, 14.2, 14.5, 14.6
 */
@Injectable({ providedIn: 'root' })
export class DisplayPreferenceService {
  private readonly document = inject(DOCUMENT);
  private readonly http = inject(HttpClient);
  private readonly themeEngine = inject(ThemeEngineService);
  private readonly fontScaleService = inject(FontScaleService);

  private static readonly API_URL = '/api/v1/user-preferences';

  private readonly preferencesSubject = new BehaviorSubject<IUserPreferences>(
    DEFAULT_USER_PREFERENCES
  );

  /** Observable stream of current user preferences. */
  readonly preferences$: Observable<IUserPreferences> = this.preferencesSubject.asObservable();

  /**
   * Load user preferences from the backend API.
   * On success, applies theme, font scale, and density immediately.
   * On failure, applies default preferences (Light theme, Regular scale).
   *
   * Requirements: 13.6, 14.5 — retrieve on app load.
   * Requirements: 14.6 — fallback to Light theme on failure.
   */
  loadPreferences(): Observable<IUserPreferences> {
    return this.http.get<IUserPreferences>(DisplayPreferenceService.API_URL).pipe(
      tap(prefs => {
        this.preferencesSubject.next(prefs);
        this.applyAllVisualPreferences(prefs);
      }),
      catchError(() => {
        // Fallback to defaults on any API error (network, 4xx, 5xx)
        const defaults = DEFAULT_USER_PREFERENCES;
        this.preferencesSubject.next(defaults);
        this.applyAllVisualPreferences(defaults);
        return of(defaults);
      })
    );
  }

  /**
   * Save user preferences to the backend API.
   * PUT /api/v1/user-preferences — returns 204 No Content on success.
   *
   * Requirements: 13.4, 14.3 — persist per user to backend.
   */
  savePreferences(preferences: IUserPreferences): Observable<void> {
    return this.http.put<void>(DisplayPreferenceService.API_URL, preferences).pipe(
      tap(() => {
        this.preferencesSubject.next(preferences);
      })
    );
  }

  /**
   * Apply a theme immediately via ThemeEngine.
   * Updates the internal preferences state.
   *
   * Requirements: 14.2 — apply within 100ms without reload.
   */
  applyTheme(theme: string): void {
    this.themeEngine.applyTheme(theme);
    const current = this.preferencesSubject.getValue();
    this.preferencesSubject.next({ ...current, theme });
  }

  /**
   * Apply a font scale immediately via FontScaleService.
   * Updates the internal preferences state.
   *
   * Requirements: 13.3 — apply within 300ms without reload.
   */
  applyFontScale(scale: 'small' | 'regular' | 'large'): void {
    this.fontScaleService.applyScale(scale);
    const current = this.preferencesSubject.getValue();
    this.preferencesSubject.next({ ...current, fontScale: scale });
  }

  /**
   * Apply display density by setting a `data-density` attribute on `<html>`.
   * Updates the internal preferences state.
   */
  applyDensity(density: 'compact' | 'default' | 'comfortable'): void {
    const root = this.document.documentElement;
    if (root) {
      if (density === 'default') {
        root.removeAttribute('data-density');
      } else {
        root.setAttribute('data-density', density);
      }
    }
    const current = this.preferencesSubject.getValue();
    this.preferencesSubject.next({ ...current, density });
  }

  /** Get the current preferences snapshot. */
  getCurrentPreferences(): IUserPreferences {
    return this.preferencesSubject.getValue();
  }

  /** Get the default preferences (useful for reset-to-defaults). */
  getDefaultPreferences(): IUserPreferences {
    return { ...DEFAULT_USER_PREFERENCES };
  }

  /**
   * Apply all visual preferences (theme, font scale, density) at once.
   */
  applyAllVisualPreferences(preferences: IUserPreferences): void {
    this.themeEngine.applyTheme(preferences.theme);
    this.fontScaleService.applyScale(preferences.fontScale);

    const root = this.document.documentElement;
    if (root) {
      if (preferences.density === 'default') {
        root.removeAttribute('data-density');
      } else {
        root.setAttribute('data-density', preferences.density);
      }
    }
  }
}
