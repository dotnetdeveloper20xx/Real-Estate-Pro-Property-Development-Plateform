import { TestBed } from '@angular/core/testing';
import * as fc from 'fast-check';
import { DataTableComponent, IColumnDefinition, ISortChangeEvent } from './data-table.component';

/**
 * Property 3: Table sort direction toggle
 *
 * For any sortable column in the data table, clicking the column header SHALL toggle
 * the sort direction (ascending → descending → ascending) and emit a sort change event
 * containing the column key and new direction. Clicking a different sortable column
 * SHALL reset direction to ascending.
 *
 * **Validates: Requirements 3.3**
 */

/** Generate a valid column key (lowercase letters, 1-10 chars) */
const columnKeyArb = fc.string({
  minLength: 1,
  maxLength: 10,
  unit: fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz'.split('')),
});

/** Generate a unique array of sortable column keys (at least 2 for the "different column" test) */
const sortableColumnKeysArb: fc.Arbitrary<string[]> = fc.uniqueArray(columnKeyArb, { minLength: 2, maxLength: 8 });

function buildColumns(keys: string[]): IColumnDefinition[] {
  return keys.map(key => ({
    key,
    label: key.charAt(0).toUpperCase() + key.slice(1),
    type: 'text' as const,
    sortable: true,
    visible: true,
  }));
}

describe('Table Sort Direction Toggle Property', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DataTableComponent],
    }).compileComponents();
  });

  it('clicking the same column toggles direction asc→desc→asc and emits sort change events', () => {
    fc.assert(
      fc.property(sortableColumnKeysArb, (keys: string[]) => {
        const fixture = TestBed.createComponent(DataTableComponent);
        const component = fixture.componentInstance;

        component.columns = buildColumns(keys);
        component.data = [{ [keys[0]]: 'value' }];
        component.totalCount = 1;
        fixture.detectChanges();

        const emitted: ISortChangeEvent[] = [];
        component.sortChange.subscribe((e: ISortChangeEvent) => emitted.push(e));

        const targetKey = keys[0];

        // First click: should set asc (new column defaults to asc)
        component.onSortColumn(targetKey);
        expect(component.currentSortColumn()).toBe(targetKey);
        expect(component.currentSortDirection()).toBe('asc');
        expect(emitted.length).toBe(1);
        expect(emitted[0]).toEqual({ column: targetKey, direction: 'asc' });

        // Second click: should toggle to desc
        component.onSortColumn(targetKey);
        expect(component.currentSortColumn()).toBe(targetKey);
        expect(component.currentSortDirection()).toBe('desc');
        expect(emitted.length).toBe(2);
        expect(emitted[1]).toEqual({ column: targetKey, direction: 'desc' });

        // Third click: should toggle back to asc
        component.onSortColumn(targetKey);
        expect(component.currentSortColumn()).toBe(targetKey);
        expect(component.currentSortDirection()).toBe('asc');
        expect(emitted.length).toBe(3);
        expect(emitted[2]).toEqual({ column: targetKey, direction: 'asc' });

        fixture.destroy();
      }),
      { numRuns: 50 }
    );
  });

  it('clicking a different sortable column resets direction to ascending', () => {
    fc.assert(
      fc.property(sortableColumnKeysArb, (keys: string[]) => {
        const fixture = TestBed.createComponent(DataTableComponent);
        const component = fixture.componentInstance;

        component.columns = buildColumns(keys);
        component.data = [{ [keys[0]]: 'a', [keys[1]]: 'b' }];
        component.totalCount = 1;
        fixture.detectChanges();

        const emitted: ISortChangeEvent[] = [];
        component.sortChange.subscribe((e: ISortChangeEvent) => emitted.push(e));

        const firstCol = keys[0];
        const secondCol = keys[1];

        // Sort by first column (asc)
        component.onSortColumn(firstCol);
        expect(component.currentSortDirection()).toBe('asc');

        // Toggle to desc on first column
        component.onSortColumn(firstCol);
        expect(component.currentSortDirection()).toBe('desc');

        // Click a different column — should reset to asc
        component.onSortColumn(secondCol);
        expect(component.currentSortColumn()).toBe(secondCol);
        expect(component.currentSortDirection()).toBe('asc');
        expect(emitted.length).toBe(3);
        expect(emitted[2]).toEqual({ column: secondCol, direction: 'asc' });

        fixture.destroy();
      }),
      { numRuns: 50 }
    );
  });
});
