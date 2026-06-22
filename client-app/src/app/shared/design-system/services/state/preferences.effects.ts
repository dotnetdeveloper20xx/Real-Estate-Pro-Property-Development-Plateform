import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { map, exhaustMap, catchError, tap } from 'rxjs/operators';
import { PreferencesActions } from './preferences.actions';
import { DisplayPreferenceService } from '../display-preference.service';
import { IUserPreferences, DEFAULT_USER_PREFERENCES } from './preferences.state';

/**
 * NgRx effects for user display preferences side effects.
 * Handles API calls to load/save preferences and applies visual changes
 * (theme, font scale, density) to the DOM via DisplayPreferenceService.
 */
@Injectable()
export class PreferencesEffects {
  private readonly actions$ = inject(Actions);
  private readonly http = inject(HttpClient);
  private readonly displayPreferenceService = inject(DisplayPreferenceService);

  private static readonly API_URL = '/api/v1/user-preferences';

  /**
   * Load preferences effect: calls GET /api/v1/user-preferences directly.
   * On success, dispatches loadPreferencesSuccess with the retrieved preferences.
   * On failure, dispatches loadPreferencesFailure with the error message.
   *
   * Note: Uses HttpClient directly to properly propagate API errors to NgRx state,
   * since DisplayPreferenceService.loadPreferences() swallows errors and returns defaults.
   */
  readonly loadPreferences$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PreferencesActions.loadPreferences),
      exhaustMap(() =>
        this.http.get<IUserPreferences>(PreferencesEffects.API_URL).pipe(
          map((preferences) => PreferencesActions.loadPreferencesSuccess({ preferences })),
          catchError((error: { error?: { message?: string }; message?: string }) => {
            const message = error.error?.message ?? error.message ?? 'Failed to load preferences.';
            return of(PreferencesActions.loadPreferencesFailure({ error: message }));
          })
        )
      )
    )
  );

  /**
   * After preferences are loaded successfully, apply the visual settings
   * (theme, font scale, density) to the DOM.
   */
  readonly loadPreferencesSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(PreferencesActions.loadPreferencesSuccess),
        tap(({ preferences }) => {
          this.displayPreferenceService.applyAllVisualPreferences(preferences);
        })
      ),
    { dispatch: false }
  );

  /**
   * On load failure, apply default visual preferences so the user
   * has a consistent UI even when the API is unreachable.
   */
  readonly loadPreferencesFailure$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(PreferencesActions.loadPreferencesFailure),
        tap(() => {
          this.displayPreferenceService.applyAllVisualPreferences(DEFAULT_USER_PREFERENCES);
        })
      ),
    { dispatch: false }
  );

  /**
   * Save preferences effect: calls PUT /api/v1/user-preferences directly.
   * On success, dispatches savePreferencesSuccess with the saved preferences.
   * On failure, dispatches savePreferencesFailure with the error message.
   */
  readonly savePreferences$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PreferencesActions.savePreferences),
      exhaustMap(({ preferences }) =>
        this.http.put<void>(PreferencesEffects.API_URL, preferences).pipe(
          map(() => PreferencesActions.savePreferencesSuccess({ preferences })),
          catchError((error: { error?: { message?: string }; message?: string }) => {
            const message = error.error?.message ?? error.message ?? 'Failed to save preferences.';
            return of(PreferencesActions.savePreferencesFailure({ error: message }));
          })
        )
      )
    )
  );

  /**
   * After preferences are saved successfully, apply the updated visual
   * settings (theme, font scale, density) to the DOM.
   */
  readonly savePreferencesSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(PreferencesActions.savePreferencesSuccess),
        tap(({ preferences }) => {
          this.displayPreferenceService.applyAllVisualPreferences(preferences);
        })
      ),
    { dispatch: false }
  );
}
