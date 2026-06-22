import { createFeatureSelector, createSelector } from '@ngrx/store';
import { IPreferencesState } from './preferences.state';

/**
 * Feature selector for the preferences state slice.
 */
export const selectPreferencesState = createFeatureSelector<IPreferencesState>('preferences');

/**
 * Select the current user preferences (null if not yet loaded).
 */
export const selectPreferences = createSelector(
  selectPreferencesState,
  (state: IPreferencesState) => state.preferences
);

/**
 * Select whether preferences are currently being loaded from the API.
 */
export const selectPreferencesLoading = createSelector(
  selectPreferencesState,
  (state: IPreferencesState) => state.loading
);

/**
 * Select whether preferences are currently being saved to the API.
 */
export const selectPreferencesSaving = createSelector(
  selectPreferencesState,
  (state: IPreferencesState) => state.saving
);

/**
 * Select the current preferences error message (null if no error).
 */
export const selectPreferencesError = createSelector(
  selectPreferencesState,
  (state: IPreferencesState) => state.error
);

/**
 * Select the ISO timestamp of the last successful preferences save.
 */
export const selectLastSaved = createSelector(
  selectPreferencesState,
  (state: IPreferencesState) => state.lastSaved
);

/**
 * Select the user's active theme preference.
 */
export const selectTheme = createSelector(
  selectPreferences,
  (preferences) => preferences?.theme ?? 'light'
);

/**
 * Select the user's active font scale preference.
 */
export const selectFontScale = createSelector(
  selectPreferences,
  (preferences) => preferences?.fontScale ?? 'regular'
);

/**
 * Select the user's active density preference.
 */
export const selectDensity = createSelector(
  selectPreferences,
  (preferences) => preferences?.density ?? 'default'
);

/**
 * Select the user's active date format preference.
 */
export const selectDateFormat = createSelector(
  selectPreferences,
  (preferences) => preferences?.dateFormat ?? 'DD/MM/YYYY'
);
