import {
  selectPreferences,
  selectPreferencesLoading,
  selectPreferencesError,
  selectTheme,
  selectFontScale,
  selectPreferencesSaving,
  selectLastSaved,
  selectDensity,
  selectDateFormat
} from './preferences.selectors';
import {
  IPreferencesState,
  IUserPreferences,
  initialPreferencesState
} from './preferences.state';

describe('PreferencesSelectors', () => {
  const mockPreferences: IUserPreferences = {
    theme: 'dark',
    fontScale: 'large',
    density: 'compact',
    dateFormat: 'YYYY-MM-DD',
    notifications: {
      inApp: true,
      email: false,
      dailyDigest: true,
      weeklyDigest: false
    }
  };

  const stateWithPreferences: IPreferencesState = {
    preferences: mockPreferences,
    loading: false,
    saving: false,
    error: null,
    lastSaved: '2024-01-15T10:30:00.000Z'
  };

  const stateWithLoading: IPreferencesState = {
    preferences: null,
    loading: true,
    saving: false,
    error: null,
    lastSaved: null
  };

  const stateWithError: IPreferencesState = {
    preferences: null,
    loading: false,
    saving: false,
    error: 'Failed to load preferences',
    lastSaved: null
  };

  describe('selectPreferences', () => {
    it('should return preferences from state', () => {
      const result = selectPreferences.projector(stateWithPreferences);

      expect(result).toEqual(mockPreferences);
    });

    it('should return null when preferences are not loaded', () => {
      const result = selectPreferences.projector(initialPreferencesState);

      expect(result).toBeNull();
    });
  });

  describe('selectPreferencesLoading', () => {
    it('should return loading status from state', () => {
      const result = selectPreferencesLoading.projector(stateWithLoading);

      expect(result).toBeTrue();
    });

    it('should return false when not loading', () => {
      const result = selectPreferencesLoading.projector(stateWithPreferences);

      expect(result).toBeFalse();
    });
  });

  describe('selectPreferencesError', () => {
    it('should return error from state', () => {
      const result = selectPreferencesError.projector(stateWithError);

      expect(result).toBe('Failed to load preferences');
    });

    it('should return null when there is no error', () => {
      const result = selectPreferencesError.projector(stateWithPreferences);

      expect(result).toBeNull();
    });
  });

  describe('selectTheme', () => {
    it('should return theme from preferences', () => {
      const result = selectTheme.projector(mockPreferences);

      expect(result).toBe('dark');
    });

    it('should return light as default when preferences are null', () => {
      const result = selectTheme.projector(null);

      expect(result).toBe('light');
    });
  });

  describe('selectFontScale', () => {
    it('should return fontScale from preferences', () => {
      const result = selectFontScale.projector(mockPreferences);

      expect(result).toBe('large');
    });

    it('should return regular as default when preferences are null', () => {
      const result = selectFontScale.projector(null);

      expect(result).toBe('regular');
    });
  });

  describe('selectPreferencesSaving', () => {
    it('should return saving status', () => {
      const savingState: IPreferencesState = {
        ...initialPreferencesState,
        saving: true
      };

      const result = selectPreferencesSaving.projector(savingState);

      expect(result).toBeTrue();
    });

    it('should return false when not saving', () => {
      const result = selectPreferencesSaving.projector(stateWithPreferences);

      expect(result).toBeFalse();
    });
  });

  describe('selectLastSaved', () => {
    it('should return lastSaved timestamp', () => {
      const result = selectLastSaved.projector(stateWithPreferences);

      expect(result).toBe('2024-01-15T10:30:00.000Z');
    });

    it('should return null when never saved', () => {
      const result = selectLastSaved.projector(initialPreferencesState);

      expect(result).toBeNull();
    });
  });

  describe('selectDensity', () => {
    it('should return density from preferences', () => {
      const result = selectDensity.projector(mockPreferences);

      expect(result).toBe('compact');
    });

    it('should return default when preferences are null', () => {
      const result = selectDensity.projector(null);

      expect(result).toBe('default');
    });
  });

  describe('selectDateFormat', () => {
    it('should return dateFormat from preferences', () => {
      const result = selectDateFormat.projector(mockPreferences);

      expect(result).toBe('YYYY-MM-DD');
    });

    it('should return DD/MM/YYYY when preferences are null', () => {
      const result = selectDateFormat.projector(null);

      expect(result).toBe('DD/MM/YYYY');
    });
  });
});
