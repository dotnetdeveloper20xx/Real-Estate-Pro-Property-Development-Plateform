import { ComponentFixture, TestBed } from '@angular/core/testing';
import * as fc from 'fast-check';
import { FilterBarComponent, IFilterDefinition, IDateRangeValue } from './filter-bar.component';

/**
 * Property 6: Date range validation (end ≥ start)
 *
 * For any pair of dates where the start date is chronologically after the end date,
 * both the filter system's date-range filter and the date-range component SHALL mark
 * the control as invalid, display an inline validation error, and NOT emit the invalid
 * range as a filter/value change event.
 *
 * **Validates: Requirements 4.5, 7.10**
 */
describe('Date Range Validation Property', () => {
  let fixture: ComponentFixture<FilterBarComponent>;
  let component: FilterBarComponent;

  const dateRangeFilter: IFilterDefinition[] = [
    {
      key: 'dateRange',
      type: 'date-range',
      label: 'Date Range',
    },
  ];

  /** Generate a YYYY-MM-DD date string from year, month, day integers */
  function dateStringArb(minYear: number, maxYear: number): fc.Arbitrary<string> {
    return fc
      .record({
        year: fc.integer({ min: minYear, max: maxYear }),
        month: fc.integer({ min: 1, max: 12 }),
        day: fc.integer({ min: 1, max: 28 }), // cap at 28 to avoid invalid dates
      })
      .map(({ year, month, day }) => {
        return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      });
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FilterBarComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FilterBarComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('filters', dateRangeFilter);
    fixture.detectChanges();
  });

  it('should mark as invalid and NOT emit filterChange when start date is after end date', () => {
    // Create the spy once before the property runs
    const filterChangeSpy = spyOn(component.filterChange, 'emit');

    // Arbitrary: generate two distinct date strings where start > end
    const invalidDatePairArb = fc
      .tuple(dateStringArb(2000, 2099), dateStringArb(2000, 2099))
      .filter(([a, b]) => a !== b)
      .map(([a, b]) => {
        // Ensure start > end (invalid range)
        return a > b ? { start: a, end: b } : { start: b, end: a };
      });

    fc.assert(
      fc.property(invalidDatePairArb, ({ start, end }) => {
        // Reset spy calls between iterations
        filterChangeSpy.calls.reset();

        // Act: set the date range value and invoke validation
        const range: IDateRangeValue = { start, end };
        component.filterValues['dateRange'] = range;
        (component as never as Record<string, (key: string, range: IDateRangeValue) => void>)['validateAndEmitDateRange']('dateRange', range);
        fixture.detectChanges();

        // Assert: dateRangeErrors should be set to true
        expect(component.dateRangeErrors['dateRange']).toBeTrue();

        // Assert: filterChange should NOT have been emitted
        expect(filterChangeSpy).not.toHaveBeenCalled();

        // Assert: error message should be displayed in the DOM
        const errorEl = fixture.nativeElement.querySelector('p.text-error[role="alert"]');
        expect(errorEl).toBeTruthy();
        expect(errorEl!.textContent).toContain('End date must be equal to or after start date');
      }),
      { numRuns: 100 }
    );
  });

  it('should clear error and emit filterChange when end date is equal to or after start date', () => {
    // Create the spy once before the property runs
    const filterChangeSpy = spyOn(component.filterChange, 'emit');

    // Arbitrary: generate two date strings where end >= start (valid range)
    const validDatePairArb = fc
      .tuple(dateStringArb(2000, 2099), dateStringArb(2000, 2099))
      .map(([a, b]) => {
        // Ensure start <= end (valid range)
        return a <= b ? { start: a, end: b } : { start: b, end: a };
      });

    fc.assert(
      fc.property(validDatePairArb, ({ start, end }) => {
        // Reset spy calls between iterations
        filterChangeSpy.calls.reset();

        // Act: set the date range value and invoke validation
        const range: IDateRangeValue = { start, end };
        component.filterValues['dateRange'] = range;
        (component as never as Record<string, (key: string, range: IDateRangeValue) => void>)['validateAndEmitDateRange']('dateRange', range);
        fixture.detectChanges();

        // Assert: dateRangeErrors should be false
        expect(component.dateRangeErrors['dateRange']).toBeFalse();

        // Assert: filterChange SHOULD have been emitted
        expect(filterChangeSpy).toHaveBeenCalled();

        // Assert: no error message in DOM
        const errorEl = fixture.nativeElement.querySelector('p.text-error[role="alert"]');
        expect(errorEl).toBeFalsy();
      }),
      { numRuns: 100 }
    );
  });
});
