/**
 * NgRx state interface for the display preferences feature slice.
 * Manages user display preferences (theme, font scale, density, notifications, date format)
 * and tracks loading/saving/error states for API operations.
 */

/**
 * User notification preferences configuration.
 */
export interface INotificationPreferences {
  readonly inApp: boolean;
  readonly email: boolean;
  readonly dailyDigest: boolean;
  readonly weeklyDigest: boolean;
}

/**
 * Complete user display preferences persisted to the backend.
 * Endpoint: GET/PUT /api/v1/user-preferences
 */
export interface IUserPreferences {
  readonly theme: string;
  readonly fontScale: 'small' | 'regular' | 'large';
  readonly density: 'compact' | 'default' | 'comfortable';
  readonly dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
  readonly notifications: INotificationPreferences;
}

/**
 * NgRx state slice for the preferences feature.
 */
export interface IPreferencesState {
  /** The current user preferences (null if not yet loaded) */
  readonly preferences: IUserPreferences | null;
  /** Whether preferences are currently being loaded from the API */
  readonly loading: boolean;
  /** Whether preferences are currently being saved to the API */
  readonly saving: boolean;
  /** The latest error message (null if no error) */
  readonly error: string | null;
  /** ISO timestamp of the last successful save (null if never saved) */
  readonly lastSaved: string | null;
}

/**
 * Default user preferences — applied when no stored preference exists
 * or when API retrieval fails.
 */
export const DEFAULT_USER_PREFERENCES: IUserPreferences = {
  theme: 'light',
  fontScale: 'regular',
  density: 'default',
  dateFormat: 'DD/MM/YYYY',
  notifications: {
    inApp: true,
    email: true,
    dailyDigest: false,
    weeklyDigest: false,
  },
};

/**
 * Initial preferences state — no preferences loaded, no operations in progress.
 */
export const initialPreferencesState: IPreferencesState = {
  preferences: null,
  loading: false,
  saving: false,
  error: null,
  lastSaved: null,
};
