import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import * as fc from 'fast-check';
import {
  FilterBarComponent,
  IFilterDefinition,
  IDateRangeValue,
  FilterType,
} from './filter-bar.component';

/**
 * Property 8: Filter reset produces empty state
 *
 * For any filter bar state (regardless of which filters are active),
 * invoking the reset action SHALL produce a filter state where all filter
 * values are at their default empty state, the active filter count is zero,
 * and a reset event is emitted.
 *
 * **Validates: Requirements 4.9**
 */
describe('Filter Reset Produces Empty State Property', () => {
  let fixture: ComponentFixture<FilterBarComponent>;
  let component: FilterBarComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FilterBarComponent],
    })
      .overrideComponent(FilterBarComponent, {
        set: { schemas: [NO_ERRORS_SCHEMA] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(FilterBarComponent);
    component = fixture.componentInstance;
  });

  it('should reset all filters to default empty state, set activeFilterCount to 0, and emit resetClick and filterChange', () => {
    // Fixed diverse set of filter definitions covering all types
    const filters: IFilterDefinition[] = [
      { key: 'search', type: 'text', label: 'Search', placeholder: 'Search...' },
      { key: 'status', type: 'dropdown', label: 'Status', options: [{ value: 'active', label: 'Active' }, { value: 'closed', label: 'Closed' }, { value: 'pending', label: 'Pending' }] },
      { key: 'tags', type: 'tag', label: 'Tags', options: [{ value: 'urgent', label: 'Urgent' }, { value: 'review', label: 'Review' }, { value: 'done', label: 'Done' }] },
      { key: 'priority', type: 'status-chip', label: 'Priority', options: [{ value: 'high', label: 'High' }, { value: 'medium', label: 'Medium' }, { value: 'low', label: 'Low' }] },
      { key: 'dateRange', type: 'date-range', label: 'Date Range' },
      { key: 'category', type: 'dropdown', label: 'Category', multiSelect: true, options: [{ value: 'land', label: 'Land' }, { value: 'building', label: 'Building' }, { value: 'commercial', label: 'Commercial' }] },
    ];

    // Arbitrary: which text values to set
    const textValueArb = fc.string({ minLength: 1, maxLength: 50, unit: fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz '.split('')) });

    // Arbitrary: subset of status options to be the selected dropdown value
    const dropdownValueArb = fc.constantFrom('active', 'closed', 'pending', '');

    // Arbitrary: subsets of tag/chip values
    const tagSubsetArb = fc.subarray(['urgent', 'review', 'done'], { minLength: 0, maxLength: 3 });
    const chipSubsetArb = fc.subarray(['high', 'medium', 'low'], { minLength: 0, maxLength: 3 });

    // Arbitrary: date values
    const dateArb = fc.constantFrom('2024-01-15', '2024-06-01', '2024-12-31', '');

    // Arbitrary: multi-select subset
    const multiSelectSubsetArb = fc.subarray(['land', 'building', 'commercial'], { minLength: 0, maxLength: 3 });

    const stateArb = fc.tuple(
      textValueArb,
      dropdownValueArb,
      tagSubsetArb,
      chipSubsetArb,
      dateArb,
      dateArb,
      multiSelectSubsetArb
    );

    fc.assert(
      fc.property(stateArb, ([textVal, dropdownVal, tagVals, chipVals, dateStart, dateEnd, multiSelectVals]) => {
        // Arrange: initialize component with filters
        fixture.componentRef.setInput('filters', filters);
        fixture.detectChanges();

        // Set arbitrary active values to simulate a "dirty" state
        component.filterValues['search'] = textVal;
        component.filterValues['status'] = dropdownVal || null;
        component.filterValues['tags'] = [...tagVals];
        component.filterValues['priority'] = [...chipVals];
        component.filterValues['dateRange'] = { start: dateStart || null, end: dateEnd || null } as IDateRangeValue;
        component.filterValues['category'] = [...multiSelectVals];

        // Track events
        let resetEmitted = false;
        let filterChangePayload: Record<string, unknown> | null = null;

        const resetSub = component.resetClick.subscribe(() => {
          resetEmitted = true;
        });
        const filterChangeSub = component.filterChange.subscribe((payload) => {
          filterChangePayload = payload;
        });

        // Act: invoke reset
        component.onReset();

        // Assert: resetClick event was emitted
        expect(resetEmitted)
          .withContext('resetClick event must be emitted on reset')
          .toBeTrue();

        // Assert: filterChange event was emitted
        expect(filterChangePayload)
          .withContext('filterChange event must be emitted on reset')
          .not.toBeNull();

        // Assert: activeFilterCount is zero
        expect(component.activeFilterCount)
          .withContext('activeFilterCount must be 0 after reset')
          .toBe(0);

        // Assert: all filter values are at their default empty state
        expect(component.filterValues['search'])
          .withContext('text filter must be empty string after reset')
          .toBe('');

        expect(component.filterValues['status'])
          .withContext('single dropdown filter must be null after reset')
          .toBeNull();

        expect(component.filterValues['tags'])
          .withContext('tag filter must be empty array after reset')
          .toEqual([]);

        expect(component.filterValues['priority'])
          .withContext('status-chip filter must be empty array after reset')
          .toEqual([]);

        const dateRangeValue = component.filterValues['dateRange'] as IDateRangeValue;
        expect(dateRangeValue.start)
          .withContext('date-range start must be null after reset')
          .toBeNull();
        expect(dateRangeValue.end)
          .withContext('date-range end must be null after reset')
          .toBeNull();

        expect(component.filterValues['category'])
          .withContext('multi-select dropdown must be empty array after reset')
          .toEqual([]);

        // Assert: filterChange payload also has all keys at default
        expect(filterChangePayload!['search']).toBe('');
        expect(filterChangePayload!['status']).toBeNull();
        expect(filterChangePayload!['tags']).toEqual([]);
        expect(filterChangePayload!['priority']).toEqual([]);
        const payloadDateRange = filterChangePayload!['dateRange'] as IDateRangeValue;
        expect(payloadDateRange.start).toBeNull();
        expect(payloadDateRange.end).toBeNull();
        expect(filterChangePayload!['category']).toEqual([]);

        resetSub.unsubscribe();
        filterChangeSub.unsubscribe();
      }),
      { numRuns: 100 }
    );
  });

  it('should produce empty state for any randomly generated filter configuration', () => {
    // Arbitrary: generate filter key
    const filterKeyArb = fc.string({
      minLength: 1,
      maxLength: 12,
      unit: fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz'.split('')),
    });

    // Arbitrary: generate filter type
    const filterTypeArb = fc.constantFrom<FilterType>('text', 'dropdown', 'date-range', 'status-chip', 'tag');

    // Arbitrary: generate a filter definition
    const filterDefArb = fc.tuple(filterKeyArb, filterTypeArb).map(([key, type]): IFilterDefinition => {
      const base: IFilterDefinition = { key, type, label: `Label ${key}` };
      if (type === 'dropdown') {
        base.options = [
          { value: 'opt1', label: 'Option 1' },
          { value: 'opt2', label: 'Option 2' },
          { value: 'opt3', label: 'Option 3' },
        ];
        base.multiSelect = false;
      } else if (type === 'status-chip' || type === 'tag') {
        base.options = [
          { value: 'v1', label: 'Value 1' },
          { value: 'v2', label: 'Value 2' },
        ];
      }
      return base;
    });

    // Generate 1–10 filters with unique keys
    const filtersArb = fc.uniqueArray(filterDefArb, {
      minLength: 1,
      maxLength: 10,
      selector: (f) => f.key,
    });

    fc.assert(
      fc.property(filtersArb, (filters: IFilterDefinition[]) => {
        // Arrange
        fixture.componentRef.setInput('filters', filters);
        fixture.detectChanges();

        // Make some filters "active" by setting values
        for (const filter of filters) {
          switch (filter.type) {
            case 'text':
              component.filterValues[filter.key] = 'some-value';
              break;
            case 'dropdown':
              component.filterValues[filter.key] = filter.multiSelect ? ['opt1'] : 'opt1';
              break;
            case 'date-range':
              component.filterValues[filter.key] = { start: '2024-03-01', end: '2024-06-30' } as IDateRangeValue;
              break;
            case 'status-chip':
            case 'tag':
              component.filterValues[filter.key] = ['v1'];
              break;
          }
        }

        // Track events
        let resetEmitted = false;
        let filterChangeEmitted = false;

        const resetSub = component.resetClick.subscribe(() => {
          resetEmitted = true;
        });
        const changeSub = component.filterChange.subscribe(() => {
          filterChangeEmitted = true;
        });

        // Act: invoke reset
        component.onReset();

        // Assert: both events emitted
        expect(resetEmitted)
          .withContext('resetClick must be emitted')
          .toBeTrue();
        expect(filterChangeEmitted)
          .withContext('filterChange must be emitted')
          .toBeTrue();

        // Assert: active filter count is zero
        expect(component.activeFilterCount)
          .withContext('activeFilterCount must be 0')
          .toBe(0);

        // Assert: all filter values are at their default empty state
        for (const filter of filters) {
          const value = component.filterValues[filter.key];
          switch (filter.type) {
            case 'text':
              expect(value)
                .withContext(`text filter "${filter.key}" must be empty string`)
                .toBe('');
              break;
            case 'dropdown':
              if (filter.multiSelect) {
                expect(value)
                  .withContext(`multi-select dropdown "${filter.key}" must be empty array`)
                  .toEqual([]);
              } else {
                expect(value)
                  .withContext(`single dropdown "${filter.key}" must be null`)
                  .toBeNull();
              }
              break;
            case 'date-range': {
              const range = value as IDateRangeValue;
              expect(range.start)
                .withContext(`date-range "${filter.key}" start must be null`)
                .toBeNull();
              expect(range.end)
                .withContext(`date-range "${filter.key}" end must be null`)
                .toBeNull();
              break;
            }
            case 'status-chip':
            case 'tag':
              expect(value)
                .withContext(`${filter.type} filter "${filter.key}" must be empty array`)
                .toEqual([]);
              break;
          }
        }

        resetSub.unsubscribe();
        changeSub.unsubscribe();
      }),
      { numRuns: 100 }
    );
  });
});
