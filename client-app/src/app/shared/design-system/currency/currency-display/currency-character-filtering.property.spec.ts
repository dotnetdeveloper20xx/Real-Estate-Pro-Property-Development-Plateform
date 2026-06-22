/**
 * Property 13: Currency input character filtering
 *
 * For any arbitrary string of characters entered in the currency edit mode input,
 * the component SHALL retain only digits (0-9), at most one decimal point, and at
 * most one leading minus sign, discarding all other characters.
 *
 * **Validates: Requirements 6.5**
 */
import { TestBed } from '@angular/core/testing';
import * as fc from 'fast-check';
import { CurrencyDisplayComponent } from './currency-display.component';

describe('Property 13: Currency input character filtering', () => {
  let component: CurrencyDisplayComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CurrencyDisplayComponent],
    }).compileComponents();

    const fixture = TestBed.createComponent(CurrencyDisplayComponent);
    component = fixture.componentInstance;
    component.mode = 'edit';
    fixture.detectChanges();
  });

  /**
   * Access the private filterInput method via casting for direct property testing.
   */
  function filterInput(raw: string): string {
    return (component as unknown as { filterInput(raw: string): string }).filterInput(raw);
  }

  it('should only contain digits, at most one decimal point, and at most one leading minus sign', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 0, maxLength: 100 }),
        (input: string) => {
          const result = filterInput(input);

          // Every character in the result must be a digit, '.', or '-'
          for (let i = 0; i < result.length; i++) {
            const ch = result[i];
            const isDigit = ch >= '0' && ch <= '9';
            const isDecimal = ch === '.';
            const isMinus = ch === '-';
            expect(isDigit || isDecimal || isMinus).withContext(
              `Character '${ch}' at index ${i} is not a valid currency character. Input: "${input}", Result: "${result}"`
            ).toBeTrue();
          }

          // At most one decimal point
          const decimalCount = (result.match(/\./g) || []).length;
          expect(decimalCount).withContext(
            `Result "${result}" has ${decimalCount} decimal points (max 1 allowed). Input: "${input}"`
          ).toBeLessThanOrEqual(1);

          // At most one minus sign
          const minusCount = (result.match(/-/g) || []).length;
          expect(minusCount).withContext(
            `Result "${result}" has ${minusCount} minus signs (max 1 allowed). Input: "${input}"`
          ).toBeLessThanOrEqual(1);

          // If minus sign exists, it must be at position 0 (leading)
          if (minusCount === 1) {
            expect(result.indexOf('-')).withContext(
              `Minus sign in "${result}" is not at position 0 (leading). Input: "${input}"`
            ).toBe(0);
          }
        }
      ),
      { numRuns: 200 }
    );
  });

  it('should preserve all digits from the input in order', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        (input: string) => {
          const result = filterInput(input);

          // Extract digits from input and result
          const inputDigits = input.replace(/[^0-9]/g, '');
          const resultDigits = result.replace(/[^0-9]/g, '');

          // All digits from the input should be preserved in order
          expect(resultDigits).withContext(
            `Digits not preserved. Input: "${input}", Result: "${result}", Expected digits: "${inputDigits}", Got digits: "${resultDigits}"`
          ).toBe(inputDigits);
        }
      ),
      { numRuns: 200 }
    );
  });

  it('should retain only the first decimal point when input contains multiple', () => {
    fc.assert(
      fc.property(
        fc.array(fc.oneof(
          fc.constantFrom('.', '.', '.'),
          fc.constantFrom('0', '1', '2', '3', '4', '5', '6', '7', '8', '9')
        ), { minLength: 2, maxLength: 30 }),
        (chars: string[]) => {
          const input = chars.join('');
          const result = filterInput(input);

          const decimalCount = (result.match(/\./g) || []).length;
          expect(decimalCount).withContext(
            `Result "${result}" from input "${input}" should have at most 1 decimal point`
          ).toBeLessThanOrEqual(1);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should only retain minus sign when it appears at the leading position', () => {
    fc.assert(
      fc.property(
        fc.array(fc.oneof(
          fc.constantFrom('-', '-'),
          fc.constantFrom('0', '1', '2', '3', '4', '5', '6', '7', '8', '9')
        ), { minLength: 2, maxLength: 30 }),
        (chars: string[]) => {
          const input = chars.join('');
          const result = filterInput(input);

          const minusCount = (result.match(/-/g) || []).length;
          expect(minusCount).withContext(
            `Result "${result}" from input "${input}" should have at most 1 minus sign`
          ).toBeLessThanOrEqual(1);

          if (minusCount === 1) {
            expect(result[0]).withContext(
              `Minus sign in "${result}" must be at index 0. Input: "${input}"`
            ).toBe('-');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should discard all non-currency characters (letters, symbols, whitespace)', () => {
    fc.assert(
      fc.property(
        fc.array(fc.oneof(
          fc.constantFrom('a', 'Z', '!', '@', '#', '$', '%', ' ', '\t', '\n', '+', '=', '/', '\\'),
          fc.constantFrom('0', '1', '2', '3', '4', '5', '6', '7', '8', '9')
        ), { minLength: 1, maxLength: 50 }),
        (chars: string[]) => {
          const input = chars.join('');
          const result = filterInput(input);

          // Result should not contain any letters, symbols, or whitespace
          const invalidChars = result.replace(/[0-9.\-]/g, '');
          expect(invalidChars).withContext(
            `Result "${result}" contains invalid characters: "${invalidChars}". Input: "${input}"`
          ).toBe('');
        }
      ),
      { numRuns: 100 }
    );
  });
});
