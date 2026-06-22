import { TestBed } from '@angular/core/testing';
import { DOCUMENT } from '@angular/common';
import { ThemeEngineService } from './theme-engine.service';

describe('ThemeEngineService', () => {
  let service: ThemeEngineService;
  let document: Document;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ThemeEngineService]
    });
    service = TestBed.inject(ThemeEngineService);
    document = TestBed.inject(DOCUMENT);
  });

  afterEach(() => {
    // Clean up data-theme attribute after each test
    document.documentElement.removeAttribute('data-theme');
  });

  describe('applyTheme', () => {
    it('should set data-theme attribute on document element', () => {
      service.applyTheme('dark');

      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    });

    it('should set data-theme to corporate when applied', () => {
      service.applyTheme('corporate');

      expect(document.documentElement.getAttribute('data-theme')).toBe('corporate');
    });

    it('should fall back to light when empty string is provided', () => {
      service.applyTheme('');

      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    });

    it('should fall back to light when whitespace-only string is provided', () => {
      service.applyTheme('   ');

      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    });

    it('should trim the theme name before applying', () => {
      service.applyTheme('  dark  ');

      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    });
  });

  describe('getTheme', () => {
    it('should return light as the initial default theme', () => {
      expect(service.getTheme()).toBe('light');
    });

    it('should return the currently applied theme', () => {
      service.applyTheme('dark');

      expect(service.getTheme()).toBe('dark');
    });

    it('should return light after applying empty string', () => {
      service.applyTheme('dark');
      service.applyTheme('');

      expect(service.getTheme()).toBe('light');
    });
  });

  describe('applyDefault', () => {
    it('should set the theme to light', () => {
      service.applyTheme('dark');
      service.applyDefault();

      expect(service.getTheme()).toBe('light');
      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    });
  });

  describe('getDefaultTheme', () => {
    it('should return light', () => {
      expect(service.getDefaultTheme()).toBe('light');
    });
  });

  describe('getAvailableThemes', () => {
    it('should return the list of available themes', () => {
      const themes = service.getAvailableThemes();

      expect(themes).toContain('light');
      expect(themes).toContain('dark');
      expect(themes).toContain('corporate');
      expect(themes).toContain('business');
      expect(themes.length).toBe(4);
    });
  });
});
