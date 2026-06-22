/**
 * Property 16: Date display format matches locale
 *
 * For any valid date value and the default `en-GB` locale, the `app-date` component
 * SHALL display the date in DD/MM/YYYY format. For any configured locale, the display
 * format SHALL match that locale's date convention.
 *
 * **Validates: Requirements 7.2**
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import * as fc from 'fast-check';
import { DateDisplayComponent } from './date-display.component';

/**
 * Arbitrary that generates valid dates within a safe range,
 * filtering out any NaN dates that fast-check might produce.
 */
const validDateArb = fc
  .date({ min: new Date(1900, 0, 1), max: new Date(2099, 11, 31) })
  .filter((d: Date) => !isNaN(d.getTime()));

describe('Property 16: Date display format matches locale', () => {
  let fixture: ComponentFixture<DateDisplayComponent>;
  let component: DateDisplayComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DateDisplayComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DateDisplayComponent);
    component = fixture.componentInstance;
  });

  it('should display dates in DD/MM/YYYY format for the default en-GB locale', () => {
    fc.assert(
      fc.property(validDateArb, (date: Date) => {
        // Set the value using a Date object (default locale is en-GB)
        component.value = date;
        fixture.detectChanges();

        const displayed = component.absoluteDisplay();

        // Verify DD/MM/YYYY format: two-digit day, two-digit month, four-digit year
        const ddMmYyyyRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
        expect(displayed).toMatch(ddMmYyyyRegex);

        // Verify the actual date values match
        const match = displayed.match(ddMmYyyyRegex);
        if (match) {
          const day = parseInt(match[1], 10);
          const month = parseInt(match[2], 10);
          const year = parseInt(match[3], 10);

          expect(day).toBe(date.getDate());
          expect(month).toBe(date.getMonth() + 1);
          expect(year).toBe(date.getFullYear());
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should display dates in DD/MM/YYYY format when locale is explicitly set to en-GB', () => {
    // Set locale before running the property
    component.locale = 'en-GB';

    fc.assert(
      fc.property(validDateArb, (date: Date) => {
        component.value = date;
        fixture.detectChanges();

        const displayed = component.absoluteDisplay();
        const ddMmYyyyRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
        expect(displayed).toMatch(ddMmYyyyRegex);
      }),
      { numRuns: 50 }
    );
  });

  it('should display dates matching the configured locale date convention', () => {
    fc.assert(
      fc.property(
        validDateArb,
        fc.constantFrom('en-US', 'de-DE', 'fr-FR', 'ja-JP'),
        (date: Date, locale: string) => {
          component.locale = locale;
          component.value = date;
          fixture.detectChanges();

          const displayed = component.absoluteDisplay();

          // The displayed value should match what toLocaleDateString produces
          const expected = date.toLocaleDateString(locale, {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          });

          expect(displayed).toBe(expected);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle ISO string date inputs and produce DD/MM/YYYY for en-GB', () => {
    fc.assert(
      fc.property(validDateArb, (date: Date) => {
        // Pass as ISO string (YYYY-MM-DD)
        const isoString = date.toISOString().slice(0, 10);
        component.value = isoString;
        fixture.detectChanges();

        const displayed = component.absoluteDisplay();

        // Should still produce DD/MM/YYYY format
        const ddMmYyyyRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
        expect(displayed).toMatch(ddMmYyyyRegex);
      }),
      { numRuns: 100 }
    );
  });

  it('should display empty string for null or invalid date values', () => {
    component.value = null;
    fixture.detectChanges();
    expect(component.absoluteDisplay()).toBe('');

    component.value = 'not-a-date';
    fixture.detectChanges();
    expect(component.absoluteDisplay()).toBe('');
  });
});
