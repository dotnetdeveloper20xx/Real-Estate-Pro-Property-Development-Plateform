import { ComponentFixture, TestBed } from '@angular/core/testing';
import * as fc from 'fast-check';
import { DateDisplayComponent } from './date-display.component';

/**
 * Property 17: Date relative vs absolute display threshold
 *
 * For any date where `relative` input is true: if the date is within 30 days
 * of the current date, a relative label (e.g., "2 days ago") SHALL be displayed;
 * if the date is more than 30 days from the current date, the formatted absolute
 * date SHALL be displayed.
 *
 * **Validates: Requirements 7.3**
 */
describe('Date Relative vs Absolute Display Threshold Property', () => {
  let fixture: ComponentFixture<DateDisplayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DateDisplayComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DateDisplayComponent);
  });

  it('should display a relative label for dates within 30 days of now', () => {
    fc.assert(
      fc.property(
        // Generate offsets between 0 and 30 days (in milliseconds), past or future
        fc.integer({ min: 0, max: 30 }),
        fc.boolean(),
        (daysOffset: number, isPast: boolean) => {
          const now = new Date();
          const targetDate = new Date(now.getTime());

          if (isPast) {
            targetDate.setDate(now.getDate() - daysOffset);
          } else {
            targetDate.setDate(now.getDate() + daysOffset);
          }

          // Arrange
          fixture.componentRef.setInput('value', targetDate);
          fixture.componentRef.setInput('relative', true);
          fixture.detectChanges();

          const nativeElement: HTMLElement = fixture.nativeElement;
          const timeElement = nativeElement.querySelector('time');

          // Assert: time element should exist
          expect(timeElement).toBeTruthy();

          const displayText = timeElement!.textContent!.trim();

          // Assert: should display a relative label, NOT the DD/MM/YYYY format
          // Relative labels contain words like "ago", "in", "yesterday", "tomorrow", "just now",
          // "minute(s)", "hour(s)", "day(s)", "week(s)"
          const relativePatterns = [
            /ago$/,
            /^in\s/,
            /^yesterday$/,
            /^tomorrow$/,
            /^just now$/,
          ];

          const isRelative = relativePatterns.some(pattern => pattern.test(displayText));
          const isAbsoluteDateFormat = /^\d{2}\/\d{2}\/\d{4}$/.test(displayText);

          expect(isRelative).withContext(
            `Expected relative label for ${daysOffset} days ${isPast ? 'ago' : 'ahead'}, got: "${displayText}"`
          ).toBeTrue();
          expect(isAbsoluteDateFormat).withContext(
            `Should NOT be absolute format for date within 30 days, got: "${displayText}"`
          ).toBeFalse();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should display the formatted absolute date (DD/MM/YYYY) for dates more than 30 days from now', () => {
    fc.assert(
      fc.property(
        // Generate offsets strictly greater than 30 days (31 to 365)
        fc.integer({ min: 31, max: 365 }),
        fc.boolean(),
        (daysOffset: number, isPast: boolean) => {
          const now = new Date();
          const targetDate = new Date(now.getTime());

          if (isPast) {
            targetDate.setDate(now.getDate() - daysOffset);
          } else {
            targetDate.setDate(now.getDate() + daysOffset);
          }

          // Arrange
          fixture.componentRef.setInput('value', targetDate);
          fixture.componentRef.setInput('relative', true);
          fixture.componentRef.setInput('locale', 'en-GB');
          fixture.detectChanges();

          const nativeElement: HTMLElement = fixture.nativeElement;
          const timeElement = nativeElement.querySelector('time');

          // Assert: time element should exist
          expect(timeElement).toBeTruthy();

          const displayText = timeElement!.textContent!.trim();

          // Assert: should display the absolute DD/MM/YYYY format
          const isAbsoluteDateFormat = /^\d{2}\/\d{2}\/\d{4}$/.test(displayText);

          expect(isAbsoluteDateFormat).withContext(
            `Expected absolute DD/MM/YYYY format for date ${daysOffset} days ${isPast ? 'ago' : 'ahead'}, got: "${displayText}"`
          ).toBeTrue();

          // Verify the displayed date matches the target date formatted correctly
          const expectedFormatted = targetDate.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          });
          expect(displayText).toBe(expectedFormatted);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should display absolute date when relative input is false regardless of date proximity', () => {
    fc.assert(
      fc.property(
        // Generate dates within 30 days (where relative would normally show)
        fc.integer({ min: 1, max: 30 }),
        fc.boolean(),
        (daysOffset: number, isPast: boolean) => {
          const now = new Date();
          const targetDate = new Date(now.getTime());

          if (isPast) {
            targetDate.setDate(now.getDate() - daysOffset);
          } else {
            targetDate.setDate(now.getDate() + daysOffset);
          }

          // Arrange - relative is false
          fixture.componentRef.setInput('value', targetDate);
          fixture.componentRef.setInput('relative', false);
          fixture.componentRef.setInput('locale', 'en-GB');
          fixture.detectChanges();

          const nativeElement: HTMLElement = fixture.nativeElement;
          const timeElement = nativeElement.querySelector('time');

          // Assert: time element should exist
          expect(timeElement).toBeTruthy();

          const displayText = timeElement!.textContent!.trim();

          // Assert: should display the absolute DD/MM/YYYY format even for recent dates
          const isAbsoluteDateFormat = /^\d{2}\/\d{2}\/\d{4}$/.test(displayText);

          expect(isAbsoluteDateFormat).withContext(
            `Expected absolute format when relative=false, got: "${displayText}"`
          ).toBeTrue();
        }
      ),
      { numRuns: 50 }
    );
  });
});
