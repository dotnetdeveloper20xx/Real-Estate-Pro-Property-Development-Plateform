import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { IUserPreferences } from './preferences.state';

/**
 * NgRx action group for user display preferences state management.
 * Follows the [Source] Event pattern for action naming.
 *
 * Actions cover the full lifecycle of loading and saving preferences
 * via the backend API (GET/PUT /api/v1/user-preferences).
 */
export const PreferencesActions = createActionGroup({
  source: 'Preferences',
  events: {
    /** Trigger loading user preferences from the backend API */
    'Load Preferences': emptyProps(),
    /** Preferences loaded successfully from the API */
    'Load Preferences Success': props<{ preferences: IUserPreferences }>(),
    /** Failed to load preferences — apply defaults and store error */
    'Load Preferences Failure': props<{ error: string }>(),

    /** Trigger saving updated preferences to the backend API */
    'Save Preferences': props<{ preferences: IUserPreferences }>(),
    /** Preferences saved successfully to the API */
    'Save Preferences Success': props<{ preferences: IUserPreferences }>(),
    /** Failed to save preferences — store error */
    'Save Preferences Failure': props<{ error: string }>(),
  },
});
