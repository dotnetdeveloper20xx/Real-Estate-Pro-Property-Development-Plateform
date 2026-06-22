/**
 * Property 14: Currency null on non-numeric input
 *
 * For any input that is empty or contains only non-numeric characters (after character
 * filtering), the currency component SHALL emit a null value change event.
 *
 * **Validates: Requirements 6.6**
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import * as fc from 'fast-check';
import { CurrencyDisplayComponent } from './currency-display.component';

describe('Property 14: Currency null on non-numeric input', () => {
  let component: CurrencyDisplayComponent;
  let fixture: ComponentFixture<CurrencyDisplayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CurrencyDisplayComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CurrencyDisplayComponent);
    component = fixture.componentInstance;
    component.mode = 'edit';
    fixture.detectChanges();
  });

  /**
   * Access the private parseValue method via casting for direct property testing.
   */
  function parseValue(raw: string): number | null {
    return (component as unknown as { parseValue(raw: string): number | null }).parseValue(raw);
  }

  it('parseValue SHALL return null for empty strings and whitespace-only strings', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('', '   ', '\t', '\n', '  \t  ', '    '),
        (input: string) => {
          const result = parseValue(input);
          expect(result).withContext(
            `Expected null for empty/whitespace input "${input}", got: ${result}`
          ).toBeNull();
        }
      ),
      { numRuns: 20 }
    );
  });

  it('parseValue SHALL return null for strings containing only non-numeric characters', () => {
    // Generate strings that match only non-digit characters (letters, symbols)
    const nonNumericArb = fc.stringMatching(/^[a-zA-Z!@#$%^&*()_+=\[\]{}<>?/\\|~` ]{1,50}$/);

    fc.assert(
      fc.property(
        nonNumericArb,
        (input: string) => {
          const result = parseValue(input);
          expect(result).withContext(
            `Expected null for non-numeric input "${input}", got: ${result}`
          ).toBeNull();
        }
      ),
      { numRuns: 200 }
    );
  });

  it('parseValue SHALL return null when input is a lone minus sign or lone decimal point', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('-', '.', '-.'),
        (input: string) => {
          const result = parseValue(input);
          expect(result).withContext(
            `Expected null for "${input}" (no meaningful numeric value), got: ${result}`
          ).toBeNull();
        }
      ),
      { numRuns: 10 }
    );
  });

  it('component SHALL emit null valueChange event on blur when input is empty or non-numeric', () => {
    // Generate inputs that produce no digits after filtering
    const nonNumericInputs = fc.oneof(
      fc.constant(''),
      fc.array(
        fc.constantFrom('a', 'b', 'Z', '!', '@', '#', '$', '%', ' ', '&', '*', '(', ')'),
        { minLength: 1, maxLength: 20 }
      ).map((chars: string[]) => chars.join(''))
    );

    fc.assert(
      fc.property(
        nonNumericInputs,
        (input: string) => {
          // Track emitted values
          let emittedValue: number | null | undefined = undefined;
          const sub = component.valueChange.subscribe((val: number | null) => {
            emittedValue = val;
          });

          // Simulate the full blur flow: set raw input and trigger blur
          const inputEl = fixture.nativeElement.querySelector('input');
          if (inputEl) {
            inputEl.value = input;
            inputEl.dispatchEvent(new Event('input', { bubbles: true }));
            fixture.detectChanges();

            inputEl.dispatchEvent(new Event('blur', { bubbles: true }));
            fixture.detectChanges();

            expect(emittedValue).withContext(
              `Expected null emission for non-numeric input "${input}", got: ${emittedValue}`
            ).toBeNull();
          }

          sub.unsubscribe();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('parseValue SHALL return a number (not null) when input is a valid numeric string', () => {
    // Generate strings that are already valid numeric representations
    // (as they would be after filterInput processes them in the real component flow)
    const validNumericArb = fc.oneof(
      // Positive integers
      fc.integer({ min: 0, max: 999999999 }).map((n: number) => n.toString()),
      // Negative integers
      fc.integer({ min: -999999999, max: -1 }).map((n: number) => n.toString()),
      // Decimals
      fc.tuple(
        fc.integer({ min: 0, max: 999999 }),
        fc.integer({ min: 1, max: 9999 })
      ).map(([intPart, decPart]) => `${intPart}.${decPart}`),
      // Negative decimals
      fc.tuple(
        fc.integer({ min: 1, max: 999999 }),
        fc.integer({ min: 1, max: 9999 })
      ).map(([intPart, decPart]) => `-${intPart}.${decPart}`)
    );

    fc.assert(
      fc.property(
        validNumericArb,
        (input: string) => {
          const result = parseValue(input);
          // If input is a valid numeric string, parseValue should return a number
          expect(result).withContext(
            `Expected non-null for valid numeric input "${input}", got: ${result}`
          ).not.toBeNull();
        }
      ),
      { numRuns: 200 }
    );
  });
});
