/**
 * Property 28: Font scale proportional CSS properties
 *
 * For any font scale mode (Small=0.85x, Regular=1.0x, Large=1.2x), all CSS custom
 * properties (font-size, line-height, spacing, padding, table-row-height) SHALL be
 * proportional to the Regular baseline values by the mode's documented scale factor.
 *
 * **Validates: Requirements 13.1, 13.7**
 */
import { TestBed } from '@angular/core/testing';
import { DOCUMENT } from '@angular/common';
import * as fc from 'fast-check';
import { FontScaleService, FontScale } from './font-scale.service';

describe('Property 28: Font scale proportional CSS properties', () => {
  let service: FontScaleService;
  let document: Document;

  /** Documented baseline values for Regular scale (1.0x) */
  const REGULAR_BASELINE = {
    fontSize: 1,         // rem
    lineHeight: 1.5,
    spacingUnit: 0.25,   // rem
    tableRowHeight: 2.5, // rem
    inputHeight: 2.5,    // rem
  };

  /** Documented expected values per scale mode */
  const EXPECTED_VALUES: Record<FontScale, typeof REGULAR_BASELINE> = {
    small: {
      fontSize: 0.85,
      lineHeight: 1.4,
      spacingUnit: 0.2,
      tableRowHeight: 2,
      inputHeight: 2,
    },
    regular: {
      fontSize: 1,
      lineHeight: 1.5,
      spacingUnit: 0.25,
      tableRowHeight: 2.5,
      inputHeight: 2.5,
    },
    large: {
      fontSize: 1.2,
      lineHeight: 1.6,
      spacingUnit: 0.3,
      tableRowHeight: 3,
      inputHeight: 3,
    },
  };

  /** Generator for valid font scale modes */
  const fontScaleArb: fc.Arbitrary<FontScale> = fc.constantFrom('small', 'regular', 'large');

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [FontScaleService],
    });
    service = TestBed.inject(FontScaleService);
    document = TestBed.inject(DOCUMENT);
  });

  afterEach(() => {
    // Clean up applied styles
    const root = document.documentElement;
    if (root) {
      root.style.removeProperty('--ds-font-size-base');
      root.style.removeProperty('--ds-line-height-base');
      root.style.removeProperty('--ds-spacing-unit');
      root.style.removeProperty('--ds-table-row-height');
      root.style.removeProperty('--ds-input-height');
      root.removeAttribute('data-scale');
    }
  });

  it('should apply CSS custom properties proportional to the Regular baseline for any scale mode', () => {
    fc.assert(
      fc.property(fontScaleArb, (scale: FontScale) => {
        service.applyScale(scale);

        const root = document.documentElement;
        const expected = EXPECTED_VALUES[scale];

        // Verify font-size
        const fontSize = root.style.getPropertyValue('--ds-font-size-base');
        expect(fontSize).toBe(`${expected.fontSize}rem`);

        // Verify line-height (unitless)
        const lineHeight = root.style.getPropertyValue('--ds-line-height-base');
        expect(lineHeight).toBe(`${expected.lineHeight}`);

        // Verify spacing unit
        const spacingUnit = root.style.getPropertyValue('--ds-spacing-unit');
        expect(spacingUnit).toBe(`${expected.spacingUnit}rem`);

        // Verify table row height
        const tableRowHeight = root.style.getPropertyValue('--ds-table-row-height');
        expect(tableRowHeight).toBe(`${expected.tableRowHeight}rem`);

        // Verify input height
        const inputHeight = root.style.getPropertyValue('--ds-input-height');
        expect(inputHeight).toBe(`${expected.inputHeight}rem`);
      }),
      { numRuns: 20 }
    );
  });

  it('should maintain proportional relationship between any scale and the Regular baseline', () => {
    fc.assert(
      fc.property(fontScaleArb, (scale: FontScale) => {
        service.applyScale(scale);

        const root = document.documentElement;
        const expected = EXPECTED_VALUES[scale];

        // Parse the applied font-size value
        const fontSizeStr = root.style.getPropertyValue('--ds-font-size-base');
        const fontSizeValue = parseFloat(fontSizeStr);

        // Parse the applied table-row-height value
        const tableRowHeightStr = root.style.getPropertyValue('--ds-table-row-height');
        const tableRowHeightValue = parseFloat(tableRowHeightStr);

        // Parse the applied input-height value
        const inputHeightStr = root.style.getPropertyValue('--ds-input-height');
        const inputHeightValue = parseFloat(inputHeightStr);

        // Parse the applied spacing-unit value
        const spacingUnitStr = root.style.getPropertyValue('--ds-spacing-unit');
        const spacingUnitValue = parseFloat(spacingUnitStr);

        // Verify font-size proportional to Regular baseline
        const fontSizeRatio = fontSizeValue / REGULAR_BASELINE.fontSize;
        expect(fontSizeRatio).toBeCloseTo(expected.fontSize / REGULAR_BASELINE.fontSize, 2);

        // Verify table-row-height proportional to Regular baseline
        const tableRowRatio = tableRowHeightValue / REGULAR_BASELINE.tableRowHeight;
        expect(tableRowRatio).toBeCloseTo(expected.tableRowHeight / REGULAR_BASELINE.tableRowHeight, 2);

        // Verify input-height proportional to Regular baseline
        const inputHeightRatio = inputHeightValue / REGULAR_BASELINE.inputHeight;
        expect(inputHeightRatio).toBeCloseTo(expected.inputHeight / REGULAR_BASELINE.inputHeight, 2);

        // Verify spacing-unit proportional to Regular baseline
        const spacingRatio = spacingUnitValue / REGULAR_BASELINE.spacingUnit;
        expect(spacingRatio).toBeCloseTo(expected.spacingUnit / REGULAR_BASELINE.spacingUnit, 2);
      }),
      { numRuns: 20 }
    );
  });

  it('should set the correct data-scale attribute for any non-regular scale mode', () => {
    fc.assert(
      fc.property(fontScaleArb, (scale: FontScale) => {
        service.applyScale(scale);

        const root = document.documentElement;

        if (scale === 'regular') {
          // Regular mode removes the data-scale attribute
          expect(root.hasAttribute('data-scale')).toBe(false);
        } else {
          expect(root.getAttribute('data-scale')).toBe(scale);
        }
      }),
      { numRuns: 20 }
    );
  });

  it('should update currentScale for any applied scale mode', () => {
    fc.assert(
      fc.property(fontScaleArb, (scale: FontScale) => {
        service.applyScale(scale);
        expect(service.getScale()).toBe(scale);
      }),
      { numRuns: 20 }
    );
  });

  it('should fall back to regular proportions for any sequence of scale changes', () => {
    fc.assert(
      fc.property(
        fc.array(fontScaleArb, { minLength: 1, maxLength: 10 }),
        (scales: FontScale[]) => {
          // Apply all scales in sequence
          for (const scale of scales) {
            service.applyScale(scale);
          }

          // Final applied scale should be the last in the sequence
          const finalScale = scales[scales.length - 1];
          const expected = EXPECTED_VALUES[finalScale];
          const root = document.documentElement;

          const fontSize = root.style.getPropertyValue('--ds-font-size-base');
          expect(fontSize).toBe(`${expected.fontSize}rem`);

          const lineHeight = root.style.getPropertyValue('--ds-line-height-base');
          expect(lineHeight).toBe(`${expected.lineHeight}`);

          expect(service.getScale()).toBe(finalScale);
        }
      ),
      { numRuns: 30 }
    );
  });
});
