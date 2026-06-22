import { Injectable, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';

/**
 * Supported font scale modes.
 */
export type FontScale = 'small' | 'regular' | 'large';

/**
 * CSS custom property values for each font scale mode.
 */
interface IFontScaleProperties {
  readonly fontSize: string;
  readonly lineHeight: string;
  readonly spacingUnit: string;
  readonly tableRowHeight: string;
  readonly inputHeight: string;
}

/**
 * FontScale Service
 *
 * Manages the `data-scale` attribute on the `<html>` element and applies
 * CSS custom properties to `:root` for the active font scale mode.
 *
 * Scale modes:
 *   - Small   (0.85x baseline)
 *   - Regular (1.0x baseline — default)
 *   - Large   (1.2x baseline)
 *
 * Requirements: 13.2, 13.3, 13.6, 13.7
 */
@Injectable({ providedIn: 'root' })
export class FontScaleService {
  private readonly document = inject(DOCUMENT);

  private static readonly DEFAULT_SCALE: FontScale = 'regular';

  /** CSS custom property definitions per scale mode. */
  private static readonly SCALE_PROPERTIES: Record<FontScale, IFontScaleProperties> = {
    small: {
      fontSize: '0.85rem',
      lineHeight: '1.4',
      spacingUnit: '0.2rem',
      tableRowHeight: '2rem',
      inputHeight: '2rem'
    },
    regular: {
      fontSize: '1rem',
      lineHeight: '1.5',
      spacingUnit: '0.25rem',
      tableRowHeight: '2.5rem',
      inputHeight: '2.5rem'
    },
    large: {
      fontSize: '1.2rem',
      lineHeight: '1.6',
      spacingUnit: '0.3rem',
      tableRowHeight: '3rem',
      inputHeight: '3rem'
    }
  };

  private currentScale: FontScale = FontScaleService.DEFAULT_SCALE;

  /** Get the currently active font scale. */
  getScale(): FontScale {
    return this.currentScale;
  }

  /** Get the default font scale used as fallback. */
  getDefaultScale(): FontScale {
    return FontScaleService.DEFAULT_SCALE;
  }

  /**
   * Apply a font scale by setting the `data-scale` attribute on `<html>`
   * and updating CSS custom properties on `:root`.
   *
   * Falls back to 'regular' if an invalid scale is provided.
   *
   * Requirements: 13.3 — change visible within 300ms without page reload.
   */
  applyScale(scale: FontScale): void {
    const resolvedScale = this.isValidScale(scale) ? scale : FontScaleService.DEFAULT_SCALE;
    this.currentScale = resolvedScale;

    const root = this.document.documentElement;
    if (!root) {
      return;
    }

    // Set the data-scale attribute (drives CSS selectors in design-system-tokens.css)
    if (resolvedScale === 'regular') {
      root.removeAttribute('data-scale');
    } else {
      root.setAttribute('data-scale', resolvedScale);
    }

    // Apply CSS custom properties directly for immediate effect
    const properties = FontScaleService.SCALE_PROPERTIES[resolvedScale];
    root.style.setProperty('--ds-font-size-base', properties.fontSize);
    root.style.setProperty('--ds-line-height-base', properties.lineHeight);
    root.style.setProperty('--ds-spacing-unit', properties.spacingUnit);
    root.style.setProperty('--ds-table-row-height', properties.tableRowHeight);
    root.style.setProperty('--ds-input-height', properties.inputHeight);
  }

  /**
   * Apply the default font scale (Regular).
   * Used as fallback when API load fails or no preference is stored.
   */
  applyDefault(): void {
    this.applyScale(FontScaleService.DEFAULT_SCALE);
  }

  /** Validate that a given string is a valid FontScale value. */
  private isValidScale(scale: string): scale is FontScale {
    return scale === 'small' || scale === 'regular' || scale === 'large';
  }
}
