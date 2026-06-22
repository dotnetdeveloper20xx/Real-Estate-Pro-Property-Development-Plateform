/**
 * Property 19: Date emits ISO 8601 format
 *
 * For any date selected via the date picker, the emitted value SHALL be a string
 * in ISO 8601 format (YYYY-MM-DD), regardless of the configured display locale.
 *
 * **Validates: Requirements 7.7**
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import * as fc from 'fast-check';
import { DatePickerComponent } from './date-picker.component';

/**
 * Arbitrary that generates valid dates within a safe range.
 */
const validDateArb = fc
  .date({ min: new Date(1900, 0, 1), max: new Date(2099, 11, 31) })
  .filter((d: Date) => !isNaN(d.getTime()));

/**
 * Arbitrary for locale strings to verify ISO emission is locale-independent.
 */
const localeArb = fc.constantFrom('en-GB', 'en-US', 'de-DE', 'fr-FR', 'ja-JP', 'ar-SA', 'zh-CN');

/**
 * ISO 8601 date regex: exactly YYYY-MM-DD with valid numeric segments.
 */
const ISO_8601_REGEX = /^(\d{4})-(\d{2})-(\d{2})$/;

describe('Property 19: Date emits ISO 8601 format', () => {
  let fixture: ComponentFixture<DatePickerComponent>;
  let component: DatePickerComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DatePickerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DatePickerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should emit ISO 8601 (YYYY-MM-DD) string via onChange when selectDay() is called, regardless of locale', () => {
    fc.assert(
      fc.property(validDateArb, localeArb, (date: Date, locale: string) => {
        // Configure locale
        component.locale = locale;
        fixture.detectChanges();

        // Capture emitted value
        let emittedValue: string | null = null;
        component.registerOnChange((val: string | null) => {
          emittedValue = val;
        });

        // Create a calendar day object matching the component's internal interface
        const calendarDay = {
          date,
          dayNumber: date.getDate(),
          isCurrentMonth: true,
          isSelected: false,
          isToday: false,
          isDisabled: false,
          ariaLabel: '',
          key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}-curr`,
        };

        // Select the day
        component.selectDay(calendarDay);

        // Verify value was emitted
        expect(emittedValue).not.toBeNull();

        // Verify ISO 8601 format
        expect(emittedValue).toMatch(ISO_8601_REGEX);

        // Verify the ISO string corresponds to the correct date
        const match = emittedValue!.match(ISO_8601_REGEX)!;
        const year = parseInt(match[1], 10);
        const month = parseInt(match[2], 10);
        const day = parseInt(match[3], 10);

        expect(year).toBe(date.getFullYear());
        expect(month).toBe(date.getMonth() + 1);
        expect(day).toBe(date.getDate());
      }),
      { numRuns: 100 }
    );
  });

  it('should emit ISO 8601 format with zero-padded month and day', () => {
    fc.assert(
      fc.property(validDateArb, (date: Date) => {
        let emittedValue: string | null = null;
        component.registerOnChange((val: string | null) => {
          emittedValue = val;
        });

        const calendarDay = {
          date,
          dayNumber: date.getDate(),
          isCurrentMonth: true,
          isSelected: false,
          isToday: false,
          isDisabled: false,
          ariaLabel: '',
          key: 'test-key',
        };

        component.selectDay(calendarDay);

        // Verify zero-padding: month and day segments are always 2 digits
        const match = emittedValue!.match(ISO_8601_REGEX)!;
        expect(match[2].length).toBe(2); // Month is always 2 digits
        expect(match[3].length).toBe(2); // Day is always 2 digits
        expect(match[1].length).toBe(4); // Year is always 4 digits
      }),
      { numRuns: 100 }
    );
  });

  it('should emit ISO 8601 format consistently across all tested locales for the same date', () => {
    const locales = ['en-GB', 'en-US', 'de-DE', 'fr-FR', 'ja-JP', 'ar-SA', 'zh-CN'];

    fc.assert(
      fc.property(validDateArb, (date: Date) => {
        const emittedValues: string[] = [];

        for (const locale of locales) {
          component.locale = locale;
          fixture.detectChanges();

          let emittedValue: string | null = null;
          component.registerOnChange((val: string | null) => {
            emittedValue = val;
          });

          const calendarDay = {
            date,
            dayNumber: date.getDate(),
            isCurrentMonth: true,
            isSelected: false,
            isToday: false,
            isDisabled: false,
            ariaLabel: '',
            key: 'test-key',
          };

          component.selectDay(calendarDay);
          emittedValues.push(emittedValue!);
        }

        // All locales should emit the exact same ISO string for the same date
        const first = emittedValues[0];
        for (const val of emittedValues) {
          expect(val).toBe(first);
        }
      }),
      { numRuns: 50 }
    );
  });
});
