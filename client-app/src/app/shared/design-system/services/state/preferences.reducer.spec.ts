import { preferencesReducer } from './preferences.reducer';
import { PreferencesActions } from './preferences.actions';
import {
  IPreferencesState,
  IUserPreferences,
  initialPreferencesState
} from './preferences.state';

describe('PreferencesReducer', () => {
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

  describe('initialState', () => {
    it('should match expected defaults', () => {
      const action = { type: 'NOOP' } as never;
      const state = preferencesReducer(undefined, action);

      expect(state).toEqual(initialPreferencesState);
      expect(state.preferences).toBeNull();
      expect(state.loading).toBeFalse();
      expect(state.saving).toBeFalse();
      expect(state.error).toBeNull();
      expect(state.lastSaved).toBeNull();
    });
  });

  describe('loadPreferences', () => {
    it('should set loading to true and clear error', () => {
      const stateWithError: IPreferencesState = {
        ...initialPreferencesState,
        error: 'Previous error'
      };

      const state = preferencesReducer(
        stateWithError,
        PreferencesActions.loadPreferences()
      );

      expect(state.loading).toBeTrue();
      expect(state.error).toBeNull();
    });
  });

  describe('loadPreferencesSuccess', () => {
    it('should set preferences and set loading to false', () => {
      const loadingState: IPreferencesState = {
        ...initialPreferencesState,
        loading: true
      };

      const state = preferencesReducer(
        loadingState,
        PreferencesActions.loadPreferencesSuccess({ preferences: mockPreferences })
      );

      expect(state.preferences).toEqual(mockPreferences);
      expect(state.loading).toBeFalse();
      expect(state.error).toBeNull();
    });
  });

  describe('loadPreferencesFailure', () => {
    it('should set error and set loading to false', () => {
      const loadingState: IPreferencesState = {
        ...initialPreferencesState,
        loading: true
      };

      const state = preferencesReducer(
        loadingState,
        PreferencesActions.loadPreferencesFailure({ error: 'Network error' })
      );

      expect(state.loading).toBeFalse();
      expect(state.error).toBe('Network error');
    });
  });

  describe('savePreferences', () => {
    it('should set saving to true and clear error', () => {
      const stateWithError: IPreferencesState = {
        ...initialPreferencesState,
        preferences: mockPreferences,
        error: 'Previous error'
      };

      const state = preferencesReducer(
        stateWithError,
        PreferencesActions.savePreferences({ preferences: mockPreferences })
      );

      expect(state.saving).toBeTrue();
      expect(state.error).toBeNull();
    });
  });

  describe('savePreferencesSuccess', () => {
    it('should set preferences, saving to false, and update lastSaved', () => {
      const savingState: IPreferencesState = {
        ...initialPreferencesState,
        saving: true
      };

      const state = preferencesReducer(
        savingState,
        PreferencesActions.savePreferencesSuccess({ preferences: mockPreferences })
      );

      expect(state.preferences).toEqual(mockPreferences);
      expect(state.saving).toBeFalse();
      expect(state.error).toBeNull();
      expect(state.lastSaved).not.toBeNull();
      // Verify lastSaved is a valid ISO string
      const lastSaved = state.lastSaved as string;
      expect(new Date(lastSaved).toISOString()).toBe(lastSaved);
    });
  });

  describe('savePreferencesFailure', () => {
    it('should set error and set saving to false', () => {
      const savingState: IPreferencesState = {
        ...initialPreferencesState,
        saving: true
      };

      const state = preferencesReducer(
        savingState,
        PreferencesActions.savePreferencesFailure({ error: 'Save failed' })
      );

      expect(state.saving).toBeFalse();
      expect(state.error).toBe('Save failed');
    });
  });

  describe('state immutability', () => {
    it('should not mutate the previous state', () => {
      const previousState: IPreferencesState = {
        ...initialPreferencesState
      };
      const frozenState = Object.freeze(previousState);

      // Should not throw when reducer creates new state
      const newState = preferencesReducer(
        frozenState as IPreferencesState,
        PreferencesActions.loadPreferences()
      );

      expect(newState).not.toBe(previousState);
      expect(newState.loading).toBeTrue();
    });
  });
});
