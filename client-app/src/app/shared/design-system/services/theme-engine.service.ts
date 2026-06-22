import { Injectable, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';

/**
 * ThemeEngine Service
 *
 * Manages the application theme by setting the DaisyUI `data-theme` attribute
 * on the `<html>` element. Supports Light, Dark, Corporate, Business, and
 * custom themes without page reload.
 *
 * Requirements: 14.1, 14.2, 14.6
 */
@Injectable({ providedIn: 'root' })
export class ThemeEngineService {
  private readonly document = inject(DOCUMENT);

  private static readonly DEFAULT_THEME = 'light';
  private static readonly AVAILABLE_THEMES: readonly string[] = [
    'light',
    'dark',
    'corporate',
    'business'
  ];

  private currentTheme = ThemeEngineService.DEFAULT_THEME;

  /** Get the currently active theme name. */
  getTheme(): string {
    return this.currentTheme;
  }

  /** Get the default theme name used as fallback. */
  getDefaultTheme(): string {
    return ThemeEngineService.DEFAULT_THEME;
  }

  /** Get the list of built-in available themes. */
  getAvailableThemes(): readonly string[] {
    return ThemeEngineService.AVAILABLE_THEMES;
  }

  /**
   * Apply a theme by setting the `data-theme` attribute on the `<html>` element.
   * Falls back to the default (Light) theme if the provided value is empty or null.
   *
   * Requirements: 14.2 — apply within 100ms without page reload.
   * Requirements: 14.6 — default to Light if no preference.
   */
  applyTheme(theme: string): void {
    const resolvedTheme = theme && theme.trim().length > 0
      ? theme.trim()
      : ThemeEngineService.DEFAULT_THEME;

    this.currentTheme = resolvedTheme;
    const root = this.document.documentElement;

    if (root) {
      root.setAttribute('data-theme', resolvedTheme);
    }
  }

  /**
   * Apply the default theme (Light).
   * Used as fallback when API load fails or no preference is stored.
   */
  applyDefault(): void {
    this.applyTheme(ThemeEngineService.DEFAULT_THEME);
  }
}
