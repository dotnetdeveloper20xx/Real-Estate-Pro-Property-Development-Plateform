import { createReducer, on } from '@ngrx/store';
import { IPreferencesState, initialPreferencesState } from './preferences.state';
import { PreferencesActions } from './preferences.actions';

/**
 * Preferences reducer handling all display-preferences-related actions.
 * Manages loading/saving states, error messages, and the lastSaved timestamp.
 */
export const preferencesReducer = createReducer(
  initialPreferencesState,

  // ── Load Preferences ────────────────────────────────────────────────────────
  on(PreferencesActions.loadPreferences, (state): IPreferencesState => ({
    ...state,
    loading: true,
    error: null,
  })),

  on(PreferencesActions.loadPreferencesSuccess, (state, { preferences }): IPreferencesState => ({
    ...state,
    preferences,
    loading: false,
    error: null,
  })),

  on(PreferencesActions.loadPreferencesFailure, (state, { error }): IPreferencesState => ({
    ...state,
    loading: false,
    error,
  })),

  // ── Save Preferences ────────────────────────────────────────────────────────
  on(PreferencesActions.savePreferences, (state): IPreferencesState => ({
    ...state,
    saving: true,
    error: null,
  })),

  on(PreferencesActions.savePreferencesSuccess, (state, { preferences }): IPreferencesState => ({
    ...state,
    preferences,
    saving: false,
    error: null,
    lastSaved: new Date().toISOString(),
  })),

  on(PreferencesActions.savePreferencesFailure, (state, { error }): IPreferencesState => ({
    ...state,
    saving: false,
    error,
  })),
);
