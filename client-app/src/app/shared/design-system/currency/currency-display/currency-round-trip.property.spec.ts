/**
 * Property 15: Currency format round-trip
 *
 * For any valid numeric value within the supported range (-999,999,999.9999 to 999,999,999.9999)
 * and for any configured decimal precision (0-4) and negative format (minus/parentheses),
 * entering the number in edit mode and blurring SHALL result in the displayed formatted string
 * being parseable back to the original numeric value (within the configured precision).
 *
 * **Validates: Requirements 6.2, 6.3, 6.7**
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import * as fc from 'fast-check';
import { CurrencyDisplayComponent, NegativeFormat } from './currency-display.component';

describe('Property 15: Currency format round-trip', () => {
  let fixture: ComponentFixture<CurrencyDisplayComponent>;
  let component: CurrencyDisplayComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CurrencyDisplayComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CurrencyDisplayComponent);
    component = fixture.componentInstance;
  });

  /**
   * Round a value to the specified precision, matching what the component does internally.
   */
  function roundToPrecision(value: number, precision: number): number {
    const factor = Math.pow(10, precision);
    return Math.round(value * factor) / factor;
  }

  /**
   * Parse a formatted currency string back to a number by stripping formatting characters.
   * This simulates what the component's parseValue does after the formatted display is shown.
   */
  function parseFormattedValue(formatted: string): number | null {
    if (!formatted || formatted.trim() === '') return null;

    let cleaned = formatted.trim();
    let isNegative = false;

    // Handle parentheses negative format: (1,234.56) → -1234.56
    if (cleaned.startsWith('(') && cleaned.endsWith(')')) {
      isNegative = true;
      cleaned = cleaned.slice(1, -1);
    } else if (cleaned.startsWith('-')) {
      isNegative = true;
      cleaned = cleaned.slice(1);
    }

    // Remove thousand separators (commas)
    cleaned = cleaned.replace(/,/g, '');

    const parsed = parseFloat(cleaned);
    if (isNaN(parsed)) return null;

    return isNegative ? -parsed : parsed;
  }

  /**
   * Convert a number to a plain decimal string without scientific notation.
   * This ensures the input string passed to the component is a simple decimal
   * that the component's character filter can accept.
   */
  function toPlainDecimalString(value: number, precision: number): string {
    return roundToPrecision(value, precision).toFixed(precision);
  }

  it('should produce a formatted string that parses back to the original value when entering via edit mode', () => {
    // Generate integer part and fractional part separately to ensure clean values
    const precisionArb = fc.integer({ min: 0, max: 4 });
    const negativeFormatArb = fc.constantFrom<NegativeFormat>('minus', 'parentheses');

    // Generate values that are already rounded to precision to avoid floating-point drift
    const valueWithPrecisionArb = precisionArb.chain((precision) => {
      const factor = Math.pow(10, precision);
      // Limit integer range to avoid scientific notation in toString()
      const maxIntPart = Math.min(999999999 * factor, Number.MAX_SAFE_INTEGER);
      return fc.tuple(
        fc.integer({ min: -maxIntPart, max: maxIntPart }).map(intVal => intVal / factor),
        fc.constant(precision)
      );
    });

    fc.assert(
      fc.property(
        valueWithPrecisionArb,
        negativeFormatArb,
        ([value, precision], negFormat: NegativeFormat) => {
          // Configure the component
          component.decimalPrecision = precision;
          component.negativeFormat = negFormat;
          component.mode = 'edit';
          fixture.detectChanges();

          // Create a clean decimal string for input (no scientific notation, no commas)
          const inputString = toPlainDecimalString(value, precision);

          // Simulate user input: set value in the input and trigger blur
          const inputEl: HTMLInputElement = fixture.nativeElement.querySelector('input');
          expect(inputEl).toBeTruthy();

          // Dispatch input event with the plain decimal string
          inputEl.value = inputString;
          inputEl.dispatchEvent(new Event('input', { bubbles: true }));
          fixture.detectChanges();

          // Dispatch blur to trigger formatting
          inputEl.dispatchEvent(new Event('blur', { bubbles: true }));
          fixture.detectChanges();

          // After blur, the input displays the formatted value
          const displayedValue = inputEl.value;

          // The expected numeric value after precision rounding
          const expectedValue = roundToPrecision(value, precision);

          if (expectedValue === 0) {
            // Zero (including -0 → 0) should format and parse back as 0
            const parsedBack = parseFormattedValue(displayedValue);
            expect(parsedBack).toBe(0);
          } else {
            // Parse the formatted display back to a number
            const parsedBack = parseFormattedValue(displayedValue);
            expect(parsedBack).withContext(
              `Input: "${inputString}", Displayed: "${displayedValue}", Expected: ${expectedValue}`
            ).toBe(expectedValue);
          }
        }
      ),
      { numRuns: 200 }
    );
  });

  it('should preserve value through writeValue → formatted display → parse for integer inputs', () => {
    const intValueArb = fc.integer({ min: -999999999, max: 999999999 });
    const precisionArb = fc.integer({ min: 0, max: 4 });
    const negativeFormatArb = fc.constantFrom<NegativeFormat>('minus', 'parentheses');

    fc.assert(
      fc.property(
        intValueArb,
        precisionArb,
        negativeFormatArb,
        (value: number, precision: number, negFormat: NegativeFormat) => {
          // Configure the component
          component.decimalPrecision = precision;
          component.negativeFormat = negFormat;
          component.mode = 'edit';
          fixture.detectChanges();

          // Write the value through the ControlValueAccessor interface
          component.writeValue(value);
          fixture.detectChanges();

          // The component should display the formatted value in the input
          const inputEl: HTMLInputElement = fixture.nativeElement.querySelector('input');
          const displayedValue = inputEl?.value ?? '';

          if (value === 0) {
            const parsedBack = parseFormattedValue(displayedValue);
            expect(parsedBack).toBe(0);
          } else {
            // Parse the formatted display back to a number
            const parsedBack = parseFormattedValue(displayedValue);
            expect(parsedBack).withContext(
              `writeValue(${value}), precision=${precision}, negFormat=${negFormat}, displayed="${displayedValue}"`
            ).toBe(value);
          }
        }
      ),
      { numRuns: 200 }
    );
  });

  it('should produce consistent formatted output for any value within range regardless of negative format', () => {
    const precisionArb = fc.integer({ min: 0, max: 4 });

    // Generate a value pre-rounded to the given precision
    const valueWithPrecisionArb = precisionArb.chain((precision) => {
      const factor = Math.pow(10, precision);
      const maxIntPart = Math.min(999999999 * factor, Number.MAX_SAFE_INTEGER);
      return fc.tuple(
        fc.integer({ min: -maxIntPart, max: maxIntPart })
          .filter(v => v !== 0) // exclude zero to test negative format differences
          .map(intVal => intVal / factor),
        fc.constant(precision)
      );
    });

    fc.assert(
      fc.property(
        valueWithPrecisionArb,
        ([value, precision]) => {
          const expectedValue = roundToPrecision(value, precision);

          // Test with 'minus' format
          component.decimalPrecision = precision;
          component.negativeFormat = 'minus';
          component.mode = 'edit';
          fixture.detectChanges();
          component.writeValue(value);
          fixture.detectChanges();

          const inputElMinus: HTMLInputElement = fixture.nativeElement.querySelector('input');
          const displayedMinus = inputElMinus?.value ?? '';
          const parsedMinus = parseFormattedValue(displayedMinus);

          // Test with 'parentheses' format
          component.negativeFormat = 'parentheses';
          fixture.detectChanges();
          component.writeValue(null); // reset
          fixture.detectChanges();
          component.writeValue(value);
          fixture.detectChanges();

          const displayedParens = inputElMinus?.value ?? '';
          const parsedParens = parseFormattedValue(displayedParens);

          // Both formats should parse back to the same value
          expect(parsedMinus).withContext(
            `Minus format: "${displayedMinus}" should parse to ${expectedValue}`
          ).toBe(expectedValue);
          expect(parsedParens).withContext(
            `Parentheses format: "${displayedParens}" should parse to ${expectedValue}`
          ).toBe(expectedValue);
        }
      ),
      { numRuns: 100 }
    );
  });
});
