/**
 * Property 20: Date invalid input validation
 *
 * For any string entered into the date picker that cannot be parsed as a valid date
 * (DD/MM/YYYY format for en-GB locale), the control SHALL be marked as invalid and
 * an inline validation error SHALL indicate the expected format.
 *
 * **Validates: Requirements 7.9**
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import * as fc from 'fast-check';
import { DatePickerComponent } from './date-picker.component';

/**
 * Arbitrary that generates random text strings that are NOT valid DD/MM/YYYY dates.
 * Includes random text, wrong formats, and impossible dates.
 */
const invalidDateStringArb = fc.oneof(
  // Random alphabetic text (never a valid date)
  fc.stringMatching(/^[a-z]{1,20}$/),
  // Numeric strings without separators
  fc.stringMatching(/^[0-9]{1,10}$/),
  // Wrong format: YYYY/MM/DD
  fc.tuple(
    fc.integer({ min: 2000, max: 2030 }),
    fc.integer({ min: 1, max: 12 }),
    fc.integer({ min: 1, max: 28 })
  ).map(([y, m, d]) => `${y}/${String(m).padStart(2, '0')}/${String(d).padStart(2, '0')}`),
  // Impossible day (32+)
  fc.tuple(
    fc.integer({ min: 32, max: 99 }),
    fc.integer({ min: 1, max: 12 }),
    fc.integer({ min: 2000, max: 2030 })
  ).map(([d, m, y]) => `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`),
  // Impossible month (13+)
  fc.tuple(
    fc.integer({ min: 1, max: 28 }),
    fc.integer({ min: 13, max: 99 }),
    fc.integer({ min: 2000, max: 2030 })
  ).map(([d, m, y]) => `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`),
  // Day 0 (invalid)
  fc.tuple(
    fc.integer({ min: 1, max: 12 }),
    fc.integer({ min: 2000, max: 2030 })
  ).map(([m, y]) => `00/${String(m).padStart(2, '0')}/${y}`),
  // Month 0 (invalid)
  fc.tuple(
    fc.integer({ min: 1, max: 28 }),
    fc.integer({ min: 2000, max: 2030 })
  ).map(([d, y]) => `${String(d).padStart(2, '0')}/00/${y}`),
  // Day 31 for months that only have 30 days (April, June, September, November)
  fc.tuple(
    fc.constantFrom(4, 6, 9, 11),
    fc.integer({ min: 2000, max: 2030 })
  ).map(([m, y]) => `31/${String(m).padStart(2, '0')}/${y}`),
  // Feb 30 or 31 (always invalid)
  fc.tuple(
    fc.constantFrom(30, 31),
    fc.integer({ min: 2000, max: 2030 })
  ).map(([d, y]) => `${d}/02/${y}`),
  // Feb 29 on a non-leap year
  fc.integer({ min: 2001, max: 2030 })
    .filter(y => !(y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0)))
    .map(y => `29/02/${y}`)
);

describe('Property 20: Date invalid input validation', () => {
  let fixture: ComponentFixture<DatePickerComponent>;
  let component: DatePickerComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DatePickerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DatePickerComponent);
    component = fixture.componentInstance;
    component.locale = 'en-GB';
    fixture.detectChanges();
  });

  it('should mark the control as invalid with invalidDate error for any unparseable date string', () => {
    fc.assert(
      fc.property(invalidDateStringArb, (invalidInput: string) => {
        // Simulate text input event
        const inputEvent = { target: { value: invalidInput } } as unknown as Event;
        component.onTextInput(inputEvent);

        // Access internal errors via the validate method (Validator interface)
        const errors = component.validate({} as any);

        // The component should have an invalidDate error
        expect(errors).not.toBeNull();
        expect(errors!['invalidDate']).toBeDefined();
      }),
      { numRuns: 200 }
    );
  });

  it('should include the expected format hint in the invalidDate error message', () => {
    fc.assert(
      fc.property(invalidDateStringArb, (invalidInput: string) => {
        const inputEvent = { target: { value: invalidInput } } as unknown as Event;
        component.onTextInput(inputEvent);

        const errors = component.validate({} as any);

        expect(errors).not.toBeNull();
        expect(errors!['invalidDate']).toBeDefined();

        // The error message should indicate the expected format (DD/MM/YYYY for en-GB)
        const errorMessage = errors!['invalidDate'] as string;
        expect(errorMessage).toContain('DD/MM/YYYY');
      }),
      { numRuns: 100 }
    );
  });

  it('should NOT produce invalidDate error for valid DD/MM/YYYY date strings', () => {
    // Verify valid dates don't trigger the error (sanity check / counter-property)
    const validDateArb = fc.tuple(
      fc.integer({ min: 1, max: 28 }),
      fc.integer({ min: 1, max: 12 }),
      fc.integer({ min: 2000, max: 2099 })
    ).map(([d, m, y]) => `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`);

    fc.assert(
      fc.property(validDateArb, (validInput: string) => {
        const inputEvent = { target: { value: validInput } } as unknown as Event;
        component.onTextInput(inputEvent);

        const errors = component.validate({} as any);

        // Should NOT have an invalidDate error for valid dates
        if (errors !== null) {
          expect(errors['invalidDate']).toBeUndefined();
        } else {
          expect(errors).toBeNull();
        }
      }),
      { numRuns: 100 }
    );
  });
});
