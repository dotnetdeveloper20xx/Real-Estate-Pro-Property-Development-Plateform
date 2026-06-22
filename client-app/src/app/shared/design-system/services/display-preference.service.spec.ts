import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { DOCUMENT } from '@angular/common';
import { DisplayPreferenceService } from './display-preference.service';
import { ThemeEngineService } from './theme-engine.service';
import { FontScaleService } from './font-scale.service';
import { IUserPreferences, DEFAULT_USER_PREFERENCES } from './state/preferences.state';

describe('DisplayPreferenceService', () => {
  let service: DisplayPreferenceService;
  let httpTesting: HttpTestingController;
  let themeEngine: ThemeEngineService;
  let fontScaleService: FontScaleService;
  let document: Document;

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

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        DisplayPreferenceService,
        ThemeEngineService,
        FontScaleService
      ]
    });

    service = TestBed.inject(DisplayPreferenceService);
    httpTesting = TestBed.inject(HttpTestingController);
    themeEngine = TestBed.inject(ThemeEngineService);
    fontScaleService = TestBed.inject(FontScaleService);
    document = TestBed.inject(DOCUMENT);
  });

  afterEach(() => {
    httpTesting.verify();
    // Clean up DOM attributes
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.removeAttribute('data-scale');
    document.documentElement.removeAttribute('data-density');
  });

  describe('loadPreferences', () => {
    it('should set preferences and apply visual settings on success', () => {
      spyOn(themeEngine, 'applyTheme').and.callThrough();
      spyOn(fontScaleService, 'applyScale').and.callThrough();

      service.loadPreferences().subscribe(prefs => {
        expect(prefs).toEqual(mockPreferences);
      });

      const req = httpTesting.expectOne('/api/v1/user-preferences');
      expect(req.request.method).toBe('GET');
      req.flush(mockPreferences);

      expect(themeEngine.applyTheme).toHaveBeenCalledWith('dark');
      expect(fontScaleService.applyScale).toHaveBeenCalledWith('large');
      expect(service.getCurrentPreferences()).toEqual(mockPreferences);
    });

    it('should fall back to DEFAULT_USER_PREFERENCES on API failure', () => {
      spyOn(themeEngine, 'applyTheme').and.callThrough();
      spyOn(fontScaleService, 'applyScale').and.callThrough();

      service.loadPreferences().subscribe(prefs => {
        expect(prefs).toEqual(DEFAULT_USER_PREFERENCES);
      });

      const req = httpTesting.expectOne('/api/v1/user-preferences');
      req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });

      expect(themeEngine.applyTheme).toHaveBeenCalledWith('light');
      expect(fontScaleService.applyScale).toHaveBeenCalledWith('regular');
      expect(service.getCurrentPreferences()).toEqual(DEFAULT_USER_PREFERENCES);
    });

    it('should fall back to defaults on network error', () => {
      service.loadPreferences().subscribe(prefs => {
        expect(prefs).toEqual(DEFAULT_USER_PREFERENCES);
      });

      const req = httpTesting.expectOne('/api/v1/user-preferences');
      req.error(new ProgressEvent('Network error'));

      expect(service.getCurrentPreferences()).toEqual(DEFAULT_USER_PREFERENCES);
    });
  });

  describe('savePreferences', () => {
    it('should call PUT API with preferences', () => {
      service.savePreferences(mockPreferences).subscribe();

      const req = httpTesting.expectOne('/api/v1/user-preferences');
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(mockPreferences);
      req.flush(null, { status: 204, statusText: 'No Content' });
    });

    it('should update internal preferences on successful save', () => {
      service.savePreferences(mockPreferences).subscribe();

      const req = httpTesting.expectOne('/api/v1/user-preferences');
      req.flush(null, { status: 204, statusText: 'No Content' });

      expect(service.getCurrentPreferences()).toEqual(mockPreferences);
    });
  });

  describe('applyTheme', () => {
    it('should delegate to ThemeEngineService', () => {
      spyOn(themeEngine, 'applyTheme').and.callThrough();

      service.applyTheme('corporate');

      expect(themeEngine.applyTheme).toHaveBeenCalledWith('corporate');
    });

    it('should update internal preferences with new theme', () => {
      service.applyTheme('dark');

      expect(service.getCurrentPreferences().theme).toBe('dark');
    });
  });

  describe('applyFontScale', () => {
    it('should delegate to FontScaleService', () => {
      spyOn(fontScaleService, 'applyScale').and.callThrough();

      service.applyFontScale('large');

      expect(fontScaleService.applyScale).toHaveBeenCalledWith('large');
    });

    it('should update internal preferences with new font scale', () => {
      service.applyFontScale('small');

      expect(service.getCurrentPreferences().fontScale).toBe('small');
    });
  });

  describe('applyDensity', () => {
    it('should set data-density attribute on document element for compact', () => {
      service.applyDensity('compact');

      expect(document.documentElement.getAttribute('data-density')).toBe('compact');
    });

    it('should set data-density attribute on document element for comfortable', () => {
      service.applyDensity('comfortable');

      expect(document.documentElement.getAttribute('data-density')).toBe('comfortable');
    });

    it('should remove data-density attribute for default density', () => {
      service.applyDensity('compact');
      expect(document.documentElement.getAttribute('data-density')).toBe('compact');

      service.applyDensity('default');
      expect(document.documentElement.getAttribute('data-density')).toBeNull();
    });

    it('should update internal preferences with new density', () => {
      service.applyDensity('comfortable');

      expect(service.getCurrentPreferences().density).toBe('comfortable');
    });
  });

  describe('getDefaultPreferences', () => {
    it('should return a copy of the default preferences', () => {
      const defaults = service.getDefaultPreferences();

      expect(defaults).toEqual(DEFAULT_USER_PREFERENCES);
      expect(defaults).not.toBe(DEFAULT_USER_PREFERENCES); // must be a copy
    });
  });
});
