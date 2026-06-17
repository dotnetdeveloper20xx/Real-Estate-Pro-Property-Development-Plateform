import { Injectable } from '@angular/core';

/**
 * Theme management service for BuildEstate Pro.
 *
 * Responsibilities:
 * - Reads persisted theme from localStorage on init
 * - Applies theme by setting data-theme attribute on <html>
 * - Provides setTheme/getTheme methods for components
 * - Available themes: light, dark, corporate, business
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private static readonly STORAGE_KEY = 'be_theme';
  private static readonly DEFAULT_THEME = 'light';
  private static readonly AVAILABLE_THEMES = ['light', 'dark', 'corporate', 'business'] as const;

  private currentTheme: string;

  constructor() {
    this.currentTheme = this.loadStoredTheme();
    this.applyTheme(this.currentTheme);
  }

  /** Get the list of available themes. */
  getAvailableThemes(): readonly string[] {
    return ThemeService.AVAILABLE_THEMES;
  }

  /** Get the currently active theme. */
  getTheme(): string {
    return this.currentTheme;
  }

  /** Set and persist a new theme. */
  setTheme(theme: string): void {
    if (!ThemeService.AVAILABLE_THEMES.includes(theme as typeof ThemeService.AVAILABLE_THEMES[number])) {
      return;
    }
    this.currentTheme = theme;
    this.applyTheme(theme);
    localStorage.setItem(ThemeService.STORAGE_KEY, theme);
  }

  /** Apply theme to the document root element. */
  private applyTheme(theme: string): void {
    document.documentElement.setAttribute('data-theme', theme);
  }

  /** Load theme from localStorage or return default. */
  private loadStoredTheme(): string {
    const stored = localStorage.getItem(ThemeService.STORAGE_KEY);
    if (stored && ThemeService.AVAILABLE_THEMES.includes(stored as typeof ThemeService.AVAILABLE_THEMES[number])) {
      return stored;
    }
    return ThemeService.DEFAULT_THEME;
  }
}
