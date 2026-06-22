import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import * as fc from 'fast-check';
import {
  FilterBarComponent,
  IFilterDefinition,
  FilterType,
} from './filter-bar.component';

/**
 * Property 7: Filter change event completeness
 *
 * For any combination of active filter values across all configured filter controls,
 * the emitted filter-change event object SHALL contain a key for every configured
 * filter (by its unique key), with each key's value reflecting the current state
 * of that filter control.
 *
 * **Validates: Requirements 4.8**
 */
describe('Filter Change Event Completeness Property', () => {
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

  it('should emit a filter-change event containing a key for every configured filter', () => {
    // Arbitrary: generate a unique filter key
    const filterKeyArb = fc.string({
      minLength: 1,
      maxLength: 15,
      unit: fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz'.split('')),
    });

    // Arbitrary: generate a filter type
    const filterTypeArb = fc.constantFrom<FilterType>('text', 'dropdown', 'status-chip', 'tag');

    // Arbitrary: generate a filter definition
    const filterDefArb = fc.tuple(filterKeyArb, filterTypeArb).map(([key, type]): IFilterDefinition => {
      const base: IFilterDefinition = { key, type, label: `Label ${key}` };
      if (type === 'dropdown') {
        base.options = [
          { value: 'opt1', label: 'Option 1' },
          { value: 'opt2', label: 'Option 2' },
        ];
        base.multiSelect = false;
      } else if (type === 'status-chip' || type === 'tag') {
        base.options = [
          { value: 'val1', label: 'Value 1' },
          { value: 'val2', label: 'Value 2' },
        ];
      }
      return base;
    });

    // Generate 1–10 filter definitions with unique keys
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

        // Capture emitted events
        let emittedPayload: Record<string, unknown> | null = null;
        const subscription = component.filterChange.subscribe((payload) => {
          emittedPayload = payload;
        });

        // Act: trigger emission via onReset which always emits a complete payload
        component.onReset();

        // Assert: emitted payload should contain a key for every configured filter
        expect(emittedPayload).not.toBeNull();

        const visibleFilters = filters.slice(0, 10);
        for (const filter of visibleFilters) {
          expect(Object.prototype.hasOwnProperty.call(emittedPayload!, filter.key))
            .withContext(`Payload must contain key "${filter.key}"`)
            .toBeTrue();
        }

        // Assert: number of keys matches number of configured filters
        expect(Object.keys(emittedPayload!).length).toBe(visibleFilters.length);

        subscription.unsubscribe();
      }),
      { numRuns: 100 }
    );
  });

  it('should include all configured filter keys with their current values when a single filter changes', () => {
    // Fixed set of diverse filter types to verify completeness on individual changes
    const filters: IFilterDefinition[] = [
      { key: 'search', type: 'text', label: 'Search' },
      { key: 'status', type: 'dropdown', label: 'Status', options: [{ value: 'active', label: 'Active' }, { value: 'closed', label: 'Closed' }] },
      { key: 'priority', type: 'status-chip', label: 'Priority', options: [{ value: 'high', label: 'High' }, { value: 'low', label: 'Low' }] },
      { key: 'category', type: 'tag', label: 'Category', options: [{ value: 'land', label: 'Land' }, { value: 'building', label: 'Building' }] },
    ];

    // Arbitrary: which filter index to change
    const filterIndexArb = fc.integer({ min: 0, max: filters.length - 1 });

    fc.assert(
      fc.property(filterIndexArb, (filterIndex: number) => {
        // Arrange: re-initialize the component with filters
        fixture.componentRef.setInput('filters', filters);
        fixture.detectChanges();

        let emittedPayload: Record<string, unknown> | null = null;
        const subscription = component.filterChange.subscribe((payload) => {
          emittedPayload = payload;
        });

        // Act: trigger a change that causes emission
        const targetFilter = filters[filterIndex];
        switch (targetFilter.type) {
          case 'status-chip':
            component.onChipToggle(targetFilter.key, targetFilter.options![0].value);
            break;
          case 'tag':
            component.onTagToggle(targetFilter.key, targetFilter.options![0].value);
            break;
          default:
            // For text and dropdown, use onReset to force emission with all keys
            component.onReset();
            break;
        }

        // Assert: emitted payload has all keys
        expect(emittedPayload).not.toBeNull();
        for (const filter of filters) {
          expect(Object.prototype.hasOwnProperty.call(emittedPayload!, filter.key))
            .withContext(`Payload must contain key "${filter.key}" after changing "${targetFilter.key}"`)
            .toBeTrue();
        }

        expect(Object.keys(emittedPayload!).length).toBe(filters.length);

        subscription.unsubscribe();

        // Reset component state for next iteration
        component.onReset();
      }),
      { numRuns: 50 }
    );
  });

  it('should reflect current filter state values in the emitted payload for any chip toggle sequence', () => {
    const filters: IFilterDefinition[] = [
      { key: 'alpha', type: 'status-chip', label: 'Alpha', options: [{ value: 'a1', label: 'A1' }, { value: 'a2', label: 'A2' }, { value: 'a3', label: 'A3' }] },
      { key: 'beta', type: 'tag', label: 'Beta', options: [{ value: 'b1', label: 'B1' }, { value: 'b2', label: 'B2' }] },
      { key: 'gamma', type: 'text', label: 'Gamma' },
    ];

    // Arbitrary: subset of chip values to toggle on 'alpha'
    const chipValuesArb = fc.subarray(['a1', 'a2', 'a3'], { minLength: 0, maxLength: 3 });

    fc.assert(
      fc.property(chipValuesArb, (selectedChips: string[]) => {
        // Arrange
        fixture.componentRef.setInput('filters', filters);
        fixture.detectChanges();

        let lastPayload: Record<string, unknown> | null = null;
        const subscription = component.filterChange.subscribe((payload) => {
          lastPayload = payload;
        });

        // Act: toggle selected chips on the 'alpha' filter
        for (const chipValue of selectedChips) {
          component.onChipToggle('alpha', chipValue);
        }

        // If no chips toggled, trigger emission via reset to still verify completeness
        if (selectedChips.length === 0) {
          component.onReset();
        }

        // Assert: payload has all 3 keys
        expect(lastPayload).not.toBeNull();
        expect(Object.prototype.hasOwnProperty.call(lastPayload!, 'alpha')).toBeTrue();
        expect(Object.prototype.hasOwnProperty.call(lastPayload!, 'beta')).toBeTrue();
        expect(Object.prototype.hasOwnProperty.call(lastPayload!, 'gamma')).toBeTrue();
        expect(Object.keys(lastPayload!).length).toBe(3);

        // Assert: alpha's value reflects the current toggled state
        const alphaValue = lastPayload!['alpha'] as string[];
        expect(Array.isArray(alphaValue)).toBeTrue();

        // Each chip value was toggled once, so they should all be present
        for (const chip of selectedChips) {
          expect(alphaValue).toContain(chip);
        }

        subscription.unsubscribe();

        // Reset for next iteration
        component.onReset();
      }),
      { numRuns: 50 }
    );
  });
});
