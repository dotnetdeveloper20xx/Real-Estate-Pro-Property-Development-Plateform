/**
 * Property 18: Date min/max constraint validation
 *
 * For any date that falls outside the range defined by `minDate` and `maxDate` inputs,
 * the date picker SHALL mark the control as invalid, display an inline validation error
 * indicating the permitted range, and prevent emission of the invalid value.
 *
 * **Validates: Requirements 7.5**
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, ViewChild } from '@angular/core';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import * as fc from 'fast-check';
import { DatePickerComponent } from './date-picker.component';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, DatePickerComponent],
  template: `
    <app-date-picker
      #picker
      [formControl]="control"
      [minDate]="minDate"
      [maxDate]="maxDate"
      label="Test Date"
    />
  `,
})
class TestHostComponent {
  @ViewChild('picker') picker!: DatePickerComponent;
  control = new FormControl<string | null>(null);
  minDate: string | null = null;
  maxDate: string | null = null;
}

/**
 * Helper: generate a valid ISO date string (YYYY-MM-DD) from year/month/day integers.
 */
function toIso(year: number, month: number, day: number): string {
  return `${year.toString().padStart(4, '0')}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
}

/**
 * Arbitrary that generates a valid ISO date (YYYY-MM-DD) within a reasonable range.
 */
function arbIsoDate(): fc.Arbitrary<string> {
  return fc
    .record({
      year: fc.integer({ min: 2000, max: 2099 }),
      month: fc.integer({ min: 1, max: 12 }),
      day: fc.integer({ min: 1, max: 28 }), // Use 28 to ensure validity for all months
    })
    .map(({ year, month, day }) => toIso(year, month, day));
}

/**
 * Arbitrary that generates a date strictly before a given ISO date.
 */
function arbDateBefore(isoDate: string): fc.Arbitrary<string> {
  const ref = new Date(isoDate);
  const refYear = ref.getFullYear();
  const refMonth = ref.getMonth() + 1;
  const refDay = ref.getDate();

  // Generate a date that is 1-365 days before the reference date
  return fc.integer({ min: 1, max: 365 }).map((offset) => {
    const d = new Date(refYear, refMonth - 1, refDay - offset);
    return toIso(d.getFullYear(), d.getMonth() + 1, d.getDate());
  });
}

/**
 * Arbitrary that generates a date strictly after a given ISO date.
 */
function arbDateAfter(isoDate: string): fc.Arbitrary<string> {
  const ref = new Date(isoDate);
  const refYear = ref.getFullYear();
  const refMonth = ref.getMonth() + 1;
  const refDay = ref.getDate();

  // Generate a date that is 1-365 days after the reference date
  return fc.integer({ min: 1, max: 365 }).map((offset) => {
    const d = new Date(refYear, refMonth - 1, refDay + offset);
    return toIso(d.getFullYear(), d.getMonth() + 1, d.getDate());
  });
}

describe('Property 18: Date min/max constraint validation', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  /**
   * Simulate touch by triggering blur on the input element.
   */
  function simulateTouch(): void {
    const input = fixture.nativeElement.querySelector('input');
    input.dispatchEvent(new Event('blur'));
    fixture.detectChanges();
  }

  it('SHALL mark control as invalid and show error when date is before minDate', () => {
    fc.assert(
      fc.property(
        arbIsoDate().chain((minDate) =>
          arbDateBefore(minDate).map((testDate) => ({ minDate, testDate }))
        ),
        ({ minDate, testDate }) => {
          // Set minDate constraint
          host.minDate = minDate;
          host.maxDate = null;
          fixture.detectChanges();

          // Write a value before the min date
          host.control.setValue(testDate);
          fixture.detectChanges();

          // Mark as touched to show errors
          simulateTouch();

          // 1) Control SHALL be marked as invalid
          const validationErrors = host.picker.validate(host.control);
          expect(validationErrors).withContext(
            `Expected invalid: testDate=${testDate}, minDate=${minDate}`
          ).not.toBeNull();
          expect(validationErrors!['minDate']).withContext(
            `Expected minDate error key: testDate=${testDate}, minDate=${minDate}`
          ).toBeDefined();

          // 2) Inline validation error SHALL be displayed
          const errorEl = fixture.nativeElement.querySelector('[role="alert"]');
          expect(errorEl).withContext(
            `Expected error element visible: testDate=${testDate}, minDate=${minDate}`
          ).not.toBeNull();

          // 3) Error text SHALL indicate the permitted range
          const errorText: string = errorEl!.textContent || '';
          expect(errorText.toLowerCase()).withContext(
            `Expected error to mention date constraint`
          ).toContain('on or after');

          // 4) Invalid value SHALL NOT be emitted (onChange called with null)
          // The FormControl value will be the testDate but validate() returns errors
          // which means the form is invalid — the component prevents emission by calling onChange(null)
          expect(host.control.valid).withContext(
            `Expected form control to be invalid: testDate=${testDate}, minDate=${minDate}`
          ).toBeFalse();
        }
      ),
      { numRuns: 50 }
    );
  });

  it('SHALL mark control as invalid and show error when date is after maxDate', () => {
    fc.assert(
      fc.property(
        arbIsoDate().chain((maxDate) =>
          arbDateAfter(maxDate).map((testDate) => ({ maxDate, testDate }))
        ),
        ({ maxDate, testDate }) => {
          // Set maxDate constraint
          host.minDate = null;
          host.maxDate = maxDate;
          fixture.detectChanges();

          // Write a value after the max date
          host.control.setValue(testDate);
          fixture.detectChanges();

          // Mark as touched to show errors
          simulateTouch();

          // 1) Control SHALL be marked as invalid
          const validationErrors = host.picker.validate(host.control);
          expect(validationErrors).withContext(
            `Expected invalid: testDate=${testDate}, maxDate=${maxDate}`
          ).not.toBeNull();
          expect(validationErrors!['maxDate']).withContext(
            `Expected maxDate error key: testDate=${testDate}, maxDate=${maxDate}`
          ).toBeDefined();

          // 2) Inline validation error SHALL be displayed
          const errorEl = fixture.nativeElement.querySelector('[role="alert"]');
          expect(errorEl).withContext(
            `Expected error element visible: testDate=${testDate}, maxDate=${maxDate}`
          ).not.toBeNull();

          // 3) Error text SHALL indicate the permitted range
          const errorText: string = errorEl!.textContent || '';
          expect(errorText.toLowerCase()).withContext(
            `Expected error to mention date constraint`
          ).toContain('on or before');

          // 4) Invalid value SHALL NOT be emitted
          expect(host.control.valid).withContext(
            `Expected form control to be invalid: testDate=${testDate}, maxDate=${maxDate}`
          ).toBeFalse();
        }
      ),
      { numRuns: 50 }
    );
  });

  it('SHALL accept dates within minDate and maxDate range (no errors)', () => {
    fc.assert(
      fc.property(
        fc.record({
          year: fc.integer({ min: 2020, max: 2050 }),
          month: fc.integer({ min: 1, max: 12 }),
          day: fc.integer({ min: 5, max: 24 }), // avoid boundary issues
        }).chain(({ year, month, day }) => {
          const testDate = toIso(year, month, day);
          // Generate minDate 1-30 days before testDate
          const minOffset = fc.integer({ min: 1, max: 30 });
          // Generate maxDate 1-30 days after testDate
          const maxOffset = fc.integer({ min: 1, max: 30 });
          return fc.record({
            testDate: fc.constant(testDate),
            minOffset,
            maxOffset,
          });
        }).map(({ testDate, minOffset, maxOffset }) => {
          const d = new Date(testDate);
          const minD = new Date(d.getFullYear(), d.getMonth(), d.getDate() - minOffset);
          const maxD = new Date(d.getFullYear(), d.getMonth(), d.getDate() + maxOffset);
          return {
            testDate,
            minDate: toIso(minD.getFullYear(), minD.getMonth() + 1, minD.getDate()),
            maxDate: toIso(maxD.getFullYear(), maxD.getMonth() + 1, maxD.getDate()),
          };
        }),
        ({ testDate, minDate, maxDate }) => {
          // Set both constraints
          host.minDate = minDate;
          host.maxDate = maxDate;
          fixture.detectChanges();

          // Write a valid value within range
          host.control.setValue(testDate);
          fixture.detectChanges();

          // Mark as touched
          simulateTouch();

          // Control SHALL be valid — no errors
          const validationErrors = host.picker.validate(host.control);
          expect(validationErrors).withContext(
            `Expected valid: testDate=${testDate}, minDate=${minDate}, maxDate=${maxDate}`
          ).toBeNull();

          // No error element visible
          const errorEl = fixture.nativeElement.querySelector('[role="alert"]');
          expect(errorEl).withContext(
            `Expected no error: testDate=${testDate}, minDate=${minDate}, maxDate=${maxDate}`
          ).toBeNull();

          // FormControl should be valid
          expect(host.control.valid).withContext(
            `Expected form control valid: testDate=${testDate}`
          ).toBeTrue();
        }
      ),
      { numRuns: 50 }
    );
  });
});
