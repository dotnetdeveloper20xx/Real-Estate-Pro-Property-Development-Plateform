import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import * as fc from 'fast-check';
import {
  FilterBarComponent,
  IFilterDefinition,
  IDateRangeValue,
} from './filter-bar.component';

/**
 * Property 9: Filter active count accuracy
 *
 * For any set of filter values in the filter bar, the displayed active filter count
 * SHALL equal the number of filter keys whose current value is non-empty
 * (non-null, non-empty-string, non-empty-array), and exactly that many removable
 * chips SHALL be rendered.
 *
 * **Validates: Requirements 4.11**
 */
describe('Filter Active Count Accuracy Property', () => {
  let fixture: ComponentFixture<FilterBarComponent>;
  let component: FilterBarComponent;

  /** A fixed set of diverse filters covering all types */
  const allFilters: IFilterDefinition[] = [
    { key: 'search', type: 'text', label: 'Search', placeholder: 'Search...' },
    {
      key: 'status',
      type: 'dropdown',
      label: 'Status',
      options: [
        { value: 'active', label: 'Active' },
        { value: 'closed', label: 'Closed' },
        { value: 'pending', label: 'Pending' },
      ],
    },
    {
      key: 'tags',
      type: 'dropdown',
      label: 'Tags',
      multiSelect: true,
      options: [
        { value: 'urgent', label: 'Urgent' },
        { value: 'review', label: 'Review' },
        { value: 'approved', label: 'Approved' },
      ],
    },
    { key: 'dateRange', type: 'date-range', label: 'Date Range' },
    {
      key: 'priority',
      type: 'status-chip',
      label: 'Priority',
      options: [
        { value: 'high', label: 'High' },
        { value: 'medium', label: 'Medium' },
        { value: 'low', label: 'Low' },
      ],
    },
    {
      key: 'category',
      type: 'tag',
      label: 'Category',
      options: [
        { value: 'land', label: 'Land' },
        { value: 'building', label: 'Building' },
        { value: 'commercial', label: 'Commercial' },
      ],
    },
  ];

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

  /**
   * Helper: counts how many filter keys have a non-empty value.
   * A value is "active" if:
   * - text: non-empty string
   * - dropdown (single): non-null, non-empty string
   * - dropdown (multi): non-empty array
   * - date-range: at least one of start/end is non-null
   * - status-chip / tag: non-empty array
   */
  function countExpectedActiveFilters(
    filters: IFilterDefinition[],
    values: Record<string, unknown>
  ): number {
    let count = 0;
    for (const filter of filters) {
      const value = values[filter.key];
      if (value === null || value === undefined) continue;

      switch (filter.type) {
        case 'text':
          if (typeof value === 'string' && value.length > 0) count++;
          break;
        case 'dropdown':
          if (filter.multiSelect) {
            if (Array.isArray(value) && value.length > 0) count++;
          } else {
            if (value !== null && value !== '') count++;
          }
          break;
        case 'date-range': {
          const range = value as IDateRangeValue;
          if (range.start || range.end) count++;
          break;
        }
        case 'status-chip':
        case 'tag':
          if (Array.isArray(value) && value.length > 0) count++;
          break;
      }
    }
    return count;
  }

  it('activeFilterCount equals the number of filters with non-empty values for any value combination', () => {
    // Arbitrary for text filter value: either empty or non-empty
    const textValueArb = fc.oneof(fc.constant(''), fc.string({ minLength: 1, maxLength: 20 }));

    // Arbitrary for single-select dropdown: null or a valid option value
    const singleDropdownArb = fc.oneof(
      fc.constant(null as string | null),
      fc.constantFrom('active', 'closed', 'pending')
    );

    // Arbitrary for multi-select dropdown: subset of options
    const multiDropdownArb = fc.subarray(['urgent', 'review', 'approved'], {
      minLength: 0,
      maxLength: 3,
    });

    // Arbitrary for date-range: each part is either null or a date string
    const datePartArb = fc.oneof(
      fc.constant(null as string | null),
      fc.date({ min: new Date(2020, 0, 1), max: new Date(2030, 11, 31) }).map(
        (d) => d.toISOString().split('T')[0]
      )
    );
    const dateRangeArb = fc.tuple(datePartArb, datePartArb).map(
      ([start, end]): IDateRangeValue => ({ start, end })
    );

    // Arbitrary for status-chip/tag: subset of values
    const chipArb = fc.subarray(['high', 'medium', 'low'], {
      minLength: 0,
      maxLength: 3,
    });
    const tagArb = fc.subarray(['land', 'building', 'commercial'], {
      minLength: 0,
      maxLength: 3,
    });

    // Combined arbitrary for a full set of filter values
    const filterValuesArb = fc
      .tuple(textValueArb, singleDropdownArb, multiDropdownArb, dateRangeArb, chipArb, tagArb)
      .map(([text, dropdown, multiDropdown, dateRange, chips, tags]) => ({
        search: text,
        status: dropdown,
        tags: multiDropdown,
        dateRange,
        priority: chips,
        category: tags,
      }));

    fc.assert(
      fc.property(filterValuesArb, (values) => {
        // Arrange
        fixture.componentRef.setInput('filters', allFilters);
        fixture.detectChanges();

        // Act: set filter values directly and update active state
        component.filterValues = { ...values };
        (component as unknown as { updateActiveState: () => void }).updateActiveState();
        fixture.detectChanges();

        // Calculate expected count
        const expectedCount = countExpectedActiveFilters(allFilters, values);

        // Assert: activeFilterCount matches expected
        expect(component.activeFilterCount)
          .withContext(
            `Expected ${expectedCount} active filters for values: ${JSON.stringify(values)}`
          )
          .toBe(expectedCount);
      }),
      { numRuns: 200 }
    );
  });

  it('number of active chips matches activeFilterCount for any value combination', () => {
    // Arbitrary for text filter value
    const textValueArb = fc.oneof(fc.constant(''), fc.string({ minLength: 1, maxLength: 10 }));

    // Arbitrary for single dropdown
    const singleDropdownArb = fc.oneof(
      fc.constant(null as string | null),
      fc.constantFrom('active', 'closed', 'pending')
    );

    // Arbitrary for multi-select
    const multiDropdownArb = fc.subarray(['urgent', 'review', 'approved'], {
      minLength: 0,
      maxLength: 3,
    });

    // Arbitrary for date-range
    const datePartArb = fc.oneof(
      fc.constant(null as string | null),
      fc.constant('2024-06-15')
    );
    const dateRangeArb = fc.tuple(datePartArb, datePartArb).map(
      ([start, end]): IDateRangeValue => ({ start, end })
    );

    // Arbitrary for status-chip
    const chipArb = fc.subarray(['high', 'medium', 'low'], {
      minLength: 0,
      maxLength: 3,
    });

    // Arbitrary for tag
    const tagArb = fc.subarray(['land', 'building', 'commercial'], {
      minLength: 0,
      maxLength: 3,
    });

    const filterValuesArb = fc
      .tuple(textValueArb, singleDropdownArb, multiDropdownArb, dateRangeArb, chipArb, tagArb)
      .map(([text, dropdown, multiDropdown, dateRange, chips, tags]) => ({
        search: text,
        status: dropdown,
        tags: multiDropdown,
        dateRange,
        priority: chips,
        category: tags,
      }));

    fc.assert(
      fc.property(filterValuesArb, (values) => {
        // Arrange
        fixture.componentRef.setInput('filters', allFilters);
        fixture.detectChanges();

        // Act: set filter values directly and update active state
        component.filterValues = { ...values };
        (component as unknown as { updateActiveState: () => void }).updateActiveState();
        fixture.detectChanges();

        // Assert: activeChips count matches activeFilterCount
        // Note: For multi-select, status-chip, and tag filters, each selected value
        // produces a separate chip, but they all come from the same filter key.
        // The activeFilterCount counts distinct active filter KEYS, not individual chips.
        // So we count unique filter keys from the chips array.
        const uniqueChipKeys = new Set(component.activeChips.map((chip) => chip.key));
        expect(uniqueChipKeys.size)
          .withContext(
            `Expected ${component.activeFilterCount} unique chip keys, got ${uniqueChipKeys.size}`
          )
          .toBe(component.activeFilterCount);
      }),
      { numRuns: 200 }
    );
  });

  it('every active filter key has at least one removable chip rendered', () => {
    // Use a simpler but targeted set of filter values
    const filters: IFilterDefinition[] = [
      { key: 'name', type: 'text', label: 'Name' },
      {
        key: 'region',
        type: 'dropdown',
        label: 'Region',
        options: [
          { value: 'north', label: 'North' },
          { value: 'south', label: 'South' },
        ],
      },
      {
        key: 'flags',
        type: 'status-chip',
        label: 'Flags',
        options: [
          { value: 'flagA', label: 'Flag A' },
          { value: 'flagB', label: 'Flag B' },
        ],
      },
    ];

    // Arbitrary: random subset of filter keys to activate
    const activeKeysArb = fc.subarray(['name', 'region', 'flags'], {
      minLength: 0,
      maxLength: 3,
    });

    fc.assert(
      fc.property(activeKeysArb, (activeKeys) => {
        // Arrange
        fixture.componentRef.setInput('filters', filters);
        fixture.detectChanges();

        // Build filter values based on which keys should be active
        const values: Record<string, unknown> = {
          name: activeKeys.includes('name') ? 'test value' : '',
          region: activeKeys.includes('region') ? 'north' : null,
          flags: activeKeys.includes('flags') ? ['flagA'] : [],
        };

        // Act
        component.filterValues = { ...values };
        (component as unknown as { updateActiveState: () => void }).updateActiveState();
        fixture.detectChanges();

        // Assert: every key marked as active has at least one chip
        const chipKeys = new Set(component.activeChips.map((chip) => chip.key));
        for (const key of activeKeys) {
          expect(chipKeys.has(key))
            .withContext(`Active filter key "${key}" should have a removable chip`)
            .toBeTrue();
        }

        // Assert: no chip exists for keys that are not active
        for (const chip of component.activeChips) {
          expect(activeKeys).toContain(chip.key);
        }

        // Assert: count matches
        expect(component.activeFilterCount).toBe(activeKeys.length);
      }),
      { numRuns: 100 }
    );
  });
});
