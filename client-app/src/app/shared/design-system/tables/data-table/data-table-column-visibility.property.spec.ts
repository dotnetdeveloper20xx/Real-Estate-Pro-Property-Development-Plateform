import { TestBed } from '@angular/core/testing';
import * as fc from 'fast-check';
import { DataTableComponent, IColumnDefinition } from './data-table.component';

/**
 * Property 5: Table column visibility invariant
 *
 * For any sequence of column visibility toggle operations on the data table,
 * at least one column SHALL remain visible at all times. The column visibility
 * picker SHALL prevent the user from hiding the last visible column.
 *
 * **Validates: Requirements 3.5**
 */

/** Generate a valid column key (lowercase letters, 1-10 chars) */
const columnKeyArb = fc.stringMatching(/^[a-z]{1,10}$/);

/** Generate a unique array of column keys (at least 1 column) */
const columnKeysArb = fc.uniqueArray(columnKeyArb, { minLength: 1, maxLength: 8 });

function buildColumns(keys: string[]): IColumnDefinition[] {
  return keys.map(key => ({
    key,
    label: key.charAt(0).toUpperCase() + key.slice(1),
    type: 'text' as const,
    sortable: false,
    visible: true,
  }));
}

describe('Table Column Visibility Invariant Property', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DataTableComponent],
    }).compileComponents();
  });

  it('at least one column remains visible after any sequence of toggle operations', () => {
    fc.assert(
      fc.property(
        columnKeysArb,
        fc.array(fc.nat(), { minLength: 1, maxLength: 30 }),
        (keys: string[], toggleIndices: number[]) => {
          const fixture = TestBed.createComponent(DataTableComponent);
          const component = fixture.componentInstance;

          component.columns = buildColumns(keys);
          component.data = [];
          component.totalCount = 0;
          component.ngOnInit();

          // Apply a random sequence of toggle operations
          for (const rawIndex of toggleIndices) {
            const colIndex = rawIndex % keys.length;
            const colKey = keys[colIndex];
            component.toggleColumnVisibility(colKey);

            // Invariant: at least one column must remain visible after every toggle
            const visibility = component.columnVisibility();
            const visibleCount = Object.values(visibility).filter(v => v).length;
            expect(visibleCount).toBeGreaterThanOrEqual(1);
          }

          fixture.destroy();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('isLastVisibleColumn returns true for the sole remaining visible column', () => {
    fc.assert(
      fc.property(columnKeysArb, (keys: string[]) => {
        const fixture = TestBed.createComponent(DataTableComponent);
        const component = fixture.componentInstance;

        component.columns = buildColumns(keys);
        component.data = [];
        component.totalCount = 0;
        component.ngOnInit();

        // Hide all columns except the first one
        for (let i = 1; i < keys.length; i++) {
          component.toggleColumnVisibility(keys[i]);
        }

        // The first column should now be the last visible column
        expect(component.isLastVisibleColumn(keys[0])).toBeTrue();

        // All hidden columns should return false for isLastVisibleColumn
        for (let i = 1; i < keys.length; i++) {
          expect(component.isLastVisibleColumn(keys[i])).toBeFalse();
        }

        fixture.destroy();
      }),
      { numRuns: 100 }
    );
  });

  it('toggling the last visible column is prevented (no-op)', () => {
    fc.assert(
      fc.property(columnKeysArb, (keys: string[]) => {
        const fixture = TestBed.createComponent(DataTableComponent);
        const component = fixture.componentInstance;

        component.columns = buildColumns(keys);
        component.data = [];
        component.totalCount = 0;
        component.ngOnInit();

        // Hide all columns except the first one
        for (let i = 1; i < keys.length; i++) {
          component.toggleColumnVisibility(keys[i]);
        }

        // Attempt to hide the last visible column
        component.toggleColumnVisibility(keys[0]);

        // Should still be visible — the toggle was prevented
        const visibility = component.columnVisibility();
        expect(visibility[keys[0]]).toBeTrue();

        // Visible count should still be exactly 1
        const visibleCount = Object.values(visibility).filter(v => v).length;
        expect(visibleCount).toBe(1);

        fixture.destroy();
      }),
      { numRuns: 100 }
    );
  });
});
